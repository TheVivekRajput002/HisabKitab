User Flow & Navigation Map - HisabKitab
This document outlines the user journey through the HisabKitab application, mapping the UI components, links, and how tabs intertwine.

1. Global Navigation & Layout
Location: The 
Header.js
 layout serves as the permanent navigation anchor.

Desktop View: A persistent left-hand Sidebar.
Mobile View: A sticky Bottom Navigation bar.
Global Utilities:
Language Switcher: Toggle (EN/HI) available in the top banner. Changes locale globally without navigating away.
Keyboard Shortcuts Help: A floating "(?)" button. Clicking it instantly opens a 
KeyboardShortcutsHelp.js
 modal overlay over the current screen.
Hotkeys: Pressing Ctrl + I from anywhere opens /billing/invoice. Pressing Ctrl + C opens /customer/add.
2. Dashboard (/)
Entry Point: User lands here after authentication.
Contents: Highlights Today's, Weekly, and Monthly sales metrics via Recharts.
Actions & Routing:
Clicking "New Invoice" (Quick Action) -> Navigates to /billing/invoice
Clicking a "Recent Customer" -> Navigates to /customer/[id]
3. Billing & Invoicing Module
Hub Page: /billing

What User Sees: A dashboard summarizing Recent Invoices, Pending Estimates, and action cards.
Actions:
"Create Invoice" Card -> Navigates to /billing/invoice
Inside /billing/invoice: User inputs data. Pressing "Generate" triggers the PDF generator (jspdf) and opens a preview modal. Clicking "Share via WhatsApp" dynamically opens the api.whatsapp.com/send intent link.
"Create Estimate" Card -> Navigates to /billing/estimate
"Manage Bills" Card -> Navigates to a list view /billing/[invoice_estimate] for searching old invoices.
"Scan Invoice via AI" -> Opens /billing/add (or a modal overlay). Uploading an image triggers the scan-invoice API and auto-fills a draft invoice.
4. Customer Module
Hub Page: /customer

What User Sees: Search bar, list of top clients, and an "Add Customer" button.
Actions:
"Add Customer" -> Navigates to /customer/add. A form validates inputs. On save, navigates back to /customer.
"Search Customers" -> Typing activates 
useCustomerSearch
 hook, dynamically showing live results or routing to /customer/search for advanced filtering.
Clicking a Customer Card -> Navigates to /customer/[id] (Detailed Customer Profile).
Inside Profile (/customer/[id]):
"Edit Details" -> Opens an inline editing mode.
"View Ledger" -> Sub-tab showing historical invoices connected to this customer ID. Clicking an invoice here likely opens a PDF preview or navigates to the invoice detail.
5. Inventory Management Module
Hub Page: /inventory

What User Sees: Complete product catalog table with search and filters.
Actions:
"Add Product" -> Navigates to /inventory/add. (Note: Products can also be auto-saved blindly from the Invoice page using 
useProductAutoSave
 if a user types a non-existent item code).
Inline Editing: Clicking a row's "Pencil" icon allows the user to edit Stock Quantities or Selling Price inline without changing the URL.
"Generate QR" -> Triggers a modal displaying a scannable QR code using the qrcode library.
6. Vendor & Purchases Module
Hub Page: /vendor

What User Sees: Grid of Vendor Cards showing total pending bills and quick actions.
Actions:
"Add Vendor" -> Opens a modal overlay to register a new vendor.
"AI Bill Scanner" -> Navigates to /vendor/scanner.
Inside Scanner: User uploads bill photo -> Gemini API processes -> Opens a "Confirmation Modal" mapping extracted items. -> User clicks "Add to Stock" -> Data commits to Supabase and navigates back to /vendor.
"View Bills" on Vendor Card -> Navigates to /vendor/[vendorId]/bills
Inside Bills: Shows table of all purchase invoices from this vendor. Clicking "Add Payment" against a specific bill opens an inline payment drawer/modal.
"View Ledger/Payments" on Vendor Card -> Navigates to /vendor/[vendorId]/payments
Inside Payments: A master ledger of all RTGS/Cheque/Cash payouts made to the vendor over time.
7. Staff & HR Module
Hub Page: /staff

What User Sees: A multi-tab interface (Directory, Attendance, Advances, Salary). Does not navigate away per tab.
Tab Interactions:
Tab 1: Directory: List of staff. "Add Staff" opens a modal.
Tab 2: Attendance: Calendar/Grid view. Clicking a date for a staff member toggles their status (Present -> Half-Day -> Absent).
Tab 3: Advances: Form to quickly deduct loan/advance quantities from a user's upcoming paycheck.
Tab 4: Salary Records: End of month summary. "Generate Slip" triggers a PDF download.
8. Reports & Analytics
Hub Page: /report

What User Sees: High-level dashboard with a Date Picker.
Actions:
Changing the date range triggers Supabase filtering and dynamically updates the Recharts graphs (Area / Bar charts) without a page reload.
Sub-sections display Tables for "Top Selling Products" and "Highest Paying Customers".
Special App Flows (Zero-Click Integrations)
Typing a Product Code in Billing: If a user is on /billing/invoice and types an HSN or Item Code that exists, it instantly pulls the custom_price and gst_rate from /inventory in real-time. If it doesn't exist, it hooks into /inventory/add silently and creates the item for future use.