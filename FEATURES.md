# HisabKitab - Detailed Features Documentation

This document provides comprehensive information about all features, functionality, and technical details of the HisabKitab Business Management System.

## 📑 Table of Contents

1. [Dashboard & Analytics](#1-dashboard--analytics)
2. [Billing & Invoicing](#2-billing--invoicing)
3. [Customer Management](#3-customer-management)
4. [Inventory Management](#4-inventory-management)
5. [Vendor Management](#5-vendor-management)
6. [Staff Management](#6-staff-management)
7. [Reports & Analytics](#7-reports--analytics)
8. [Multi-language Support](#8-multi-language-support)
9. [Database Schema](#9-database-schema)
10. [Technical Features](#10-technical-features)

---

## 1. Dashboard & Analytics

**Route:** `/` (Home Page)

### 1.1 Real-time Statistics

The dashboard provides live business metrics updated in real-time:

#### Today's Metrics
- **Bills Sold** - Total number of invoices created today
- **Total Sales** - Sum of all sales for the current day
- **Party Count** - Number of unique customers served today

#### Visual Indicators
- Trending icons (up/down arrows) for quick insights
- Color-coded cards (green for bills, red for sales)
- Responsive card layout for mobile and desktop

### 1.2 Sales Visualization

Interactive line charts displaying sales trends across different time periods:

#### Time Range Options
1. **Today View** - Hourly sales breakdown (24 hours)
2. **This Week** - Daily sales for the past 7 days
3. **This Month** - Daily sales for current month

#### Chart Features
- **Interactive Tooltips** - Hover to see exact sales amounts
- **Smooth Line Graphs** - Monotone curve for better visualization
- **Gradient Fills** - Subtle blue gradient for visual appeal
- **Responsive Design** - Adapts to screen size
- **Smart Data Filtering** - Shows only relevant data points

#### Technical Implementation
- Powered by **Recharts** library
- Real-time data fetching from Supabase
- Dynamic data aggregation based on selected time range
- CartesianGrid with custom styling for clean appearance

### 1.3 Key Metrics Display

- **Total Sale** - Aggregate sales for selected period
- **Dynamic Updates** - Automatic refresh when time range changes
- **Currency Formatting** - Indian numbering system (₹ symbol)
- **Loading States** - Spinner animation during data fetch

---

## 2. Billing & Invoicing

**Route:** `/billing`

### 2.1 Invoice Management

Comprehensive invoice creation and management system.

#### Create Invoice (`/billing/add/invoice`)
- **Customer Selection** - Search and select from customer database
- **Product Addition** - Add multiple line items
- **Automatic Calculations** - Auto-calculate totals, tax, discounts
- **Invoice Numbering** - Auto-generated sequential numbers
- **Date Customization** - Set invoice date (Alt + F2)
- **Payment Methods** - Cash, Online, Unpaid options
- **GST Integration** - GSTIN and GST rate calculations
- **HSN Code Support** - Product-wise HSN/SAC codes

#### Invoice Features
- **Quick Save** - Ctrl + A or Ctrl + S to save
- **PDF Export** - Generate professional PDFs (Ctrl + P)
- **Duplicate Invoice** - Clone existing invoices (Alt + 2)
- **Delete Invoice** - Remove with confirmation (Alt + D)
- **Edit Invoice** - Modify existing invoices
- **Print Preview** - Preview before printing

#### Search Invoices (`/billing/invoice/search`)
- **Advanced Filters** - Search by invoice number, customer, date
- **Date Range Filtering** - Find invoices within specific periods
- **Payment Status Filter** - Filter by paid/unpaid
- **Quick Actions** - View, edit, delete from search results
- **Pagination** - Navigate large invoice lists
- **Sort Options** - Sort by date, amount, customer

### 2.2 Estimate Management

Price quotation system for potential sales.

#### Create Estimate (`/billing/add/estimate`)
- Similar interface to invoice creation
- "Quote" labeling instead of "Invoice"
- No payment tracking (quotes only)
- Convertible to actual invoice
- PDF export capability

#### Search Estimates (`/billing/estimate/search`)
- Search by estimate number or customer
- Date range filtering
- Convert estimates to invoices
- Edit and delete functionality
- Pagination support

### 2.3 OCR Invoice Scanner

**Route:** `/inventory/scanner` (for products) and `/vendor/scanner` (for vendor bills)

AI-powered invoice scanning using Google Gemini.

#### Features
- **Image Upload** - Upload scanned invoice images
- **Image Cropping** - Crop relevant portions with react-image-crop
- **AI Extraction** - Automatic data extraction via Gemini AI
- **Product Detection** - Extracts product names, quantities, rates
- **HSN Code Recognition** - Identifies HSN/SAC codes
- **Bulk Import** - Add multiple products at once
- **Validation** - AI-powered data validation
- **Manual Correction** - Edit extracted data before saving

#### Supported Data Extraction
- Product names
- Quantities
- Unit prices (purchase/sale rates)
- HSN/SAC codes
- SKU numbers
- Vendor information
- Invoice dates and numbers

#### Technical Implementation
- Google Gemini AI API integration
- Image preprocessing with canvas
- Real-time extraction progress
- Error handling and retry logic
- Batch insertion to Supabase

---

## 3. Customer Management

**Route:** `/customer`

### 3.1 Customer Database

Comprehensive customer relationship management.

#### Add Customer (`/customer/add`)
- **Basic Information**
  - Customer Name (required)
  - Phone Number (required)
  - Vehicle Number (optional)
  - Address (optional)
  - GSTIN (optional, for GST compliance)
- **Modal Form** - Quick add without page navigation
- **Validation** - Required field checking
- **Keyboard Shortcut** - Alt + C for inline creation

#### Search Customers (`/customer/search`)
- **Multi-field Search** - Name, phone, vehicle, GSTIN
- **Instant Results** - Real-time filtering as you type
- **Result Cards** - Clean card-based layout
- **Quick Actions** - View details, call, edit, delete
- **Alphabetical Sorting** - Organized customer list

### 3.2 Customer Details View

**Route:** `/customer/[id]` or `/customer1` (split-panel view)

#### Split-Panel Interface (`/customer1`)
- **Left Panel** - Customer search and list
- **Right Panel** - Selected customer details
- **Responsive** - Adapts to mobile screens
- **State Persistence** - Remembers selected customer

#### Customer Information Display
- **Profile Card**
  - Customer name with edit button
  - Phone number with direct dial link
  - Vehicle information
  - Full address
  - GSTIN for tax purposes
- **Inline Editing** - Edit details without page reload
- **Delete Customer** - With confirmation dialog

#### Transaction History
- **Invoice List** - All customer invoices
- **Payment Status** - Paid/Unpaid badges
  - Green badge for "Paid"
  - Orange/Red badge for "Unpaid"
- **Invoice Details**
  - Invoice number (clickable link)
  - Bill date
  - Total amount (₹ formatted)
  - Payment mode (Cash/Online/Unpaid)
- **Click to View** - Navigate to invoice details

#### Analytics Dashboard
- **Total Purchases** - Lifetime customer value
- **Total Paid** - Sum of paid invoices
- **Total Unpaid** - Outstanding balance
- **Color-coded Cards** - Visual distinction for metrics

#### Quick Actions
- **📞 Call** - Direct phone dialer integration
- **✏️ Edit** - Inline editing mode
- **🗑️ Delete** - Remove customer with confirmation
  - Warning: Deletes all associated invoices

---

## 4. Inventory Management

**Route:** `/inventory`

### 4.1 Product Management

Complete product catalog system.

#### Add Product (`/inventory/add`)
- **Product Information**
  - Product Name (required)
  - SKU (Stock Keeping Unit)
  - HSN/SAC Code (for GST)
  - Purchase Rate
  - Sale Rate
  - Stock Quantity
  - Vendor Association
  - Category/Description
- **Validation** - Required field checking
- **Auto-save** - Keyboard shortcuts (Ctrl + A/S)

#### Search Products (`/inventory/search`)
- **Search Filters**
  - Product name
  - SKU number
  - HSN code
  - Vendor
- **Product Cards** - Visual product display
- **Quick Edit** - Modify product details
- **Stock Status** - Low stock indicators
- **Pricing Info** - Purchase and sale rates visible

### 4.2 Product Details

**Route:** `/inventory/[id]`

- **Full Product Information** - All details in one view
- **Stock History** - Track inventory changes
- **Vendor Information** - Linked supplier details
- **Edit Mode** - Update product information
- **Delete Product** - Remove from catalog

### 4.3 QR Code Generation

Generate QR codes for products with embedded information.

#### Features
- **Bulk QR Generation** - Multiple products at once
- **Product Data Encoding**
  - SKU
  - Product name
  - Purchase rate
  - Vendor details
- **PDF Export** - QR codes arranged in printable format
- **Quantity-based** - Generate multiple QR codes per product based on quantity
- **Line-by-line Arrangement** - Organized layout in PDF

#### Use Cases
- Product labeling
- Inventory tracking
- Quick product lookup
- Barcode scanning alternative

---

## 5. Vendor Management

**Route:** `/vendor`

### 5.1 Vendor Database

Supplier and vendor management system.

#### Vendor Features
- **Vendor Profiles**
  - Company name
  - Contact information
  - Address
  - GSTIN
  - Payment terms
- **Add Vendor** - Quick vendor registration
- **Search Vendors** - Find suppliers quickly
- **Vendor Categories** - Organize by product type

### 5.2 Vendor Bills Tracking

**Route:** `/vendor/[vendorId]/bills`

Track purchases from each vendor.

#### Features
- **Bill List** - All purchase bills from vendor
- **Bill Details**
  - Bill number
  - Bill date
  - Total amount
  - Payment status
  - Due dates
- **Payment Tracking** - Monitor payments to vendors
- **Outstanding Amounts** - View pending payments
- **Bill Search** - Filter vendor bills

### 5.3 Vendor Invoice Scanner

**Route:** `/vendor/scanner`

OCR scanning specifically for vendor purchase invoices.

#### Features
- **Upload Vendor Bills** - Scan physical invoices
- **AI Extraction** - Automatic bill details extraction
  - Vendor name
  - Bill number and date
  - Product list with quantities
  - Amounts and totals
  - HSN codes
- **Product Linking** - Associate scanned products with inventory
- **Auto-populate** - Fill vendor bill details automatically
- **Bulk Product Addition** - Import multiple products from one bill

#### Benefits
- Time-saving data entry
- Accuracy improvement
- Automatic inventory updates
- Historical bill tracking

---

## 6. Staff Management

**Route:** `/staff`

### 6.1 Employee Management

Comprehensive staff database and management.

#### Employee Records
- **Personal Information**
  - Employee name
  - Contact details
  - Address
  - Date of joining
  - Position/Role
  - Employee ID
- **Employment Details**
  - Salary amount
  - Payment frequency (monthly/weekly)
  - Bank details
  - PAN/Aadhaar
- **Add Employee** - New staff registration
- **Edit Employee** - Update employee information
- **Status Tracking** - Active/Inactive employees

### 6.2 Salary Management

**Route:** `/staff/salary-slip`

Salary slip generation and tracking.

#### Features
- **Monthly Salary Slips**
  - Employee details
  - Salary breakdown
  - Deductions
  - Net payable
  - Month and year
- **PDF Generation** - Professional salary slip PDFs
- **Salary History** - Track payment history
- **Bulk Generation** - Create slips for all employees
- **Print Support** - Printable format

#### Salary Slip Contents
- Employee name and ID
- Designation
- Bank details
- Basic salary
- Allowances (HRA, DA, etc.)
- Deductions (PF, Tax, etc.)
- Net salary
- Payment date
- Authorized signature section

---

## 7. Reports & Analytics

**Route:** `/report`

### 7.1 Business Reports

Comprehensive reporting system for business insights.

#### Available Reports
- **Sales Reports**
  - Daily sales summary
  - Weekly sales trends
  - Monthly sales analysis
  - Yearly comparisons
- **Customer Reports**
  - Top customers by revenue
  - Customer payment patterns
  - New vs returning customers
- **Inventory Reports**
  - Stock levels
  - Low stock alerts
  - Product movement
  - Dead stock identification
- **Vendor Reports**
  - Purchase analysis
  - Vendor payment status
  - Product sources

### 7.2 Custom Reports

- **Date Range Selection** - Custom period reports
- **Filter Options** - Multiple filtering criteria
- **Export Options** - PDF, Excel, CSV
- **Chart Visualization** - Graphical data representation
- **Print Support** - Printable report format

---

## 8. Multi-language Support

**Implementation:** next-intl library

### 8.1 Supported Languages

1. **English (en)** - Default language
2. **Hindi (hi)** - Full translation

### 8.2 Language Switcher

Component: `components/LanguageSwitcher.js`

#### Features
- **Toggle Button** - Easy language switching
- **Persistent Selection** - Remembers user preference
- **Real-time Translation** - Instant UI update
- **URL-based Routing** - Language in URL path

### 8.3 Translation Files

Located in `messages/` directory:

- `en.json` - English translations
- `hi.json` - Hindi translations

#### Translation Structure
```json
{
  "header": {
    "home": "Home",
    "billing": "Billing",
    "customer": "Customer",
    ...
  },
  "buttons": {
    "save": "Save",
    "cancel": "Cancel",
    ...
  }
}
```

### 8.4 Implementation Details

- **Middleware** - Language detection and routing
- **i18n Config** - `i18n.js` configuration
- **Next.js Integration** - App Router compatibility
- **Type Safety** - TypeScript support for translations

---

## 9. Database Schema

### 9.1 Core Tables

#### Customers Table
```sql
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  vehicle TEXT,
  address TEXT,
  gstin TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Invoices Table
```sql
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number TEXT UNIQUE NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  bill_date DATE NOT NULL,
  total_amount NUMERIC(10, 2) NOT NULL,
  mode_of_payment TEXT CHECK (mode_of_payment IN ('cash', 'online', 'unpaid')),
  invoice_type TEXT CHECK (invoice_type IN ('invoice', 'estimate')),
  items JSONB,
  discount NUMERIC(10, 2),
  tax_amount NUMERIC(10, 2),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Products Table
```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_name TEXT NOT NULL,
  sku TEXT UNIQUE,
  hsn_code TEXT,
  purchase_rate NUMERIC(10, 2),
  sale_rate NUMERIC(10, 2),
  stock_quantity INTEGER DEFAULT 0,
  vendor_id UUID REFERENCES vendors(id),
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Vendors Table
```sql
CREATE TABLE vendors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_name TEXT NOT NULL,
  contact_person TEXT,
  phone_number TEXT,
  email TEXT,
  address TEXT,
  gstin TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Staff Table
```sql
CREATE TABLE staff (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_name TEXT NOT NULL,
  employee_id TEXT UNIQUE,
  phone_number TEXT,
  address TEXT,
  position TEXT,
  salary NUMERIC(10, 2),
  date_of_joining DATE,
  bank_details TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 9.2 Indexes

For optimal performance:

```sql
CREATE INDEX idx_customers_phone ON customers(phone_number);
CREATE INDEX idx_invoices_customer ON invoices(customer_id);
CREATE INDEX idx_invoices_date ON invoices(bill_date);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_hsn ON products(hsn_code);
```

### 9.3 Row Level Security (RLS)

Supabase RLS policies for security:

```sql
-- Enable RLS on all tables
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Example policy
CREATE POLICY "Allow all operations for authenticated users"
ON customers FOR ALL
TO authenticated
USING (true);
```

---

## 10. Technical Features

### 10.1 Keyboard Shortcuts System

**Hook:** `hooks/useKeyboardShortcuts.js`

#### Implementation
- Global keyboard event listener
- Shortcut registration system
- Conflict prevention
- Context-aware shortcuts
- Modal for shortcut help

#### Supported Shortcuts
| Key | Function |
|-----|----------|
| Esc | Back/Cancel/Close |
| F8 | New Invoice |
| Ctrl + A | Save |
| Ctrl + S | Save (alternate) |
| Alt + C | Create inline |
| Alt + D | Delete |
| Alt + 2 | Duplicate |
| F12 | Settings |
| Alt + F2 | Change Date |
| Ctrl + P | Print/PDF |

### 10.2 Toast Notification System

Custom toast notifications for user feedback.

#### Types
- **Success** - Green toast for successful operations
- **Error** - Red toast for errors
- **Info** - Blue toast for information
- **Warning** - Yellow toast for warnings

#### Features
- Auto-dismiss after 3 seconds
- Manual dismiss option
- Stacking support
- Position customization
- Smooth animations

### 10.3 PDF Generation

Multiple PDF libraries used:

#### jsPDF
- Invoice generation
- Simple reports
- QR code PDFs
- Custom layouts

#### @react-pdf/renderer
- Complex documents
- Salary slips
- Professional reports
- React-based templates

### 10.4 Image Processing

**Library:** react-image-crop

#### Features
- Image cropping for OCR
- Aspect ratio control
- Preview before processing
- Canvas manipulation
- Image optimization before upload

### 10.5 Performance Optimizations

- **Code Splitting** - Page-level code splitting with Next.js
- **Lazy Loading** - Components loaded on demand
- **Memoization** - React.memo for expensive components
- **Database Indexing** - Optimized queries
- **Image Optimization** - Next.js Image component
- **Caching** - Smart data caching strategies

### 10.6 Responsive Design

- **Mobile-first** - Designed for mobile screens
- **Breakpoints** - Tailwind responsive utilities
- **Touch-friendly** - Larger touch targets on mobile
- **Adaptive Layouts** - Grid/Stack switching
- **Menu Optimization** - Hamburger menu on mobile

### 10.7 Error Handling

- **Try-Catch Blocks** - Comprehensive error catching
- **User-friendly Messages** - Clear error explanations
- **Fallback UI** - Error boundaries
- **Logging** - Console error logging for debugging
- **Retry Logic** - Automatic retry for failed operations

### 10.8 Data Validation

- **Frontend Validation** - Immediate user feedback
- **Required Fields** - Clear marking and validation
- **Format Checking** - Phone, email, GSTIN validation
- **Range Validation** - Numeric field boundaries
- **Custom Validators** - Business rule validation

---

## 11. Deployment & Production

### 11.1 Build Process

```bash
npm run build
```

Optimizations:
- Minification
- Tree shaking
- CSS purging
- Image optimization
- Bundle analysis

### 11.2 Environment Variables

Required for production:

```env
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
GEMINI_API_KEY=<your-gemini-api-key>
```

### 11.3 Deployment Platforms

Compatible with:
- Vercel (recommended)
- Netlify
- AWS Amplify
- DigitalOcean App Platform
- Self-hosted (Node.js server)

---

## 12. Future Enhancements

Planned features:

- [ ] Advanced reporting dashboard
- [ ] Mobile app (React Native)
- [ ] Email integration for invoices
- [ ] SMS notifications
- [ ] Barcode scanner (hardware integration)
- [ ] Multi-company support
- [ ] User roles and permissions
- [ ] Advanced inventory forecasting
- [ ] Automated backup system
- [ ] WhatsApp integration

---

## 13. Support & Maintenance

### 13.1 Common Issues

#### Database Connection Errors
- Verify Supabase URL and key
- Check network connectivity
- Ensure RLS policies are correct

#### OCR Not Working
- Verify Gemini API key
- Check image format and size
- Ensure sufficient API quota

#### Build Failures
- Clear `.next` folder
- Delete `node_modules` and reinstall
- Check Node.js version compatibility

### 13.2 Debugging

Enable debug mode:
```env
NODE_ENV=development
```

Check console for detailed logs.

---

## 14. Credits & Attribution

### Libraries Used

- **Next.js** - React framework
- **Supabase** - Backend as a Service
- **Tailwind CSS** - Utility-first CSS
- **Lucide React** - Icon library
- **Recharts** - Chart library
- **Google Gemini AI** - OCR and AI features
- **jsPDF** - PDF generation
- **qrcode** - QR code generation
- **next-intl** - Internationalization

---

**Last Updated:** January 2026

For quick reference, see [README.md](./README.md)
