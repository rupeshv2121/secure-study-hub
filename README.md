# Gated Notes - Secure Lecture Viewing Platform

A secure, subscription-based lecture viewing platform built for educational content creators. Students can view notes online with robust protection against unauthorized downloading, copying, or screenshots.

## 🎯 Overview

Gated Notes provides a secure environment for delivering educational content while protecting intellectual property. The platform implements multiple layers of security to prevent content piracy while maintaining a smooth user experience.

## ✨ Features

### For Students
- **Browse Categories & Subjects** - Explore organized educational content
- **Purchase Access** - Buy access to individual subjects
- **Secure Viewing** - View lecture slides in a protected environment
- **Purchase History** - Track all purchased subjects in one place

### For Administrators
- **Content Management** - Create, edit, and organize categories, subjects, and lectures
- **Slide Upload** - Upload PDF slides with automatic image conversion
- **Drag & Drop Reordering** - Easily reorder lectures within subjects
- **Publish Control** - Control when content becomes visible to students

### Security Features
- 🔒 **Content Blurring** - Slides blur when window loses focus
- 🔒 **Dynamic Watermarks** - User email and timestamp overlay on content
- 🔒 **Disabled Shortcuts** - Blocked print, save, and screenshot shortcuts
- 🔒 **Right-Click Protection** - Context menu disabled on secure content
- 🔒 **Signed URLs** - Time-limited access to content files
- 🔒 **Row Level Security** - Database-level access control

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| **React 18** | Frontend framework |
| **TypeScript** | Type safety |
| **Vite** | Build tool & dev server |
| **Tailwind CSS** | Styling |
| **shadcn/ui** | UI component library |
| **Lovable Cloud** | Backend (database, auth, storage) |
| **TanStack Query** | Data fetching & caching |
| **React Router** | Client-side routing |

## 📁 Project Structure

```
src/
├── components/
│   ├── admin/           # Admin panel components
│   │   ├── AdminCategories.tsx
│   │   ├── AdminLectures.tsx
│   │   ├── AdminStats.tsx
│   │   └── AdminSubjects.tsx
│   ├── ui/              # shadcn/ui components
│   ├── BackButton.tsx
│   ├── CategoryCard.tsx
│   ├── LectureCard.tsx
│   ├── Navbar.tsx
│   ├── SecureViewer.tsx # Protected content viewer
│   └── SubjectCard.tsx
├── contexts/
│   └── AuthContext.tsx  # Authentication state
├── hooks/
│   ├── useSecurityProtection.ts
│   ├── useSubjectAccess.ts
│   └── use-mobile.tsx
├── pages/
│   ├── Admin.tsx        # Admin dashboard
│   ├── Auth.tsx         # Login/signup
│   ├── Index.tsx        # Home page
│   ├── Lectures.tsx     # Subject lectures list
│   ├── MyPurchases.tsx  # User purchase history
│   ├── Profile.tsx      # User profile
│   ├── Subjects.tsx     # Category subjects list
│   └── Viewer.tsx       # Secure slide viewer
├── integrations/
│   └── supabase/        # Backend client & types
└── utils/
    └── pdfToImages.ts   # PDF processing utility
```

## 🗄️ Database Schema

### Tables

| Table | Description |
|-------|-------------|
| `categories` | Content categories (e.g., "Mathematics", "Physics") |
| `subjects` | Purchasable subjects within categories |
| `lectures` | Individual lectures within subjects |
| `profiles` | User profile information |
| `user_subject_purchases` | Purchase records |
| `user_roles` | Admin/moderator role assignments |
| `view_logs` | Content access logging |

### Security Model

- **Row Level Security (RLS)** enabled on all tables
- **Role-based access** using `has_role()` function
- **Purchase verification** using `has_purchased_subject()` function
- **Secure purchase processing** via `process_verified_purchase()` function

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ or Bun
- A Lovable account (for backend services)

### Development

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   # or
   bun install
   ```
3. Start the development server:
   ```bash
   npm run dev
   # or
   bun dev
   ```
4. Open [http://localhost:5173](http://localhost:5173)

## Deploying on Vercel

Deploy the frontend as a separate Vercel project with the project root set to `secure-study-hub-frontend`.

Set `VITE_API_URL` to the deployed backend URL so the app can reach the API outside local development.

The included `vercel.json` keeps React Router routes working on refresh by rewriting unknown paths to `index.html`.

## 👤 User Roles

| Role | Capabilities |
|------|--------------|
| **User** | Browse, purchase, view content |
| **Moderator** | User capabilities + content moderation |
| **Admin** | Full access including content management |

## 🔐 Security Implementation

### Content Protection Flow

1. User authenticates and purchases subject access
2. Access verified via `has_purchased_subject()` RLS function
3. Slides served via time-limited signed URLs
4. `SecureViewer` component renders with:
   - Dynamic watermark (email + timestamp)
   - Focus detection with blur overlay
   - Disabled keyboard shortcuts
   - Blocked right-click menu

### RLS Policies

All database operations are protected by Row Level Security:
- Users can only view their own profile and purchases
- Lecture access requires valid purchase
- Admin operations require verified admin role
- No direct client-side purchase insertion (server-verified only)

## 📱 Responsive Design

The platform is fully responsive with:
- Mobile-first Tailwind CSS approach
- Responsive navigation with hamburger menu
- Touch-friendly card layouts
- Adaptive slide viewer

## 🎨 Theming

The design system uses CSS custom properties for theming:
- Light and dark mode support
- Semantic color tokens
- Consistent spacing and typography

## 📄 License

This project is proprietary software. All rights reserved.

---

Built with ❤️ using Rupesh
