Product Requirements Document (PRD) - HisabKitab
1. Product Overview
HisabKitab is a comprehensive modern web-based business management system custom-built for SMEs, shop owners, wholesalers, and freelancers. It serves as a centralized hub to track sales, generate invoices, manage inventory, handle vendor relationships, record staff attendance and salaries, and analyze business performance.

A unique value proposition of the system is its heavy integration with AI OCR for automatic data extraction (via Google Gemini) and a highly optimized, keyboard-accessible User Interface, catering to rapid data entry workflows.

2. Target Audience
Small and Medium Enterprises (SMEs) managing day-to-day retail and wholesale transactions.
Freelancers & Contractors needing streamlined invoicing and estimate generation.
Local Businesses in India (implied by built-in HSN codes, custom GST rates, WhatsApp integration, and English/Hindi localization).
Store Managers needing a unified tool to cross-manage inventory, staff, and vendor payouts.
3. Core Functional Requirements
3.1 Dashboard & Analytics
Real-time Metrics: Displays "Today's", "Weekly", and "Monthly" performance metrics (Total Sales, Total Invoices Generated, Best Selling Product, Top Customer).
Charts & Visualizations: Integrated area charts representing comparative sales over customized date ranges.
Quick Actions: Speedy navigation to add invoices, view products, etc.
3.2 Billing & Invoicing
Invoice & Estimate Management: Creation, editing, downloading (as PDF), and direct WhatsApp-sharing of both final Invoices and Estimates.
Tax Engine: Calculations accounting for SGST, CGST, and exclusive/inclusive tax setups securely handled by custom React hooks (
useInvoiceCalculations
).
AI Invoice Scanner: OCR capabilities (powered by Google Gemini API) allowing users to upload photo/PDF bills to automatically extract billing structures and vendor data.
AI Cheque Scanner: AI-based transcription to scan and digitize paper cheques.
3.3 Inventory Management
Product Catalogue: Tracks Product Name, Item Code, HSN Code, Purchase Price, Selling Price, GST configurations, and existing stock.
Stock Tracking: Reorder prompts and direct deductions from total stock during invoice creation.
Barcode/QR Management: Integrated qrcode generation for products.
Auto-save workflows: Automatically saves new products seamlessly when typing un-indexed queries.
3.4 Customer Management
Directory Management: Creating rich customer profiles including generic data alongside details like Vehicle Info (Number, KM), Birthday, & Membership Type.
Ledger & History Tracking: Granular views of a patient/customer's past invoices, generated revenue, and individual purchases.
Search Engine: Advanced client-side search with debounce mechanisms and multi-column filtering.
3.5 Vendor & Purchases Management
Vendor Directory: Tracking names, firm names, dedicated VAT/GST codes, and contact vectors.
Bill Management: Attach vendor-submitted bills directly via OCR or manual entry.
Payments LEDGER: Track multi-phase payments towards specific bills (Status: Pending, Paid, Partial).
3.6 Staff Resource Management
Staff Records: Profiles recording Roles, Contact data, Basic Salary, and active status.
Attendance Tracking: Daily logging mapped to Present, Absent, or Half-day.
Salary Accounting & Advances: Managing loans/salary advances manually, triggering ledger reconciliations ahead of monthly payout generation.
Salary Slips: Automated generation of formal payroll slip documents via PDF.
3.7 Globalization & Accessibility
Multilingual Support (i18n): Deep translation bindings toggled on the fly between English (
en
) and Hindi (hi).
Keyboard-First Routing: Global 
useKeyboardShortcuts
 hooks offering immediate access to actions (e.g., Ctrl+I for new Invoice, Ctrl+Shift+L to lock/logout).
4. Technical Architecture
The backend architecture consists of a relational database provided by Supabase (PostgreSQL). Row Level Security policies (RLS) govern tenant-level isolation ensuring a User (or Company scope) can only view their respective data.

(Note: The detailed database schema, including all tables, constraints, multi-company architecture, and Row Level Security definitions, has been separated into its own comprehensive database_schema.md document.)
5. Technology Stack & Dependencies (Packages)
This project adopts bleeding-edge frameworks utilizing the App Router architecture. Over-the-wire updates are compiled down aggressively using the experimental React Compiler.

5.1 Core Stack
Framework: Next.js (version 16.1.1 - App Router enabled)
UI Library: React (19.2.3), React-DOM (19.2.3)
BaaS & Database: Supabase JS Client (@supabase/supabase-js ^2.90.1)
Styling: Tailwind CSS version 4 (tailwindcss ^4, @tailwindcss/postcss ^4)
5.2 Form, UI & Interactive Dependencies
Icons: Lucide React (lucide-react ^0.562.0)
Data Visualization: Recharts (recharts ^3.6.0)
Image Processing: React Image Crop (react-image-crop ^11.0.10)
QR Code: QRCode generator (qrcode ^1.5.4)
5.3 Specialized Integrations (PDF, AI, i18n)
PDF Generation: @react-pdf/renderer (^4.3.2) paired with jspdf (^4.0.0)
Artificial Intelligence / OCR: Google Gemini AI (@google/genai ^1.35.0)
Internationalization: Next-Intl (next-intl ^4.7.0)
Optimization: React Compiler Plugin (babel-plugin-react-compiler 1.0.0)
6. Development Scripts
npm run dev: Bootstraps local Next.js Edge runtime.
npm run build / npm run start: Handles edge/production builds using standard Next cache hierarchies.
npm run lint: ESLint rules conforming strictly against React/Next paradigms natively built into eslint-config-next.