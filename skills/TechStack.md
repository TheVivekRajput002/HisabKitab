# Tech Stack & Dependencies - HisabKitab

This document details the exact technology stack, libraries, packages, versions, and third-party APIs used in the HisabKitab project.

## 1. Core Framework & UI Library
The application is built on modern React primitives utilizing the Next.js App Router and the React Compiler.

| Dependency | Version | Purpose |
| :--- | :--- | :--- |
| **Next.js** | `16.1.1` | Core React framework leveraging the App Router. |
| **React** | `19.2.3` | UI Component library. |
| **react-dom** | `19.2.3` | React DOM bindings. |
| **Tailwind CSS** | `^4` | Utility-first CSS framework for rapid UI styling. |
| `@tailwindcss/postcss` | `^4` | PostCSS plugin integrating Tailwind CSS v4. |
| **Lucide React** | `^0.562.0` | Consistent vector icons used throughout the UI. |

## 2. Database & Authentication (BaaS)
The application relies on Supabase for robust PostgreSQL data hosting, Row Level Security (RLS), and file storage.

| Dependency | Version | Purpose |
| :--- | :--- | :--- |
| **@supabase/supabase-js** | `^2.90.1` | Official Supabase client for DB queries, authentication, and storage buckets. |

## 3. Artificial Intelligence & OCR
Generative AI enables "magic" workflows like scanning supplier bills and cheques without manual data entry.

| Dependency | Version | Purpose |
| :--- | :--- | :--- |
| **@google/genai** | `^1.35.0` | Interacting with Google Gemini APIs for OCR and data extraction from invoice/cheque images. |

## 4. PDFs, Charts & Media Utilities
Libraries handling document generation, data visualization, and images.

| Dependency | Version | Purpose |
| :--- | :--- | :--- |
| **@react-pdf/renderer** | `^4.3.2` | Rendering complex React components into PDF documents (e.g., Invoices, Salary Slips). |
| **jspdf** | `^4.0.0` | Client-side PDF generation utilities. |
| **recharts** | `^3.6.0` | Composable charting library building the dashboard analytics metrics (Area charts, Bar graphs). |
| **react-image-crop** | `^11.0.10` | Cropping tool UI allowing users to frame cheques or products before uploading. |
| **qrcode** | `^1.5.4` | Generating 2D QR codes for product tagging and inventory scanning. |

## 5. Internationalization (i18n)
Enabling multi-language support (English/Hindi).

| Dependency | Version | Purpose |
| :--- | :--- | :--- |
| **next-intl** | `^4.7.0` | Comprehensive internationalization plugin engineered for Next.js App Router routing and translation mapping. |

## 6. External APIs & Intents
Services the application communicates with outside of its own database.

| API / Service | Description | Integration Type |
| :--- | :--- | :--- |
| **Google Gemini API** | Transcribing images to JSON via the `@google/genai` library. Requires `GEMINI_API_KEY`. | SDK / API |
| **Supabase REST Edge** | Underlying database connections. Requires `NEXT_PUBLIC_SUPABASE_URL` and `_ANON_KEY`. | SDK / API |
| **WhatsApp Intent/Web** | Used to trigger pre-filled WhatsApp messages to clients (`api.whatsapp.com/send`). | URL Parameter Intent |

## 7. Development & Build Tools

| Dependency | Version | Purpose |
| :--- | :--- | :--- |
| **babel-plugin-react-compiler** | `1.0.0` | Auto-memoization compiler optimizing React component overhead natively. |
| **eslint** | `^9` | Primary linting engine. |
| **eslint-config-next** | `16.1.1` | Next-specific linting configurations. |
