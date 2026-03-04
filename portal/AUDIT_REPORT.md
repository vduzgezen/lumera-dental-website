# Lumera Dental Portal - Security & Architecture Audit Report

**Audit Date:** 2026-03-03  
**Auditor:** Kimi Code CLI  
**Scope:** Full codebase security & architecture review  
**Stack:** Next.js 15, React 19, TypeScript, Prisma, Tailwind CSS

---

## Executive Summary

This audit covers security vulnerabilities, architectural alignment with Feature-Sliced Design, and dead code identification. The codebase shows strong security practices overall with JWT-based authentication using the `jose` library, proper role-based access control on most API routes, and multi-tenant data scoping. However, **2 critical security issues** and **1 medium architectural concern** were identified requiring immediate attention.

### Risk Summary
| Severity | Count | Items |
|----------|-------|-------|
| 🔴 Critical | 2 | Unprotected billing endpoint, Sentry demo route exposed |
| 🟡 Medium | 1 | Component duplication |
| 🟢 Low | 3 | Minor code organization issues |

---

## 1. Security Findings

### 🔴 CRITICAL: Unprotected Stripe Checkout Endpoint

**File:** `app/api/stripe/create-checkout-session/route.ts`  
**Issue:** No authentication or authorization check  
**Risk:** Any unauthenticated user can create checkout sessions for any clinic

**Vulnerable Code:**
```typescript
export async function POST(req: Request) {
  // ❌ NO AUTH CHECK
  const { clinicId, amount, month, year } = await req.json();
  // ... creates checkout session for any clinic
}
```

**Impact:**
- Attackers could create fraudulent invoices
- Billing data could be manipulated
- Financial records could be corrupted

**Remediation:**
```typescript
import { getSession } from "@/lib/auth";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  }
  
  // Additional check: customers can only pay their own clinic's invoices
  const { clinicId } = await req.json();
  if (session.role === "customer" && session.clinicId !== clinicId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  
  // Proceed with checkout creation...
}
```

**Priority:** IMMEDIATE

---

### 🔴 CRITICAL: Sentry Example Routes Exposed in Production

**Files:**
- `app/api/sentry-example-api/route.ts`
- `app/sentry-example-page/page.tsx`

**Issue:** Demo/test routes accessible without authentication  
**Risk:** Information disclosure, potential DoS via error generation

**Evidence:**
```typescript
// app/api/sentry-example-api/route.ts
export function GET() {
  throw new SentryExampleAPIError("This error is raised on the backend...");
}
```

**Impact:**
- Could be used to flood Sentry with errors
- Exposes internal error handling patterns
- Unnecessary attack surface

**Remediation Options:**
1. **Remove entirely** (recommended for production)
2. **Add environment check:**
```typescript
export function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }
  // ... test code
}
```

**Priority:** IMMEDIATE (before production deployment)

---

### 🟢 LOW: Auth Routes Without Session Check (Expected Behavior)

**Files:**
- `app/api/auth/login/route.ts` - ✓ Expected (authentication endpoint)
- `app/api/auth/logout/route.ts` - ✓ Expected (clears cookie, no session needed)
- `app/api/auth/signup/route.ts` - ✓ Expected (registration endpoint)

**Status:** No action required - these are the authentication entry points.

---

### 🟢 LOW: Stripe Webhook Without Session Check (Expected Behavior)

**File:** `app/api/stripe/webhook/route.ts`

**Status:** ✓ **CORRECT** - Webhooks use cryptographic signature verification:
```typescript
const signature = req.headers.get("stripe-signature") as string;
event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
```

This is the industry-standard approach for webhook security.

---

### ✅ Security Strengths Observed

1. **JWT Implementation:** Migrated from `jsonwebtoken` to `jose` for Edge compatibility
2. **No Fallback Secrets:** Strict JWT_SECRET validation with fatal error if missing
3. **httpOnly Cookies:** Session tokens not accessible via JavaScript
4. **Role-Based Access:** Most API routes enforce role checks after session validation
5. **Multi-Tenant Scoping:** Lab users scoped to their milling center:
   ```typescript
   if (session.role === "lab" && session.millingCenterId) {
     whereMilling.millingCenterId = session.millingCenterId;
   }
   ```
6. **Input Validation:** Zod schemas used for case creation and other critical paths
7. **SQL Injection Protection:** Prisma ORM used throughout

---

## 2. Architecture Analysis

### Target Architecture: Feature-Sliced Design

The project aims to follow Feature-Sliced Design (FSD):

```
features/<domain>/          # Feature modules
├── new-case/              # Case creation feature
├── case-dashboard/        # Case detail/view feature
└── admin/                 # Admin management feature

components/                 # Shared components
├── ui/                    # UI primitives (Button, Input, etc.)
├── dentistry/             # Domain-specific shared
└── case-process/          # Process-specific shared
```

### ✅ Architecture Strengths

1. **Feature Isolation:** New case wizard properly isolated in `features/new-case/`
2. **UI Component Library:** `components/ui/` contains reusable primitives
3. **Domain Components:** `components/dentistry/` for dental-specific UI
4. **Centralized Types:** `lib/types.ts` for shared TypeScript definitions
5. **Service Layer:** `lib/prisma.ts`, `lib/storage.ts`, `lib/auth.ts` for infrastructure

---

### 🟡 MEDIUM: Component Duplication

**Issue:** Two `ShippingModal` components exist:

| Component | Location | Import Pattern | Used By |
|-----------|----------|----------------|---------|
| ShippingModal | `components/case-process/ShippingModal.tsx` | Named export `{ ShippingModal }` | `CaseProcessBar.tsx` |
| ShippingModal | `app/portal/cases/milling/ShippingModal.tsx` | Default export | `MillingDashboard.tsx` |

**Code Comparison:**
```typescript
// components/case-process/ShippingModal.tsx (6.5 KB)
export function ShippingModal({ isOpen, busy, ... }: Props) { ... }

// app/portal/cases/milling/ShippingModal.tsx (11 KB)
export default function ShippingModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  initialTracking = "",
  busy = false 
}: Props) { ... }
```

**Risk:**
- Maintenance burden (fix bugs in two places)
- UI inconsistencies between case detail and milling dashboard
- Bundle size inflation

**Remediation:**
1. Analyze differences between implementations
2. Create unified component in `components/shipping/` or `features/shipping/`
3. Update both consumers to use unified component

**Priority:** MEDIUM (before next shipping-related feature)

---

### 🟢 LOW: Stray Components Outside Feature Structure

**Components that could be relocated:**

| Component | Current Location | Proposed Location | Reason |
|-----------|------------------|-------------------|--------|
| `CaseProcessBar.tsx` | `components/` | `features/case-dashboard/components/` | Case-specific feature component |
| `CaseDetailSidebar.tsx` | `components/` | `features/case-dashboard/components/` | Case-specific feature component |
| `CaseListRow.tsx` | `components/` | `features/case-dashboard/components/` | Case-specific feature component |
| `StatusFilter.tsx` | `components/` | `features/case-dashboard/components/` | Case-specific feature component |
| `DesignerPicker.tsx` | `components/` | `features/case-dashboard/components/` | Case-specific feature component |

**Note:** This is architectural debt, not a security issue. Current structure works but doesn't fully leverage FSD benefits.

---

## 3. Dead Code Analysis

### Methodology
- Grepped for imports of each component/file
- Cross-referenced with Next.js page routes
- Checked for exported but unused symbols

### Results: No Critical Dead Code Found

All major components are actively used:

| Component | Status | Used By |
|-----------|--------|---------|
| `DesignerPicker.tsx` | ✅ Used | `CaseDetailSidebar.tsx` |
| `PublicFooter.tsx` | ✅ Used | `page.tsx`, `about/page.tsx`, `contact/page.tsx`, `work/page.tsx` |
| `CaseNotesEditor.tsx` | ✅ Used | `PreferencesTab.tsx` |
| `ToothSelector.tsx` | ✅ Used | `TeethSelection.tsx` |
| `SearchableSelect.tsx` | ✅ Used | `DoctorSelection.tsx`, `UserForm.tsx`, `AddressPicker.tsx` |
| `CopyableId.tsx` | ✅ Used | `FinancialsTable.tsx`, `CaseListRow.tsx`, `page.tsx` (case detail) |
| `AddressPicker.tsx` | ✅ Used | `UserForm.tsx`, `ClinicForm.tsx` |

---

### 🟢 LOW: Potentially Unused Files to Verify

**Files with no obvious imports found:**

1. **File:** `.env.sentry-build-plugin`  
   **Status:** Configuration file - keep

2. **File:** `shade_fix_context.txt`  
   **Status:** Appears to be context/temporary file - **safe to remove**

3. **File:** `file_structure.txt`  
   **Status:** Documentation file - **safe to remove** (outdated)

4. **File:** `context_bundle.txt`  
   **Status:** Appears to be context/temporary file - **safe to remove**

---

## 4. API Route Security Matrix

| Route | Auth | Role Check | Notes |
|-------|------|------------|-------|
| `POST /api/auth/login` | N/A | N/A | ✓ Auth endpoint |
| `POST /api/auth/logout` | N/A | N/A | ✓ Clears cookie |
| `POST /api/auth/signup` | N/A | N/A | ✓ Registration endpoint |
| `POST /api/stripe/webhook` | Signature | N/A | ✓ Stripe signature |
| `POST /api/stripe/create-checkout-session` | ❌ NONE | ❌ NONE | 🔴 **CRITICAL** |
| `GET /api/sentry-example-api` | ❌ NONE | ❌ NONE | 🔴 **CRITICAL** |
| `POST /api/cases/new` | ✅ | ✅ | ✓ All good |
| `GET/POST /api/cases/[id]/*` | ✅ | ✅ | ✓ All good |
| `POST /api/cases/batch/*` | ✅ | ✅ | ✓ All good |
| `GET/POST /api/admin/*` | ✅ | ✅ admin | ✓ All good |
| `GET/POST /api/users/*` | ✅ | ✅ | ✓ All good |
| `GET/POST /api/clinics/*` | ✅ | ✅ | ✓ All good |
| `GET/POST /api/addresses/*` | ✅ | ✅ | ✓ All good |

---

## 5. Recommendations Summary

### Immediate Actions (Before Next Deploy)

1. **🔴 Add auth to Stripe checkout endpoint**
   ```typescript
   const session = await getSession();
   if (!session) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
   ```

2. **🔴 Remove or protect Sentry example routes**
   - Option A: Delete `app/api/sentry-example-api/` and `app/sentry-example-page/`
   - Option B: Add environment check to block in production

### Short-term Improvements (Next Sprint)

3. **🟡 Consolidate ShippingModal components**
   - Merge `components/case-process/ShippingModal.tsx` and `app/portal/cases/milling/ShippingModal.tsx`
   - Extract to shared location

4. **🟢 Clean up temporary files**
   - Remove `shade_fix_context.txt`
   - Remove `file_structure.txt`
   - Remove `context_bundle.txt`

### Long-term Architecture (Next Quarter)

5. **Migrate remaining components to FSD**
   - Move case-related components to `features/case-dashboard/`
   - Establish clear boundaries between features

6. **Add automated security scanning**
   - Consider `eslint-plugin-security` for Node.js
   - Add auth requirement linting rule

---

## 6. Appendix: Security Checklist

### Authentication
- [x] JWT tokens with httpOnly cookies
- [x] Session expiration (24 hours)
- [x] Secure flag in production
- [x] SameSite=lax cookie setting
- [ ] Rate limiting on auth endpoints (NOT IMPLEMENTED)

### Authorization
- [x] Role-based access control
- [x] Multi-tenant data scoping
- [x] Clinic isolation for customer role
- [x] Milling center isolation for lab role
- [ ] Resource-level permissions (e.g., can only access own cases) - PARTIAL

### Data Protection
- [x] SQL injection protection (Prisma)
- [x] XSS protection (React escaping)
- [x] CSRF protection (SameSite cookies)
- [x] No secrets in client bundle
- [ ] Request size limits on all upload endpoints - VERIFY

### Infrastructure
- [x] Environment-based config
- [x] No fallback secrets
- [x] Stripe webhook signature verification
- [ ] API rate limiting - NOT IMPLEMENTED
- [ ] Security headers (CSP, HSTS) - VERIFY

---

**End of Report**

*This audit was conducted using automated analysis tools. Manual review is recommended for high-risk changes.*
