# ResumeAI: AI-Powered Resume Builder Platform (Frontend)
**Current Branch:** `feature/UC7-Export-UI`

## 📌 Project Overview / Introduction

**ResumeAI** is a full-stack AI-Powered Resume Builder platform designed to empower job seekers to create, optimize, and export professional resumes with the help of cutting-edge AI language models.

The platform utilizes an AI-powered content layer to generate and optimize resume content for multiple user flows. The application leverages a **Groq-backed OpenAI-compatible API** (using models like `llama-3.1-8b-instant`) through the backend `ai-service`. This enables high-speed generation of professional summaries, bullet points, and real-time ATS feedback.

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

## 🤖 Phase 5: AI Intelligence & Dynamic Builder

This phase integrates advanced AI capabilities and a robust dynamic section management system into the core builder experience.

### AI & Intelligence Features

| Module | Description |
| :--- | :--- |
| **AI Content Engine** | Generate professional summaries and optimize experience bullet points using Groq/Llama models. |
| **ATS Scoring System** | Real-time calculation and display of ATS compatibility scores within the builder toolbar. |
| **AI Feature Quotas** | Managed state system (`quota-state.service.ts`) to track and enforce AI usage limits based on user tiers. |
| **AI API Integration** | Dedicated `ai-api.service.ts` for seamless communication with the backend `ai-service`. |

### Advanced Builder Features

| Module | Description |
| :--- | :--- |
| **Auto-Save System** | `AutoSaveService` ensures no progress is lost by persisting changes to the backend in real-time. |
| **Dynamic Sections** | Modular architecture to add, remove, and reorder resume sections (Experience, Education, Skills, etc.). |
| **Live Preview Engine** | `LivePreviewService` provides an instant visual representation of the resume as data is typed. |
| **Section Persistence** | Full CRUD operations for individual resume sections via `section-api.service.ts`. |

---

## 🖨️ Phase 6: Document Export

This phase focuses on converting the dynamic web-based resume into highly accurate, pixel-perfect documents.

### Export Features

| Module | Description |
| :--- | :--- |
| **Export Service Integration** | Communicates with the backend `export-service` (when applicable) to process document generations. |
| **Client-Side PDF Generation** | Utilizes a zero-latency `window.print` strategy integrated with dynamic CSS `@page` rules to generate pixel-perfect PDF exports directly from the browser without backend overhead. |
| **Export Modal Interface** | Clean, user-friendly UI for selecting export options and monitoring download progress. |

---

## 🛠 Required Environment & Dev Configuration

### 1. Backend Service Connection

The application connects to backend services through the **API Gateway** at `http://localhost:8080`. All API calls are proxied automatically in development via `proxy.conf.json`.

| Endpoint Type | URL |
| :--- | :--- |
| **Auth APIs** | `http://localhost:8080/api/v1/auth` |
| **Template APIs** | `http://localhost:8080/api/v1/templates` |
| **Resume APIs** | `http://localhost:8080/api/v1/resumes` |
| **AI & Section APIs** | `http://localhost:8080/api/v1/ai` & `/api/v1/sections` |
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

Ensure all backend services are running (Eureka → Config Server → Auth Service → API Gateway → Template Service → Resume/Section Service → AI Service) before starting the frontend.

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
│   │   ├── guards/          # AuthGuard
│   │   ├── interceptors/    # JWT interceptor
│   │   └── services/        # AuthService, TemplateService
│   ├── features/
│   │   ├── ai/              # AI Content & Quota services
│   │   ├── auth/            # Login, Register, Profile, OTP flows
│   │   ├── builder/         # Canva-style editor (Sections, Auto-save, Preview)
│   │   ├── dashboard/       # User dashboard
│   │   ├── landing/         # Public landing page
│   │   ├── resume/          # Resume listing & state management
│   │   └── templates/       # Template list & detail
│   └── shared/
│       ├── components/      # Global UI components (Navbar, Toast)
│       └── models/          # TypeScript interfaces
├── styles.scss              # Global design system & CSS tokens
└── index.html
```

---

## ✨ Recent UI & UX Extensions

- **Interactive Resume Builder:** Implemented a Canva-inspired real-time editor for seamless resume customization.
- **AI-Powered Generation:** Added Groq-backed content generation for summaries and work experience.
- **ATS Insights:** Integrated live ATS scoring to help users optimize their resumes for job applications.
- **Tech Stack Overview:** Built with Angular 17 (Standalone Components), SCSS Glassmorphism design, and Angular Signals for optimized performance.

---

## 🛠 Technology Stack

| Category | Technology |
| :--- | :--- |
| **Framework** | Angular 17+ |
| **State Management** | Angular Signals & RxJS |
| **Styling** | SCSS (Glassmorphism), CSS Custom Properties |
| **AI Integration** | Groq / Llama-3.1 (via backend `ai-service`) |
| **Build Tool** | Angular CLI |
| **HTTP Client** | Typed HttpClient with JWT Interceptors |
| **Routing** | Lazy-loaded Standalone Routes |

---

## 🐛 Troubleshooting & UI Fixes

### Recent Critical Fixes
1. **Public Gallery UX Enhancement**: Fixed a perceived CTA issue in the public gallery where the "View Resume" button appeared to trigger no action. Implemented an auto-scroll (`window.scrollTo`) directly to the dynamically updated Spotlight Card to vastly improve user feedback.
2. **Add Section Sidebar Scroll**: Optimized the `app-add-section` layout within the Canva-style builder. Added `overflow-y: auto` and reduced padding from `28px` to `16px` to ensure all section tiles (Summary, Experience, etc.) are scrollable and perfectly fit narrow viewports.
3. **Template Detail Badge Fix**: Resolved a logic error where FREE templates were incorrectly showing a PREMIUM badge. Updated `template-detail.component.ts` to correctly evaluate the `tier` property from the template model.
4. **Template Gallery Render Fix**: Resolved an Angular change detection bug in the Template Gallery where preview iframes remained blank. Replaced internal `Map` state tracking with plain Object references to ensure the UI properly updates when dynamically loaded HTML templates resolve.
5. **Streamlined PDF Export**: Removed legacy, slow backend DOCX processing and optimized the export flow to utilize zero-latency, high-fidelity client-side PDF generation.
