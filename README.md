# ResumeAI: AI-Powered Resume Builder Platform (Frontend)
**Current Branch:** `feature/UC1-Auth-UI`

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

This repository holds the **premium Angular 17+ frontend application** that provides the visual interface and user experience for these platform features.

---

## 🏗 Phase 1: Project Foundation & Authentication (Current)

Currently, the **feature/UC1-Auth-UI** branch of this repository represents **Phase 1** of the frontend architecture. This phase focuses on the core structural foundation, design system, and the complete user identity lifecycle.

### Core Infrastructure & UI Components
- **Angular 17+ Architecture:** Standalone components for modularity and performance.
- **Glassmorphism Design System:** Futuristic UI using CSS Custom Properties for frosted-glass effects and neon accents.
- **Dynamic Theming:** Instant switching between Dark Mode (Default) and Light Mode with state persistence.
- **Security Layer:** Implementation of `jwtInterceptor` and `AuthService` for secure microservices communication.

### Authentication Features
| Module | Description |
| :--- | :--- |
| **`Login/Register`** | Robust forms with real-time validation and error feedback. |
| **`Google OAuth`** | Integrated "Continue with Google" social login flow. |
| **`Identity Recovery`** | UI flows for Forgot Password and Forgot Username via OTP validation. |

---

## 🛠 Required Environment & Dev Configuration

To link the frontend with the microservices backend, ensure the following is set:

### 1. Backend Service Connection
The application currently connects directly to the **Auth Service** to ensure stability during local development:
- **Auth Endpoint:** `http://localhost:8081/api/v1/auth`
- **Google Auth Initiation:** `http://localhost:8081/oauth2/authorization/google`

### 2. Google Cloud Console Requirements
To avoid `redirect_uri_mismatch`, your Google Cloud Project must have:
- **Authorized JavaScript origins:** `http://localhost:4200`
- **Authorized redirect URIs:** `http://localhost:8081/login/oauth2/code/google`

---

## 🚀 How to Run

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start Dev Server**
   ```bash
   npm start
   ```
   Access the UI at [http://localhost:4200](http://localhost:4200).

---
