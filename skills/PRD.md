Product Requirements Document (PRD) - HisabKitab

1. Product Overview
HisabKitab is a comprehensive modern web-based business management system custom-built for SMEs, shop owners, wholesalers, and freelancers. It serves as a centralized hub to track sales, generate invoices, manage inventory, handle vendor relationships, record staff attendance and salaries, scan vendor bills and cheques, and analyze business performance.

A unique value proposition of the system is its heavy integration with AI OCR for automatic data extraction (via Google Gemini AI with multi-model failover & key rotation) and a highly optimized, keyboard-accessible User Interface, catering to rapid data entry workflows.

2. Target Audience
- Small and Medium Enterprises (SMEs) managing day-to-day retail and wholesale transactions.
- Freelancers & Contractors needing streamlined invoicing and estimate generation.
- Local Businesses in India (implied by built-in HSN codes, custom GST rates, WhatsApp integration, and English/Hindi localization).
- Store Managers needing a unified tool to cross-manage inventory, staff, vendor payouts, and automated bill/cheque digitizing.

3. Core Functional Requirements

3.1 Dashboard & Analytics
- Real-time Metrics: Displays "Today's", "Weekly", and "Monthly" performance metrics (Total Sales, Total Invoices Generated, Best Selling Product, Top Customer).
- Charts & Visualizations: Integrated area charts representing comparative sales over customized date ranges.
- Quick Actions: Speedy navigation to add invoices, view products, scan vendor bills, log cheque payments, etc.

3.2 Billing & Invoicing
- Invoice & Estimate Management: Creation, editing, downloading (as PDF), and direct WhatsApp-sharing of both final Invoices and Estimates.
- Tax Engine: Calculations accounting for SGST, CGST, and exclusive/inclusive tax setups securely handled by custom React hooks (`useInvoiceCalculations`).
- Line Item Management: Dynamic product adding, price calculation, discount percentage/amount toggling, HSN assignment, and stock level warnings.

3.3 AI Bill & Cheque Scanning Engine
- AI Invoice/Bill Scanner (OCR Engine):
  - AI OCR capabilities powered by Google Gemini API allowing users to upload photos/PDFs or use live camera capture for purchase bills and supplier invoices.
  - Multi-Model Failover & API Key Rotation: Resilient scanning engine using `generateGeminiContentWithFailover` (`gemini-3.5-flash-lite` -> `gemini-3.1-flash-lite` -> `gemini-2.5-flash-lite` -> `gemini-2.0-flash`).
  - Automatic JSON Repair: Triggers secondary repair pass via Gemini models if initial OCR output contains malformed syntax.
  - Interactive Scanning UI: Live camera stream, image file dropzone, interactive cropping (`react-image-crop`), rotation, zoom, and real-time processing progress bar.
  - Granular Field Extraction: Extracts Vendor Name, GSTIN, Bill Number, Bill Date, Total Amount, and itemized product tables (Product Name, Part Number, Quantity, Unit, Purchase Rate, HSN Code, GST %, Discount %, Confidence Score per item).
  - Mathematical Reconciliation: Automatically calculates and verifies line item subtotals, applied taxes, and discounts against total bill amount.
  - Direct Action: Scanned data can be instantly committed into vendor bill records, inventory stock, or purchase ledgers.

- AI Cheque Scanner:
  - Specialized Vision OCR prompt optimized for bank cheques and financial paper drafts.
  - Automatic Extraction: Digitizes Amount (figures & words), Cheque Serial Number, Issuing Bank Name, Cheque Date (`YYYY-MM-DD`), Payee/Pay Name, Account Number, IFSC Code, and Memo/Notes.
  - Seamless Payout Flow: Directly pre-fills vendor payment models and cheque logging workflows for instant outward transaction recording.

3.4 Inventory Management
- Product Catalogue: Tracks Product Name, Item Code, HSN Code, Purchase Price, Selling Price, GST configurations, and existing stock.
- Stock Tracking: Reorder prompts and direct deductions from total stock during invoice creation.
- Barcode/QR Management: Integrated barcode generation and QR code creation for products.
- Auto-save workflows: Automatically saves new products seamlessly when typing un-indexed queries during invoice creation or bill scanning.

3.5 Customer Management
- Directory Management: Creating rich customer profiles including generic data alongside details like Vehicle Info (Number, KM), Birthday, & Membership Type.
- Ledger & History Tracking: Granular views of a patient/customer's past invoices, generated revenue, and individual purchases.
- Search Engine: Advanced client-side search with debounce mechanisms and multi-column filtering.

3.6 Vendor & Purchases Management
- Vendor Directory: Comprehensive profile management tracking Vendor Name, Firm/Company Name, GSTIN, Phone, Email, Address, and Bank Account details.
- Vendor Bill Management: Record, view, and organize vendor-submitted bills via manual input or direct AI Bill Scanner OCR import. Tracks bill line items, due dates, and payment status (`unpaid`, `partially paid`, `paid`).
- Vendor Payments Ledger: Record outward payments (Cash, Cheque, UPI, Bank Transfer) linked directly to specific vendor bills or running account balances.
- Integrated Cheque Payout: Native button to open AI Cheque Scanner directly inside vendor payment forms for immediate cheque scanning and receipt logging.
- Vendor Performance & Dues Analytics: Real-time status cards tracking Total Bills, Outstanding Dues / Unpaid Balances, Total Payments Executed, and Vendor Balance history.

3.7 Staff Resource Management
- Staff Records: Profiles recording Roles, Contact data, Basic Salary, and active status.
- Attendance Tracking: Daily logging mapped to Present, Absent, or Half-day.
- Salary Accounting & Advances: Managing loans/salary advances manually, triggering ledger reconciliations ahead of monthly payout generation.
- Salary Slips: Automated generation of formal payroll slip documents via PDF.

3.8 Globalization & Accessibility
- Multilingual Support (i18n): Deep translation bindings toggled on the fly between English (`en`) and Hindi (`hi`) powered by `next-intl`.
- Keyboard-First Routing: Global `useKeyboardShortcuts` hooks offering immediate access to actions (e.g., Ctrl+I for new Invoice, Ctrl+Shift+L to lock/logout).

4. Technical Architecture
The backend architecture consists of a relational database provided by Supabase (PostgreSQL). Row Level Security policies (RLS) govern tenant-level isolation ensuring a User (or Company scope) can only view their respective data.

(Note: The detailed database schema, including all tables, constraints, multi-company architecture, vendor tables (`vendors`, `vendor_bills`, `vendor_payments`), and Row Level Security definitions, is detailed in `database_schema.md`.)

5. Technology Stack & Dependencies (Packages)
This project adopts bleeding-edge frameworks utilizing the App Router architecture. Over-the-wire updates are compiled down aggressively using the experimental React Compiler.

5.1 Core Stack
- Framework: Next.js (version 16.1.1 - App Router enabled)
- UI Library: React (19.2.3), React-DOM (19.2.3)
- BaaS & Database: Supabase JS Client (`@supabase/supabase-js` ^2.90.1)
- Styling: Tailwind CSS version 4 (`tailwindcss` ^4, `@tailwindcss/postcss` ^4)

5.2 Form, UI & Interactive Dependencies
- Icons: Lucide React (`lucide-react` ^0.562.0)
- Data Visualization: Recharts (`recharts` ^3.6.0)
- Image Processing & Scanner Cropping: React Image Crop (`react-image-crop` ^11.0.10)
- Barcode & QR Code: QRCode generator (`qrcode` ^1.5.4)

5.3 Specialized Integrations (PDF, AI, i18n)
- PDF Generation: `@react-pdf/renderer` (^4.3.2) paired with `jspdf` (^4.0.0)
- Artificial Intelligence / OCR Engine: Google Gemini AI (`@google/genai` ^1.35.0) with custom failover handler (`generateGeminiContentWithFailover`)
- Internationalization: Next-Intl (`next-intl` ^4.7.0)
- Optimization: React Compiler Plugin (`babel-plugin-react-compiler` 1.0.0)

6. Development Scripts
- `npm run dev`: Bootstraps local Next.js Edge runtime.
- `npm run build` / `npm run start`: Handles edge/production builds using standard Next cache hierarchies.
- `npm run lint`: ESLint rules conforming strictly against React/Next paradigms natively built into `eslint-config-next`.