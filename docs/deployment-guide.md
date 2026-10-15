# DokanSaathi — Production Deployment & Configuration Guide

**Project:** DokanSaathi — English-first SME Finance Copilot for Small Businesses  
**Competition:** 2026 Shenzhen International FinTech Competition (FinTechathon), International Track  
**Deployment Target:** Vercel (Frontend & Serverless API) + Supabase (PostgreSQL Database & Auth)

---

## 1. Local Development Quickstart

DokanSaathi can run completely offline out-of-the-box using the built-in mock AI provider and local demo store, or against live cloud services.

### Prerequisites
- Node.js 18.18+ or 20+
- npm 9+ or pnpm 8+
- Git

### Quick Setup Steps
1. Clone the repository and install dependencies:
   ```bash
   git clone <repository-url>
   cd dokansaathi
   npm install
   ```

2. Configure environment variables:
   ```bash
   cp .env.example .env.local
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

4. Run the automated test suite:
   ```bash
   npm test
   ```

5. Verify TypeScript types:
   ```bash
   npm run typecheck
   ```

---

## 2. Environment Variables Configuration

Copy `.env.example` to `.env.local` for local execution or enter these into your Vercel Project Settings:

| Environment Variable | Required | Description | Example / Recommended Value |
| :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes (for live) | Supabase project URL | `https://xyzcompany.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes (for live) | Public anonymous key for client auth | `eyJhbGciOiJIUzI1NiIsInR5c...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Optional | Server-only elevated key for admin tasks | `eyJhbGciOiJIUzI1NiIsInR5c...` (NEVER prefix with NEXT_PUBLIC_) |
| `AI_PROVIDER` | Yes | AI Extraction provider selection | `mock` (demo/offline) or `gemini` / `openai` |
| `GEMINI_API_KEY` | If using Gemini | Google Gemini API key | `AIzaSy...` |
| `OPENAI_API_KEY` | If using OpenAI | OpenAI API key | `sk-proj-...` |
| `STT_PROVIDER` | Yes | Speech-to-text provider | `mock` or `whisper` |

> **Security Rule:** Never prefix AI provider API keys or the Supabase service-role key with `NEXT_PUBLIC_`. These keys must remain strictly on the server.

---

## 3. Database Migration Setup (Supabase / PostgreSQL)

1. Open your Supabase Dashboard -> **SQL Editor**.
2. Run the migration script located at:
   ```
   supabase/migrations/001_initial_schema.sql
   ```
3. The script idempotently creates:
   - `businesses` table (with currency and timezone)
   - `transactions` table (with 5 canonical types and balance fields)
   - `transaction_audit_events` table (for immutable audit logging)
   - `readiness_checklist_items` table
   - `correction_feedback` table
   - Enables Row-Level Security (RLS) on all tables
   - Applies strict tenant-isolation policies and blocks physical deletion (`USING (false)` on DELETE)

---

## 4. Vercel Production Deployment

1. Push your code to a GitHub / GitLab repository.
2. Log in to [Vercel](https://vercel.com) and click **"Add New Project"**.
3. Select your repository.
4. Framework Preset will auto-detect as **Next.js**.
5. Add the environment variables from Section 2 into the **Environment Variables** section.
6. Click **Deploy**.
7. Test the deployment:
   - Navigate to `/` (Landing page)
   - Go to `/dashboard` (Financial Summary)
   - Test `/transactions/new` (Record Entry with Voice/Text/Manual)
   - Test `/transactions` (Financial Ledger)
   - Test `/readiness` (Financing Record Readiness Checklist)
