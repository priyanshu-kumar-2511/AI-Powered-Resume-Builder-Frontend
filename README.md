# ResumeAI: AI-Powered Resume Builder Platform (Frontend)
**Current Branch:** `feature/UC3-Resume-UI`

## 📌 Project Overview / Introduction

**ResumeAI** is a full-stack AI-Powered Resume Builder platform designed to empower job seekers to create, optimize, and export professional resumes with the help of cutting-edge AI language models.

The platform utilizes a robust dual-AI strategy with cross-model failover to ensure 100% uptime and optimal quality:
*   **Free Tier:** **Google Gemini (1.5 Flash)** is the primary model. If Gemini is unavailable, the system automatically fails over to **Anthropic Claude**.
*   **Premium Tier:** **Anthropic Claude (3.5 Sonnet)** is the primary model for professional-grade quality. If Claude is unavailable, the system automatically fails over to **Google Gemini**.

Features include:
*   Intelligent content generation for Professional Summaries and work experience bullet points.
*   **ATS Compatibility Scoring** against target job descriptions.
*   Automated resume customization to perfectly match live job postings.
*   Exporting dynamic visual CV templates directly to PDF and DOCX formats.
*   **Job Linking:** Calculating a resume-to-job fit score and fetching live job data via **LinkedIn & Naukri APIs** (RapidAPI).

This repository holds the **Angular 17+ frontend application** that provides the visual interface and user experience for these platform features.

---

## 🏗 Phase 1: Project Foundation & Design System

Phase 1 focuses on the core structural foundation, global design system, and routing architecture.

### Core UI Infrastructure

| Module | Description |
| :--- | :--- |
| **Angular 17+ Standalone Architecture** | All components are standalone for maximum modularity and lazy-loading performance. |
| **Glassmorphism Design System** | Futuristic dark-mode UI built with CSS Custom Properties — frosted-glass effects, neon teal accents, and smooth micro-animations. |
| **Global Styles (`styles.scss`)** | Centralized design tokens (colors, spacing, typography, radii) used by every component. |
| **Lazy-Loaded Routing (`app.routes.ts`)** | Each feature module loads on demand — landing, auth, dashboard, templates, profile. |
| **Auth Guard (`auth.guard.ts`)** | Protects dashboard, profile, and template routes; redirects unauthenticated users to login. |
| **JWT Interceptor** | Automatically attaches `Bearer` token to every outgoing API request from `localStorage`. |
| **Proxy Config (`proxy.conf.json`)** | Dev-server proxy routes `/api/**` and `/oauth2/**` requests to the API Gateway at `http://localhost:8080`. |

---

## 🚀 Phase 2: Authentication & Identity

This phase implements the complete user identity lifecycle and connects to the `auth-service` backend.

### Authentication Features

| Module | Route | Description |
| :--- | :--- | :--- |
| **Landing Page** | `/` | Hero section, feature highlights, and CTAs for Sign In and Get Started. |
| **Register** | `/register` | Full registration form with real-time validation (fullName, age, mobile, email, username, password). |
| **Login** | `/login` | Username + password login with JWT token storage. Handles OAuth2 token from query param (`?token=`). |
| **Google OAuth** | — | "Continue with Google" button initiates the Spring Security OAuth2 flow. |
| **LinkedIn OAuth** | — | "Continue with LinkedIn" button initiates the OpenID Connect flow. |
| **Forgot Password** | `/forgot-password` | 3-step OTP flow: enter email → verify OTP → set new password. |
| **Forgot Username** | `/forgot-username` | 2-step OTP flow: enter email + password → verify OTP → username sent by email. |
| **Profile** | `/profile` | View and edit fullName, age, mobileNumber. OAuth users (Google/LinkedIn) are detected automatically — age and mobile are optional for them. |

### Auth Service Integration (`auth.service.ts`)

| Method | Backend Endpoint | Notes |
| :--- | :--- | :--- |
| `login()` | `POST /api/v1/auth/login` | Stores JWT in `localStorage`. |
| `register()` | `POST /api/v1/auth/register` | Full user registration. |
| `getProfile()` | `GET /api/v1/auth/profile` | Fetches user profile; updates `currentUser` signal. |
| `updateProfile()` | `PUT /api/v1/auth/profile` | Updates fullName, age, mobileNumber. |
| `initiatePasswordReset()` | `POST /api/v1/auth/forgot-password/initiate` | Sends `{ identifier }` (email or username) to backend. |
| `verifyPasswordReset()` | `POST /api/v1/auth/forgot-password/verify` | Sends OTP + new password. |
| `loginWithGoogle()` | — | Redirects to `http://localhost:8080/oauth2/authorization/google`. |
| `loginWithLinkedIn()` | — | Redirects to `http://localhost:8080/oauth2/authorization/linkedin`. |

---

## 🎨 Phase 3: Dashboard & Templates

This phase delivers the main application experience after login.

### Dashboard & Template Features

| Module | Route | Description |
| :--- | :--- | :--- |
| **Dashboard** | `/dashboard` | Personalized greeting (name loaded via `getProfile()`), stats bar, toolkit cards, popular templates, and account details. Works for both OAuth and local-login users. |
| **Template List** | `/templates` | Browse all resume templates with category filters (PROFESSIONAL, CREATIVE, MODERN, MINIMALIST, ATS_OPTIMISED) and FREE/PREMIUM tier badges. |
| **Template Detail** | `/templates/:id` | Full preview of a selected template with Apply button. |
| **Template Service (`template.service.ts`)** | — | Connects to `template-service` backend via API Gateway at `/api/v1/templates`. |

---

## 📄 Phase 4: Resume Creation & Management

This phase focuses on the end-to-end workflow of building and managing resumes.

### Resume Features

| Module | Route | Description |
| :--- | :--- | :--- |
| **Resume List** | `/resumes` | View all created resumes with status (DRAFT/COMPLETE) and ATS scores. |
| **Resume Builder** | `/resumes/new` | Interactive builder to create a resume from a selected template. |
| **Public Gallery** | `/gallery` | Showcase of public resumes from the community. |
| **Resume Service (`resume.service.ts`)** | — | Connects to `resume-service` backend via API Gateway at `/api/v1/resumes`. |

---

## 🛠 Required Environment & Dev Configuration

### 1. Backend Service Connection

The application connects to backend services through the **API Gateway** at `http://localhost:8080`. All API calls are proxied automatically in development via `proxy.conf.json`.

| Endpoint Type | URL |
| :--- | :--- |
| **Auth APIs** | `http://localhost:8080/api/v1/auth` |
| **Template APIs** | `http://localhost:8080/api/v1/templates` |
| **Resume APIs** | `http://localhost:8080/api/v1/resumes` |
| **Google OAuth** | `http://localhost:8080/oauth2/authorization/google` |
| **LinkedIn OAuth** | `http://localhost:8080/oauth2/authorization/linkedin` |

### 2. Social Login Configuration

**Google Cloud Console** — Add to your OAuth 2.0 Credentials:
- **Authorized JavaScript origins:** `http://localhost:4200`
- **Authorized redirect URIs:** `http://localhost:8080/login/oauth2/code/google`

**LinkedIn Developer Portal** — Add to your app Auth settings:
- **Authorized redirect URL:** `http://localhost:8080/login/oauth2/code/linkedin`
- **Note:** Enable **"Sign In with LinkedIn using OpenID Connect"** in your LinkedIn app products.

---

## 🚀 How to Run

Ensure all backend services are running (Eureka → Config Server → Auth Service → API Gateway → Template Service) before starting the frontend.

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start Dev Server**
   ```bash
   npm start
   ```
   Access the UI at [http://localhost:4200](http://localhost:4200)

> **Note:** `npm start` uses `--proxy-config proxy.conf.json` automatically. Do NOT run `ng serve` directly without the proxy config or OAuth and API calls will fail due to CORS.

---

## 📁 Project Structure

```
src/
├── app/
│   ├── core/
│   │   ├── guards/          # AuthGuard — protects private routes
│   │   ├── interceptors/    # JWT interceptor — auto-attaches Bearer token
│   │   └── services/        # AuthService, TemplateService
│   ├── features/
│   │   ├── auth/
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   ├── profile/
│   │   │   ├── forgot-password/
│   │   │   └── forgot-username/
│   │   ├── dashboard/       # Main dashboard
│   │   ├── landing/         # Public landing page
│   │   └── templates/       # Template list & detail
│   └── shared/
│       ├── components/
│       │   └── navbar/      # Global navigation bar
│       └── models/          # TypeScript interfaces (models.ts)
├── styles.scss              # Global design system & CSS tokens (Updated: Premium Button Hover Visibility)
└── index.html
```

---

## ✨ Recent UI & UX Improvements

- **Premium Button Hover:** Refined global button hover states (`btn-primary`, `btn-outline`) for maximum readability. Excessive glows and brightness issues have been resolved to match professional high-contrast standards.
- **Template Asset Seeding:** Automated asset folder (`src/assets/templates/`) includes AI-generated realistic thumbnails for all pre-seeded resume templates.
- **Dynamic Routing:** Integrated `resume-service` and `template-service` with the dashboard for a seamless resume-building workflow.

