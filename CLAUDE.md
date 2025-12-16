# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

**Build and Development:**
- `npm run dev` - Start Vite development server (frontend) on port 5173
- `npm run build` - TypeScript compilation + Vite production build
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint for code quality checks

**Development Setup (Dual Server):**
- **Frontend Server**: `npm run dev` - Vite development server on http://localhost:5173
- **API Server**: `vercel dev --listen 3002 --yes` - Vercel dev server for API routes on port 3002
- **Both servers are required** for full functionality during development
- API routes are automatically proxied from frontend server to API server
- Install Vercel CLI globally: `npm install -g vercel`

**Environment Setup:**
1. Copy environment variables: `cp .env.example .env`
2. Configure required services (see .env.example for details):
   - Turso database (database operations)
   - Stripe payments (membership subscriptions)
   - Resend email service (newsletters)
   - Vercel Blob storage (file uploads)
3. Set `VITE_STRIPE_TESTMODE=true` for development

**Development Workflow:**
1. Setup environment variables (see above)
2. Start API server: `vercel dev --listen 3002 --yes`
3. Start frontend server: `npm run dev`
4. Access application at: http://localhost:5173

**Database Operations:**
- `npm run db:generate` - Generate Drizzle migrations
- `npm run db:migrate` - Apply database migrations
- `npm run db:push` - Push schema changes directly
- `npm run db:studio` - Open Drizzle Studio for database inspection

**Utility Scripts:**
- `npm run convert-pdfs` - Convert PDF documents to HTML format

## Architecture Overview

### Database & API Architecture
- **Database**: Turso (SQLite) managed via Drizzle ORM
- **API Layer**: Vercel serverless functions in `/api/` directory
- **Client-Server Separation**: All database operations go through API routes (`/api/lib/turso.js`), never direct client access
- **Authentication**: JWT-based with Zustand store (`src/stores/authStore.ts`)

### Application Structure
- **Frontend**: React 19 + TypeScript + Tailwind CSS v4
- **Routing**: React Router v7 with nested routes in `src/App.tsx`
- **State Management**: Zustand for auth state, React state for component-level data
- **Build System**: Vite with TypeScript compilation

### Route Protection System
- **Public Routes**: Accessible to all users (most pages)
- **Protected Routes**: Require authentication (wrapped in `<ProtectedRoute>`)
- **Admin Routes**: Require `user.isadmin === true` (wrapped in `<AdminRoute>`)
- **Admin Routing Pattern**: `/admin/*` routes are nested and protected

### Content Management System
- **Publications**: Admin can create/edit via QuillEditor at `/admin/publications`
- **Public Publications**: Display-only at `/publications` (homepage publications only)
- **Content Types**: Publications, Communiqués, FAQs with rich text editing
- **File Uploads**: Images and documents via Vercel Blob storage

### Component Organization
- **UI Components**: Reusable components in `src/components/ui/`
- **Layout Components**: Header, Footer, Layout in `src/components/layout/`
- **Auth Components**: Route guards and user management in `src/components/auth/`
- **Page Components**: Route-specific pages in `src/pages/` and `src/pages/admin/`

### Key Patterns

**Authentication Flow:**
```typescript
// Check auth status
const { user, isAuthenticated } = useAuthStore();
// Admin check
if (user?.isadmin) { /* admin logic */ }
```

**API Communication:**
```typescript
// All API calls go through /api/ endpoints
const response = await fetch('/api/publications', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ data, isAdmin: true })
});
```

**Rich Text Editing:**
- Uses `quill-next-react` for WYSIWYG editing
- Content stored as Delta JSON format
- Conversion utilities for display (`deltaToPlainText`)

### Admin vs Public Page Separation
- **Pattern**: Separate admin pages from public pages completely
- **Example**: `/publications` (public) vs `/admin/publications` (admin management)
- **Implementation**: Different components, different routes, clean separation of concerns

### Styling System
- **Tailwind CSS v4** with PostCSS integration
- **Custom Brand Colors**: `srh-blue`, `srh-blue-dark` defined in CSS
- **Responsive**: Mobile-first design approach
- **Typography**: Multiple font families (Inter, Roboto, K2D, IBM Plex Sans)

### File Upload System
- **Images**: Via `ImageUpload` component → Vercel Blob
- **Documents**: Via `DocumentUpload` component → Vercel Blob
- **API Endpoints**: `/api/upload-image.js` and `/api/upload-document.js`

## Important Notes

- **Never git push** - only commit changes, the user will push manually
- **Never access database directly from client code** - all DB operations must go through API routes
- **Authentication is required for admin routes** - use `AdminRoute` wrapper component
- **Rich text content uses QuillEditor Delta format** - provide conversion utilities when displaying
- **File uploads require proper error handling** - images and documents can fail to upload
- **TypeScript is strict** - all components should be properly typed
- **API responses follow consistent format**: `{ success: boolean, data?: any, error?: string }`