User Flow & Navigation Map - HisabKitab

This document outlines the complete user journey through the HisabKitab application, mapping the UI components, links, workflows, and interactive modules.

1. Global Navigation & Layout
- Header & Sidebar Navigation: The system uses a responsive layout anchored by `Header.js` and a persistent sidebar on desktop or a mobile navigation bar.
- Global Utilities:
  - Language Switcher: Toggle between English (`EN`) and Hindi (`HI`) available in the top banner. Changes locale globally without navigating away (`next-intl`).
  - Keyboard Shortcuts Help: Floating "(?)" icon or hotkey. Opens `KeyboardShortcutsHelp.js` modal overlay over any screen.
  - Global Hotkeys: Pressing `Ctrl + I` from anywhere opens `/billing/invoice`. Pressing `Ctrl + Shift + L` locks session / logs out.

2. Dashboard (/)
- Entry Point: User lands here after authentication and company workspace selection.
- Contents: Real-time business KPIs (Today's, Weekly, and Monthly Sales, Invoices Generated, Top Customer, Best Selling Products) powered by Recharts.
- Quick Actions & Routing:
  - "New Invoice" -> Navigates to `/billing/invoice`
  - "Scan Bill / Purchase" -> Navigates to `/vendor/scanner`
  - "Vendor Directory" -> Navigates to `/vendor`
  - "Recent Customer / Invoice" -> Navigates to `/customer/[id]` or `/billing`

3. Billing & Invoicing Module
- Hub Page: `/billing`
- What User Sees: Overview of Recent Invoices, Pending Estimates, quick action cards, and billing search filters.
- Workflows:
  - Create Invoice (`/billing/invoice`): User inputs customer details, selects/searches products (with auto-calculated prices, HSN, and GST via `useInvoiceCalculations`). Generating opens PDF preview modal (`jspdf`) and offers one-click WhatsApp sharing (`api.whatsapp.com/send`).
  - Create Estimate (`/billing/estimate`): Generates pre-invoice estimates converted into final invoices upon customer confirmation.
  - Quick Product Auto-Save: Typing a non-existent product code during invoice creation seamlessly registers the item into inventory (`products`).

4. AI Bill & Cheque Scanning Module
- Scanner Route: `/vendor/scanner` (Accessible via Vendor page or Dashboard quick actions)
- Workflows:

  1. AI Bill Scanner (Purchase Invoice OCR):
     - Step 1: Input Selection — User chooses live web-camera stream capture or drags & drops image/PDF purchase bills.
     - Step 2: Interactive Cropping — Powered by `react-image-crop`, user can crop, rotate, or zoom to isolate invoice boundaries.
     - Step 3: OCR Processing — Progress bar displays execution state while sending base64 image data to `/api/scan-invoice`.
     - Step 4: AI Failover & Repair — Uses `generateGeminiContentWithFailover` (`gemini-3.5-flash-lite` -> fallbacks). If response contains malformed JSON, automatically invokes secondary repair model (`gemini-2.5-flash`).
     - Step 5: Review & Reconciliation — Displays extracted Vendor Name, GSTIN, Bill Number, Date, Total Amount, and Line-Item table (Product Name, Quantity, Purchase Price, HSN, Tax %, Discount %). Subtotals and taxes are auto-reconciled against total bill amount.
     - Step 6: Direct Commit — Clicking "Save Bill & Update Stock" commits `vendor_bills`, updates inventory stock levels (`products.current_stock`), and returns to `/vendor`.

  2. AI Cheque Scanner (Bank Draft OCR):
     - Step 1: Modal / Scanner Activation — User opens Cheque Scanner from `/vendor/scanner` tab or directly inside Vendor Payout forms.
     - Step 2: Capture & Scan — Image captured via camera/upload is dispatched to `/api/scan-check`.
     - Step 3: Data Extraction — Gemini extracts Amount (figures/words), Cheque Serial Number, Bank Name, Cheque Date (`YYYY-MM-DD`), Payee Name, Account Number, IFSC Code, and Notes.
     - Step 4: Auto-Fill & Payout Logging — Auto-populates the Vendor Payment form with extracted fields to record outgoing cheque transactions.

5. Vendor & Purchases Module
- Hub Page: `/vendor`
- What User Sees: Grid of Vendor Cards displaying Firm Name, GSTIN, Total Bills Count, Unpaid Bills Summary, and action buttons.
- Workflows:
  - Add / Edit Vendor: Modal overlay to register vendor profile (Name, Firm Name, GSTIN, Phone, Email, Address, Bank details).
  - Launch AI Scanner: Direct button to navigate to `/vendor/scanner`.
  - View Vendor Bills (`/vendor/[vendorId]/bills`): Lists all purchase bills for the vendor. Shows payment status (`unpaid`, `partially paid`, `paid`). User can open bill details or add payments against a specific bill.
  - View Vendor Ledger & Payments (`/vendor/[vendorId]/payments`): Complete financial ledger of all outward payments (Cash, Cheque, UPI, RTGS) made to the vendor over time.
  - Record Vendor Payment (`/vendor/pay` or Payout Drawer): Opens payout form with direct option to scan paper cheques using AI Cheque Scanner or enter payment details manually. Updates vendor balance and bill payment status.

6. Customer Module
- Hub Page: `/customer`
- What User Sees: Search bar, client list, credit summaries, and "Add Customer" button.
- Workflows:
  - Add Customer (`/customer/add`): Form validating contact info, GSTIN, and vehicle details (for automotive/service businesses).
  - Client Search: Dynamic search via `useCustomerSearch` hook with multi-column filtering.
  - Customer Profile (`/customer/[id]`): Shows client details, past invoice history, outstanding dues, and ledger reports.

7. Inventory Management Module
- Hub Page: `/inventory`
- What User Sees: Master product catalog table with live stock levels, purchase prices, selling prices, HSN codes, and search filters.
- Workflows:
  - Add Product (`/inventory/add`): Manual product registration with selling price, purchase price, HSN, and initial stock.
  - Stock Sync via Bill Scan: Automatically increments current stock when vendor bills are approved in the AI Bill Scanner.
  - QR & Barcode Generation: Clicking "Generate QR/Barcode" triggers modal displaying scannable product tags generated via `qrcode`.
  - Inline Editing: Modify stock quantities or prices inline without navigating away.

8. Staff & HR Module
- Hub Page: `/staff`
- What User Sees: Tabbed interface managing Staff Directory, Attendance, Salary Advances, and Monthly Salary Slips.
- Workflows:
  - Directory: Register staff profiles, roles, and monthly base salary.
  - Attendance Logging: Grid view to toggle daily attendance (`Present`, `Half-Day`, `Absent`).
  - Salary Advances: Record loans or advance deductions against upcoming paychecks.
  - Payroll Generation: Monthly summary calculating net salary after advance deductions and generating downloadable PDF salary slips.

9. Reports & Analytics
- Hub Page: `/report`
- What User Sees: Interactive analytics dashboard with dynamic date range selector.
- Workflows:
  - Date filtering updates Recharts visuals (sales trends, revenue comparison) without page reload.
  - Exportable summaries for Top Selling Products, High-Value Customers, and Vendor Dues.