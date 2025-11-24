# AI_RULES.md

## Purpose

This document defines the guardrails for all AI coding assistants (ChatGPT, Claude, Gemini, Antigravity, etc.) working on this repository.

The goal is to prevent damage to production systems, avoid accidental schema or logic changes, and ensure that AI-generated code remains safe, consistent, and predictable.

---

## 1. Areas AI Must Never Modify

These directories, files, and system areas are production invariants.

AI systems must not modify, refactor, rename, reorganize, or delete them unless the user explicitly requests it.

### 1.1 Supabase (Critical)
- ❌ No direct schema edits
- ❌ No altering tables, columns, enums
- ❌ No modifying or regenerating `supabase.types.ts`
- ❌ No SQL edits outside proper migrations
- ❌ No modifying RLS policies or functions
- ❌ No "cleanup" or "refactor" of database fields

### 1.2 Authentication
- Auth flow (signup, login, session, logout)
- Role and permission logic
- Token/session handling
- Cookie/secure storage

### 1.3 Email (Resend)
- Email templates
- Email triggers
- Verification/reset flows

### 1.4 Production Configuration
- Environment variable references
- Domain/SSL settings
- Vercel project config
- Supabase project IDs, URLs, or keys

### 1.5 Stable Features

Anything under folders such as:
- `/features/stable/`
- `/invariants/`
- `/core/`

Should be assumed production-ready and off-limits without explicit instructions.

---

## 2. Areas AI May Modify Only With Explicit User Instruction

AI may modify these only when the user clearly asks:
- API integration logic
- Shared helpers used by critical systems
- State management in stable components
- Routing
- PDF export logic
- Local storage
- Edge middleware
- Validation schemas

If there is any uncertainty, the assistant must ask the user for confirmation before changing.

---

## 3. Areas AI Can Modify Freely

These areas are safe for AI to work in:
- New features
- In-progress features
- Experimental components
- UI components not marked as stable
- Documentation
- Helper utilities not tied to invariants

Preferred folder structure for AI-generated work:
- `/features/in-progress`
- `/experiments`
- `/scratch`

---

## 4. Database Change Rules

### 4.1 All changes require migrations

AI must never:
- Modify schema directly
- Write raw SQL that alters tables
- Suggest UI-based schema edits

### 4.2 Required steps for every schema change

1. Generate Supabase migration
2. Review migration with the user
3. Apply to staging
4. Perform smoke tests
5. Promote to production

### 4.3 No schema inference

AI must not add new fields "because TypeScript complained."

---

## 5. Code Generation Rules

### 5.1 Maintain architecture and conventions

AI must:
- Follow existing directory structure
- Preserve naming conventions
- Match existing patterns (data fetching, error handling, hooks, etc.)
- Use the same libraries already used in the repo

### 5.2 No silent refactors

If any change affects core logic:

> "This modification affects production-critical code. Should I proceed?"

### 5.3 No API shape changes

Do not rename:
- API fields
- Type definitions
- Request/response properties

### 5.4 Do not assume the existence of new DB fields

All database references must match `supabase.types.ts`.

---

## 6. Testing & Safety

### 6.1 Required diff summary

Every code output must include a human-readable explanation:
- What changed
- Why
- What to verify
- Any risk

### 6.2 Use feature flags

Risky changes must be wrapped in a flag.

### 6.3 Do not delete code

Deprecate instead.

---

## 7. Deployment Safety

AI systems must assume:
- Production Supabase is never connected to preview deployments
- `.vercel/` and CI/CD configs are off-limits
- Domain + SSL configuration cannot be changed
- No modifying or generating `.env.production`

---

## 8. Clarification Rules

AI must ask the user for confirmation if:
- A change affects authentication
- A change touches schema or shared types
- A change modifies email flows
- A change affects data integrity
- A change impacts routing
- A change touches `/core`, `/invariants`, or `/features/stable`

If unsure:

> "This might affect production. Do you want me to continue?"

---

## 9. Code Organization Rules

- New work → `/features/in-progress`
- Mature work → `/features/stable`
- Shared libraries → `/lib`
- Database access → `/db`
- No new top-level folders without user approval

---

## 10. Monthly Maintenance Ritual (AI-assisted, user-triggered)

AI may help with these, but must not change logic unless asked:
- Remove unused imports
- Improve naming
- Break apart large files
- Cleanup comments
- Consolidate patterns
- Improve documentation

**No schema or auth changes during cleanup.**

---

## 11. Summary

### AI must:
- Protect production
- Protect schema
- Protect stable features
- Follow architecture
- Ask when uncertain

### AI may freely work in:
- New features
- Non-critical UI
- Experimental ideas

**When in doubt, ask.**

---

END OF DOCUMENT
