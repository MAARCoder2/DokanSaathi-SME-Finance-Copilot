-- DokanSaathi: 001_initial_schema.sql
-- Database Schema with Row Level Security (RLS) and Financial Integrity Constraints

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Businesses Table
CREATE TABLE IF NOT EXISTS businesses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL CHECK (char_length(trim(name)) > 0),
    business_type TEXT NOT NULL,
    currency VARCHAR(3) NOT NULL CHECK (currency ~ '^[A-Z]{3}$'),
    timezone TEXT NOT NULL DEFAULT 'Asia/Dhaka',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Enum Types for Transactions
DO $$ BEGIN
    CREATE TYPE transaction_type_enum AS ENUM (
        'SALE',
        'CUSTOMER_PAYMENT',
        'SUPPLIER_BILL',
        'SUPPLIER_PAYMENT',
        'EXPENSE'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE input_source_enum AS ENUM ('voice', 'text', 'manual');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE transaction_status_enum AS ENUM ('active', 'voided');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 4. Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    type transaction_type_enum NOT NULL,
    transaction_date DATE NOT NULL,
    currency VARCHAR(3) NOT NULL CHECK (currency ~ '^[A-Z]{3}$'),
    amount NUMERIC(14, 2) NOT NULL CHECK (amount >= 0),
    amount_collected_at_sale NUMERIC(14, 2) CHECK (amount_collected_at_sale >= 0),
    counterparty_name TEXT,
    related_transaction_id UUID REFERENCES transactions(id) ON DELETE RESTRICT,
    due_date DATE,
    category TEXT,
    note TEXT,
    source input_source_enum NOT NULL DEFAULT 'text',
    status transaction_status_enum NOT NULL DEFAULT 'active',
    idempotency_key TEXT UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),

    -- Integrity Constraints
    CONSTRAINT chk_sale_collection_bounds CHECK (
        (type = 'SALE' AND amount_collected_at_sale IS NOT NULL AND amount_collected_at_sale <= amount) OR
        (type != 'SALE' AND amount_collected_at_sale IS NULL)
    ),
    CONSTRAINT chk_customer_payment_link CHECK (
        (type = 'CUSTOMER_PAYMENT' AND related_transaction_id IS NOT NULL) OR
        (type != 'CUSTOMER_PAYMENT')
    ),
    CONSTRAINT chk_supplier_payment_link CHECK (
        (type = 'SUPPLIER_PAYMENT' AND related_transaction_id IS NOT NULL) OR
        (type != 'SUPPLIER_PAYMENT')
    )
);

CREATE INDEX IF NOT EXISTS idx_transactions_business_period ON transactions (business_id, transaction_date, status);
CREATE INDEX IF NOT EXISTS idx_transactions_related ON transactions (related_transaction_id);

-- 5. Audit Events Table
DO $$ BEGIN
    CREATE TYPE audit_action_enum AS ENUM ('create', 'edit', 'void');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS transaction_audit_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    action audit_action_enum NOT NULL,
    prior_values JSONB,
    new_values JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. Readiness Checklist Items Table
DO $$ BEGIN
    CREATE TYPE checklist_status_enum AS ENUM ('available', 'missing', 'not_applicable', 'unverified');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS readiness_checklist_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    item_id VARCHAR(50) NOT NULL,
    label TEXT NOT NULL,
    status checklist_status_enum NOT NULL DEFAULT 'unverified',
    source TEXT NOT NULL DEFAULT 'general_preparation_item',
    explanation TEXT,
    notes TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(business_id, item_id)
);

-- 7. Correction Feedback Table (Consented Only)
CREATE TABLE IF NOT EXISTS correction_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    raw_input TEXT NOT NULL,
    extracted_draft JSONB NOT NULL,
    corrected_draft JSONB NOT NULL,
    user_consent BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 8. Row Level Security (RLS) Configuration
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE readiness_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE correction_feedback ENABLE ROW LEVEL SECURITY;

-- Helper function: Check business ownership
CREATE OR REPLACE FUNCTION user_owns_business(b_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM businesses 
        WHERE id = b_id AND owner_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS: businesses
CREATE POLICY "Users can view their own businesses"
    ON businesses FOR SELECT
    USING (owner_id = auth.uid());

CREATE POLICY "Users can create their own businesses"
    ON businesses FOR INSERT
    WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update their own businesses"
    ON businesses FOR UPDATE
    USING (owner_id = auth.uid())
    WITH CHECK (owner_id = auth.uid());

-- RLS: transactions
CREATE POLICY "Users can view transactions for their businesses"
    ON transactions FOR SELECT
    USING (user_owns_business(business_id));

CREATE POLICY "Users can insert transactions for their businesses"
    ON transactions FOR INSERT
    WITH CHECK (user_owns_business(business_id));

CREATE POLICY "Users can update transactions for their businesses"
    ON transactions FOR UPDATE
    USING (user_owns_business(business_id))
    WITH CHECK (user_owns_business(business_id));

-- Disallow physical deletion of transactions to preserve audit integrity
CREATE POLICY "Disallow physical deletion of transactions"
    ON transactions FOR DELETE
    USING (false);

-- RLS: transaction_audit_events
CREATE POLICY "Users can view audit events for their businesses"
    ON transaction_audit_events FOR SELECT
    USING (user_owns_business(business_id));

CREATE POLICY "Users can record audit events for their businesses"
    ON transaction_audit_events FOR INSERT
    WITH CHECK (user_owns_business(business_id) AND user_id = auth.uid());

-- RLS: readiness_checklist_items
CREATE POLICY "Users can manage readiness checklist for their businesses"
    ON readiness_checklist_items FOR ALL
    USING (user_owns_business(business_id))
    WITH CHECK (user_owns_business(business_id));

-- RLS: correction_feedback
CREATE POLICY "Users can record consented correction feedback"
    ON correction_feedback FOR ALL
    USING (user_owns_business(business_id))
    WITH CHECK (user_owns_business(business_id) AND user_id = auth.uid());
