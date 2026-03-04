# Lumera Dental Portal - Agent Guide

## Project Overview

Lumera Dental Portal is a comprehensive dental case management system built for dental labs and clinics. It manages the full lifecycle of dental prosthetics (crowns, bridges, nightguards) from case submission through design, milling, shipping, and billing.

### Core Features
- **Case Management**: Create, track, and manage dental cases with 3D file support (STL, PLY, OBJ)
- **Workflow Pipeline**: Multi-stage production workflow (Design → Milling → Shipping → Completed)
- **Role-Based Access**: Different portals for customers (doctors), lab technicians, milling operators, and admins
- **Financial Tracking**: Automated billing, invoicing, and cost calculations
- **File Storage**: Secure cloud storage for 3D scans, prescriptions, and production files
- **Review System**: Quality control workflow with review requests and approvals

## Technology Stack

### Core Framework
- **Next.js**: 15.1+ with App Router
- **React**: 19.0+
- **TypeScript**: 5.x with strict mode enabled
- **Runtime**: Node.js 22.x

### Database & ORM
- **Prisma**: 5.22.0 with PostgreSQL (SQLite for development)
- **Connection**: Configured for serverless environments (Neon/PostgreSQL)
- **Migrations**: Stored in `prisma/migrations/`

### Styling & UI
- **Tailwind CSS**: v4 with custom design tokens
- **Theme System**: Dark (Midnight Blue) / Light (Porcelain/Lilac) modes
- **Icons**: Lucide React
- **Fonts**: Geist Sans (Vercel font)

### External Services
- **Storage**: Cloudflare R2 (S3-compatible) via AWS SDK v3
- **Email**: Resend API for transactional emails
- **Error Tracking**: Sentry (configured for server, edge, and client)
- **Authentication**: JWT with httpOnly cookies (no external auth provider)

### Key Dependencies
```json
{
  "@aws-sdk/client-s3": "^3.975.0",
  "@prisma/client": "5.22.0",
  "@sentry/nextjs": "^10.37.0",
  "bcryptjs": "^2.4.3",
  "jsonwebtoken": "^9.0.2",
  "resend": "^6.6.0",
  "three": "^0.171.0",
  "zod": "^4.3.5"
}
```

## Project Structure

```
portal/
├── app/                          # Next.js App Router
│   ├── (public pages)/           # Marketing/public pages
│   │   ├── page.tsx              # Homepage
│   │   ├── about/page.tsx
│   │   ├── contact/page.tsx
│   │   ├── work/page.tsx
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   └── setup/page.tsx
│   ├── portal/                   # Protected application portal
│   │   ├── layout.tsx            # Portal layout with sidebar
│   │   ├── cases/                # Case management
│   │   │   ├── page.tsx          # Case list
│   │   │   ├── new/page.tsx      # Create new case
│   │   │   ├── [id]/page.tsx     # Case detail view
│   │   │   └── milling/          # Milling operations
│   │   ├── billing/page.tsx      # Billing dashboard
│   │   └── admin/                # Admin section
│   │       ├── users/page.tsx
│   │       ├── clinics/page.tsx
│   │       ├── addresses/page.tsx
│   │       ├── requests/page.tsx
│   │       └── financials/page.tsx
│   ├── api/                      # API Routes
│   │   ├── auth/                 # Authentication endpoints
│   │   ├── cases/                # Case CRUD & operations
│   │   ├── users/                # User management
│   │   ├── clinics/              # Clinic management
│   │   └── addresses/            # Address management
│   ├── globals.css               # Global styles & CSS variables
│   └── layout.tsx                # Root layout
├── components/                   # React components
│   ├── new-case/                 # New case form components
│   ├── PortalSidebar.tsx
│   ├── FileUploader.tsx
│   ├── STLViewer.tsx
│   ├── ThemeProvider.tsx
│   └── ...
├── lib/                          # Utility libraries
│   ├── auth.ts                   # JWT auth & session handling
│   ├── prisma.ts                 # Prisma client singleton
│   ├── storage.ts                # S3/R2 file operations
│   ├── pricing.ts                # Pricing calculations
│   ├── cost-engine.ts            # Production cost calculations
│   ├── financial_config.ts       # Pricing constants
│   ├── schemas.ts                # Zod validation schemas
│   └── types.ts                  # Shared TypeScript types
├── prisma/
│   ├── schema.prisma             # Database schema
│   ├── migrations/               # Database migrations
│   └── seed.mjs                  # Database seeding
├── middleware.ts                 # Auth middleware for /portal/*
└── next.config.ts                # Next.js config with Sentry
```

## Build & Development Commands

```bash
# Development (uses Turbopack)
npm run dev

# Production build (includes Prisma generate)
npm run build

# Start production server
npm run start

# Linting
npm run lint

# Database commands
npx prisma generate        # Generate Prisma client
npx prisma migrate dev     # Create/run migrations in dev
npx prisma migrate deploy  # Deploy migrations in production
npx prisma db seed         # Seed database
```

### Development Requirements
- Node.js 22.x
- npm >= 10
- For local development: SQLite (no additional setup needed)

## Environment Configuration

Copy `.env.example` to `.env` and configure:

```bash
# Database
DATABASE_URL="file:./dev.db"                    # Dev: SQLite
# DATABASE_URL="postgresql://..."               # Prod: PostgreSQL

# Authentication (REQUIRED for production)
JWT_SECRET="your-32-char-random-string"

# Email (Resend)
RESEND_API_KEY="re_your_api_key"
EMAIL_FROM="Lumera Dental <hello@domain.com>"

# Storage (Cloudflare R2 / S3)
R2_ACCOUNT_ID="your-account-id"
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
AWS_BUCKET_NAME="your-bucket"
```

### Security Checklist for Production
1. Set strong JWT_SECRET (32+ random characters via `openssl rand -base64 32`)
2. Configure PostgreSQL DATABASE_URL
3. Set up Resend API key and verified domain
4. Configure R2/S3 credentials
5. Run `npx prisma migrate deploy`
6. Set `NODE_ENV=production`

## Code Style Guidelines

### TypeScript
- **Strict mode enabled**: All code must be type-safe
- **Path aliases**: Use `@/` prefix for imports (e.g., `@/lib/auth`, `@/components/X`)
- **Types**: Define shared types in `lib/types.ts`
- **Enums**: Use `as const` objects instead of TypeScript enums

### ESLint Configuration
```javascript
// Key rules (see eslint.config.mjs)
"@typescript-eslint/no-explicit-any": "off"      // Allow 'any' when needed
"@typescript-eslint/no-unused-vars": "warn"      // Warn on unused
"react-hooks/exhaustive-deps": "warn"            // Warn on missing deps
"prefer-const": "off"                            // Allow let when preferred
```

### Component Conventions
- **File naming**: PascalCase for components (e.g., `CaseListClient.tsx`)
- **Client components**: Mark with `"use client"` directive when using hooks
- **Server components**: Default; fetch data directly in page components
- **Props interfaces**: Define inline or use type aliases

### CSS/Styling
- **Tailwind v4**: Use `@import "tailwindcss"` in globals.css
- **CSS Variables**: Theme tokens defined in `:root` and `.light` classes
- **Glass effect**: Use `.glass-panel` utility class
- **Custom utilities**: Defined in globals.css (e.g., `.reveal`, `.custom-scrollbar`)

## Authentication & Authorization

### Session Management
- JWT stored in httpOnly cookie named `lumera_session`
- 24-hour expiration (configured in `lib/auth.ts`)
- Secure flag enabled in production
- Session shape: `{ userId, role, clinicId }`

### User Roles
| Role | Description | Access |
|------|-------------|--------|
| `customer` | Doctor/dentist | Own cases, billing, create cases |
| `lab` | Lab technician | All cases, create cases, assign work |
| `admin` | Administrator | Full access including user/clinic management |
| `milling` | Milling operator | Milling dashboard, finance view |
| `sales` | Sales rep | Commission tracking (inferred) |

### Route Protection
- **Middleware** (`middleware.ts`): Redirects unauthenticated users from `/portal/*` to `/login`
- **Layout checks**: `app/portal/layout.tsx` also validates session server-side
- **API protection**: Individual routes check `getSession()`

## Database Schema Overview

### Core Models
- **Clinic**: Dental practice/clinic with billing settings
- **User**: Doctors, lab staff, admins (role-based)
- **DentalCase**: Core case entity with status tracking
- **CaseFile**: Files attached to cases (S3 keys)
- **CaseComment**: Comments with optional file attachments
- **StatusEvent**: Audit log for case status changes
- **Invoice**: Billing invoices linked to clinics
- **Payment**: Payment records
- **Address**: Shared address model for users and clinics
- **RegistrationRequest**: Pending signup approvals

### Key Relationships
- User → Clinic (primary) + Clinics[] (secondary - many-to-many)
- User → User (sales rep → doctors)
- DentalCase → Clinic (required)
- DentalCase → User (doctor, assignee, salesRep)
- DentalCase → CaseFile[] (cascade delete)
- DentalCase → CaseComment[]

### Case Status Flow
```
IN_DESIGN → READY_FOR_REVIEW → APPROVED → IN_MILLING → SHIPPED → COMPLETED → DELIVERED
     ↑           ↓ (rejected)      ↓
     └──── CHANGES_REQUESTED ──────┘
```

## File Storage Architecture

### Storage Provider
- Cloudflare R2 (S3-compatible) configured in `lib/storage.ts`
- Files stored with keys: `cases/{caseId}/{label}_{filename}`
- Signed URLs for secure access (1-hour expiration)
- Presigned URLs for direct browser uploads (10-minute expiration)

### File Types
| Kind | Extensions | Purpose |
|------|------------|---------|
| `STL` | .stl | 3D model files |
| `PLY` | .ply | 3D scan data |
| `OBJ` | .obj | 3D models |
| `PDF` | .pdf | Prescriptions |
| `HTML` | .html | 3D viewer files |
| `OTHER` | * | Miscellaneous |

### Upload Flow
1. Client uploads directly to S3 via presigned URL
2. Key stored in database via `CaseFile` record
3. Retrieval via signed URL generated on-demand

## Financial System

### Pricing Configuration (`lib/financial_config.ts`)
```typescript
// Price tiers: IN_HOUSE vs STANDARD
// Products: ZIRCONIA_HT, ZIRCONIA_ML, EMAX, NIGHTGUARD_HARD, NIGHTGUARD_SOFT
// Unit pricing ranges: $55-125 depending on tier and product
```

### Cost Calculations
- **Revenue**: Calculated from `CLIENT_PRICING` based on clinic tier
- **Costs**: Milling + Design fees from `VENDOR_COSTS`
- **Commission**: $1/unit when case has sales rep
- **Billing**: Supports BILLABLE and WARRANTY types

### Invoice Generation
- Aggregates cases by clinic and billing period
- Accounts for billing cycle day and payment terms
- PDF generation (URL stored, external service implied)

## Testing Strategy

### Current State
- No automated test suite configured
- Manual testing via UI
- Seed scripts (`prisma/seed.mjs`, `seed2.mjs`, `seed3.mjs`) for test data

### Testing Approach
- API routes can be tested via curl/Postman
- Use seed data for consistent test scenarios
- Sentry integration provides error tracking in all environments

## Deployment Notes

### Platform
- Optimized for Vercel deployment
- Sentry tunnel route at `/monitoring`
- Edge and Node.js runtimes both used

### Build Configuration
- Turbopack enabled for dev and production builds
- Increased body size limits: 500MB (for large 3D files)
- Automatic instrumentation for Vercel Cron Monitors

### Database Migration Strategy
```bash
# Pre-deployment
npx prisma migrate deploy

# Post-deployment (if needed)
npx prisma db seed
```

## Common Development Tasks

### Adding a New API Route
1. Create `app/api/{resource}/route.ts` (or `[id]/route.ts` for dynamic)
2. Export HTTP method handlers (GET, POST, etc.)
3. Use `getSession()` for auth validation
4. Use Zod schemas for input validation
5. Return `NextResponse.json()` responses

### Adding a New Page
1. Create directory: `app/portal/{section}/page.tsx`
2. For protected pages: export default async function
3. Call `getSession()` and redirect if null
4. Use server components for data fetching when possible

### Database Schema Changes
1. Edit `prisma/schema.prisma`
2. Run `npx prisma migrate dev --name description`
3. Run `npx prisma generate`
4. Update related type definitions if needed

## Troubleshooting

### Common Issues
| Issue | Solution |
|-------|----------|
| Database connection timeout | Check `pool_timeout` in `lib/prisma.ts` (set to 60s) |
| JWT errors in production | Verify `JWT_SECRET` is set and >= 32 chars |
| File upload failures | Check S3/R2 credentials and bucket permissions |
| Build failures | Ensure `npx prisma generate` runs before build |
| Session not persisting | Check cookie settings (secure flag in prod) |

### Debug Locations
- Server logs: Console output from API routes
- Client errors: Browser devtools + Sentry
- Database: Prisma query logs in development

## Security Considerations

1. **Authentication**: JWT with httpOnly cookies, 24h expiration
2. **Authorization**: Role-based access control on routes and UI
3. **File Access**: All files served via signed URLs (no direct public access)
4. **SQL Injection**: Protected by Prisma ORM
5. **XSS**: React's default escaping, httpOnly cookies prevent token theft
6. **CSRF**: SameSite=lax cookie setting
7. **File Uploads**: Size limits (500MB), type validation via file extensions
8. **Secrets**: Environment variables required in production, validation on startup

---

*Last updated: 2026-02-13*
