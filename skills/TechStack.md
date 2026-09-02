# Tech Stack & Dependencies - HisabKitab

This document details the exact technology stack, libraries, packages, versions, API architectures, and third-party integrations used in the HisabKitab project.

## 1. Core Framework & UI Library
The application is built on modern React primitives utilizing the Next.js App Router and the experimental React Compiler.

| Dependency | Version | Purpose |
| :--- | :--- | :--- |
| **Next.js** | `16.1.1` | Core React framework leveraging the App Router architecture. |
| **React** | `19.2.3` | UI Component library. |
| **react-dom** | `19.2.3` | React DOM bindings. |
| **Tailwind CSS** | `^4` | Utility-first CSS framework for rapid responsive UI styling. |
| `@tailwindcss/postcss` | `^4` | PostCSS plugin integrating Tailwind CSS v4. |
| **Lucide React** | `^0.562.0` | Vector icon suite used across navigation, status badges, and action triggers. |

## 2. Database & Multi-Tenant Architecture
The application uses **Supabase** for PostgreSQL database hosting, Row Level Security (RLS), multi-company tenant isolation, and file storage.

| Dependency | Version | Purpose |
| :--- | :--- | :--- |
| **@supabase/supabase-js** | `^2.90.1` | Official Supabase client for database queries, RPC function calls, and storage buckets. |
| **PostgreSQL (Supabase)** | Cloud | Relational database enforcing multi-tenant isolation via `company_id` foreign keys and RLS policies. |

## 3. Artificial Intelligence & Vision OCR Engine
Generative AI enables "magic" automated workflows like scanning purchase bills and bank cheques without manual data entry.

| Dependency / Utility | Version / Specification | Purpose |
| :--- | :--- | :--- |
| **@google/genai** | `^1.35.0` | Official Google Gemini SDK for multi-modal Vision OCR and data extraction from bill and cheque images. |
| `generateGeminiContentWithFailover` | Custom (`/app/api/_lib/geminiFailover.js`) | Resilient API failover utility implementing multi-key rotation and fallback model chaining (`gemini-3.5-flash-lite` -> `gemini-3.1-flash-lite` -> `gemini-2.5-flash-lite` -> `gemini-2.0-flash` -> `gemini-3.1-pro-preview`). Handles status codes 429, 500, 502, 503, 504 and high-demand spikes. |
| **Automated JSON Repair Engine** | Custom (`/app/api/scan-invoice/route.js`) | Secondary Gemini execution pass (`gemini-2.5-flash`) that automatically repairs malformed OCR output into clean, structured JSON schemas. |

## 4. Scanner Utilities, PDFs, Charts & Media
Libraries handling image manipulation, scanner cropping, document generation, data visualization, and codes.

| Dependency | Version | Purpose |
| :--- | :--- | :--- |
| **react-image-crop** | `^11.0.10` | Interactive UI cropping tool allowing users to frame, rotate, and crop bill images or cheques before submitting to AI OCR endpoints. |
| **@react-pdf/renderer** | `^4.3.2` | Component-based PDF document renderer (Invoices, Estimates, Salary Slips). |
| **jspdf** | `^4.0.0` | Client-side PDF compilation and download utilities. |
| **recharts** | `^3.6.0` | Composable charting library building dashboard analytics (Area sales charts, Bar graphs). |
| **qrcode** | `^1.5.4` | Generating 2D QR codes and barcodes for product tagging and quick scanning. |

## 5. Internationalization (i18n)
Enabling multi-language support (English/Hindi).

| Dependency | Version | Purpose |
| :--- | :--- | :--- |
| **next-intl** | `^4.7.0` | Comprehensive internationalization library configured for App Router routing and dynamic locale switching (`en`/`hi`). |

## 6. API Endpoints & External Integrations

| Route / Service | Method | Description & Failover Architecture |
| :--- | :--- | :--- |
| `/api/scan-invoice` | `POST` | Accepts base64 image data. Runs Gemini Vision OCR with multi-model failover + JSON syntax repair to extract Vendor Name, GSTIN, Bill Number, Date, Total Amount, and itemized line products with taxes and discounts. |
| `/api/scan-check` | `POST` | Accepts base64 image data. Runs specialized Gemini Vision OCR prompt to extract Cheque Number, Bank Name, Issue Date, Amount, Payee Name, Account Number, IFSC Code, and Notes. |
| `/api/_lib/geminiFailover` | Helper | Utility managing Gemini API keys (`GEMINI_API_KEYS`), rate limit retry logic, and model fallback chains. |
| **Supabase REST / Realtime** | REST/WS | Real-time database connection authenticated with Supabase Anon / User Token keys. |
| **WhatsApp Intent API** | URL Intent | Generates direct pre-filled WhatsApp share intents (`https://api.whatsapp.com/send?phone=...&text=...`). |

## 7. Development & Optimization Tools

| Dependency | Version | Purpose |
| :--- | :--- | :--- |
| **babel-plugin-react-compiler** | `1.0.0` | Auto-memoization React Compiler plugin optimizing component render trees natively. |
| **eslint** | `^9` | Primary linting engine. |
| **eslint-config-next** | `16.1.1` | ESLint rules conforming strictly against Next.js App Router paradigms. |
