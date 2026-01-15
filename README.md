# HisabKitab 📊

> A comprehensive business management system for handling invoices, estimates, inventory, vendors, customers, and staff - all in one place.

## 🚀 Overview

HisabKitab is a full-stack business management application built with Next.js and Supabase. It provides a complete solution for managing your business operations including billing, inventory tracking, vendor management, and customer relations with advanced features like AI invoice scanning, WhatsApp integration, and real-time analytics.

## 📸 Key Features

- **AI-Powered Invoice Scanner** - Extract invoice data using Google Gemini AI
- **Smart Search & Filters** - Advanced search with pagination, sorting, and bulk actions
- **WhatsApp Integration** - Send invoices/estimates directly via WhatsApp
- **Real-time Analytics** - Dashboard with sales statistics and insights
- **QR Code Generation** - Generate QR codes for products
- **Image Cropping** - Built-in image editor for invoice photos
- **Export & Print** - CSV export and print functionality
- **Bulk Operations** - Select and perform actions on multiple items

## 🛠️ Tech Stack

### Frontend
- **Next.js 16.1.1** - React framework with App Router
- **React 19.2.3** - UI library
- **TailwindCSS 4** - Utility-first CSS framework
- **Lucide React** - Icon library
- **Recharts** - Charts and data visualization
- **React Image Crop** - Image cropping tool

### Backend & Database
- **Supabase** - PostgreSQL database, authentication, and storage
- **Next.js API Routes** - Serverless API endpoints

### AI & Utilities
- **Google Gemini AI** - Invoice data extraction
- **jsPDF** - PDF generation
- **QRCode** - QR code generation
- **@react-pdf/renderer** - Advanced PDF rendering

## 📁 Project Structure

```
HisabKitab/
├── app/
│   ├── page.js                    # Home Dashboard
│   ├── api/
│   │   └── scan-invoice/          # AI invoice scanning endpoint
│   ├── billing/
│   │   ├── page.js                # Billing hub
│   │   ├── add/[id]/              # Create invoice/estimate
│   │   ├── invoice/
│   │   │   ├── search/            # Invoice search with advanced features
│   │   │   └── [id]/              # Invoice details
│   │   └── estimate/
│   │       ├── search/            # Estimate search with advanced features
│   │       └── [id]/              # Estimate details
│   ├── inventory/
│   │   ├── page.js                # Inventory management
│   │   ├── search/                # Product search with pagination
│   │   └── [id]/                  # Product details
│   ├── customer/
│   │   ├── page.js                # Customer list
│   │   ├── add/                   # Add new customer
│   │   ├── search/                # Customer search
│   │   └── [id]/                  # Customer details
│   ├── vendor/
│   │   ├── page.js                # Vendor list
│   │   ├── scanner/               # AI-powered vendor invoice scanner
│   │   └── [vendorId]/bills/      # Vendor bill history
│   ├── staff/
│   │   └── page.js                # Staff management
│   └── reports/
│       └── page.js                # Business reports
├── components/
│   └── Header.js                  # Navigation header
├── utils/
│   ├── supabaseClient.js          # Supabase client instance
│   ├── uploadInvoicePDF.js        # PDF upload to Supabase storage
│   ├── uploadPhoto.js             # Photo upload utility
│   └── sendWhatsApp.js            # WhatsApp message sender
└── hooks/
    ├── useCustomerSearch.js       # Customer search hook
    ├── useInvoiceCalculations.js  # Invoice calculations
    └── useProductAutoSave.js      # Product auto-save
```

## 📄 Pages & Functionality

### 🏠 Home Dashboard (`/`)
- **Purpose**: Central hub with business overview
- **Features**:
  - Quick stats cards (Total Sales, Invoices, Estimates)
  - Recent activity feed
  - Sales charts and analytics
  - Quick action buttons

### 💰 Billing Module (`/billing`)

#### Invoice Management
- **Search Page** (`/billing/invoice/search`):
  - Advanced search (invoice number, customer, phone)
  - 5 sort options (date, amount, customer)
  - Bulk selection with checkboxes
  - Export to CSV
  - Print selected/all
  - WhatsApp reminders (individual & bulk)
  - Pagination (10 items/page)
  - Payment status filters
  - Date range filtering

- **Create/Edit** (`/billing/add/invoice`):
  - Customer selection with search
  - Product selection with auto-save
  - GST calculations
  - Payment mode tracking
  - Photo attachment
  - Ctrl+S shortcut to save

- **Invoice Details** (`/billing/invoice/[id]`):
  - Full invoice breakdown
  - Customer information
  - Line items with pricing
  - Payment status
  - WhatsApp send option

#### Estimate Management
- **Search Page** (`/billing/estimate/search`):
  - Same features as invoice search
  - Convert estimate to invoice option

- **Create/Edit** (`/billing/add/estimate`):
  - Similar to invoice creation
  - Estimate-specific numbering

### 📦 Inventory Module (`/inventory`)

- **Inventory List** (`/inventory/page.js`):
  - Product catalog
  - Stock levels
  - Quick actions

- **Search** (`/inventory/search`):
  - Product search with filters
  - Category filtering
  - Stock status filters
  - Pagination

- **Product Details** (`/inventory/[id]`):
  - Product information
  - Stock history
  - Pricing details
  - QR code generation

### 👥 Customer Module (`/customer`)

- **Customer List**: All customers with quick stats
- **Search**: Advanced customer search
- **Add Customer**: Form with GSTIN, contact details
- **Customer Details**: Purchase history, outstanding amounts

### 🏭 Vendor Module (`/vendor`)

- **Vendor List**: All vendors
- **AI Scanner** (`/vendor/scanner`):
  - **OCR + AI**: Scan vendor invoices using camera/upload
  - **Image Cropping**: Built-in image editor
  - **Auto-extraction**: Product details, quantities, prices
  - **Batch Processing**: Handle multiple products at once
  - **QR Code Generation**: Generate QR codes for scanned products
  - **Photo Storage**: Save scanned invoice images to Supabase
  
- **Vendor Bills** (`/vendor/[vendorId]/bills`):
  - Purchase history
  - Bill details with items
  - Discount tracking
  - View invoice photos

### 👔 Staff Module (`/staff`)
- Staff member management
- Role assignments
- Contact information

### 📊 Reports Module (`/reports`)
- Sales reports
- Inventory reports
- Customer analytics
- Financial summaries

## 🔧 Setup & Installation

### Prerequisites
- Node.js 18+ installed
- Supabase account
- Google Gemini API key (for AI features)

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd HisabKitab
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Variables**
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   GEMINI_API_KEY=your_google_gemini_api_key
   ```

4. **Supabase Setup**
   
   Create the following tables in your Supabase database:

   ```sql
   -- Customers
   CREATE TABLE customers (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     name TEXT NOT NULL,
     phone_number TEXT,
     address TEXT,
     gstin TEXT,
     created_at TIMESTAMP DEFAULT NOW()
   );

   -- Products
   CREATE TABLE products (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     product_name TEXT NOT NULL,
     hsn_code TEXT,
     purchase_rate DECIMAL,
     selling_rate DECIMAL,
     stock_quantity INTEGER DEFAULT 0,
     category TEXT,
     created_at TIMESTAMP DEFAULT NOW()
   );

   -- Invoices
   CREATE TABLE invoices (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     invoice_number TEXT UNIQUE NOT NULL,
     customer_id UUID REFERENCES customers(id),
     bill_date DATE NOT NULL,
     total_amount DECIMAL NOT NULL,
     mode_of_payment TEXT,
     created_at TIMESTAMP DEFAULT NOW()
   );

   -- Invoice Items
   CREATE TABLE invoice_items (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     invoice_id UUID REFERENCES invoices(id),
     product_id UUID REFERENCES products(id),
     quantity INTEGER,
     rate DECIMAL,
     gst_percentage DECIMAL,
     total DECIMAL
   );

   -- Estimates (similar structure to invoices)
   -- Vendors
   -- Vendor Bills
   -- Staff
   ```

   Set up Supabase Storage buckets:
   - `invoice-photos` - For scanned invoice images
   - `pdfs` - For generated PDF invoices

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open in browser**
   ```
   http://localhost:3000
   ```

## 🎯 Core Workflows

### Creating an Invoice
1. Navigate to `/billing/add/invoice`
2. Search and select customer
3. Add products to the invoice
4. Set payment mode (Cash/Online/Unpaid)
5. Upload invoice photo (optional)
6. Save with Ctrl+S or Save button
7. Send via WhatsApp directly

### Scanning Vendor Invoices
1. Go to `/vendor/scanner`
2. Click camera or upload image
3. Crop image if needed
4. AI extracts products automatically
5. Review and edit extracted data
6. Generate QR codes for products
7. Save to database

### Searching Invoices
1. Visit `/billing/invoice/search`
2. Use search fields (invoice #, customer, phone)
3. Apply filters (status, date range)
4. Select sort option
5. Check items for bulk actions
6. Export CSV, Print, or Send WhatsApp

## 🔐 Security Features

- Supabase Row Level Security (RLS) policies
- Secure API routes
- Environment variable protection
- Input validation and sanitization

## 🚀 Performance Optimizations

- Server-side pagination (10 items/page)
- Debounced search (300ms)
- Skeleton loaders for better UX
- Lazy loading of images
- Optimized Supabase queries
- Client-side caching

## 📱 Responsive Design

- Fully responsive across devices
- Mobile-friendly navigation
- Touch-optimized controls
- Adaptive layouts

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📝 License

This project is private and proprietary.

## 👨‍💻 Developer

Built with ❤️ for small businesses

---

## 🆘 Support

For issues and questions, please open an issue in the repository.

## 🔮 Future Enhancements

- [ ] Multi-user authentication
- [ ] Role-based access control
- [ ] Email notifications
- [ ] Advanced reporting with filters
- [ ] Mobile app version
- [ ] Offline mode support
- [ ] Multi-currency support
- [ ] Tax calculation enhancements
