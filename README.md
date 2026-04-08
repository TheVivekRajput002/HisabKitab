# HisabKitab - Complete Business Management System

A comprehensive, modern business management application built with Next.js for managing all aspects of your business including billing, inventory, customers, vendors, staff, and more.

## 📋 Table of Contents

- [Features Overview](#-features-overview)
- [Quick Start](#-quick-start)
- [Technology Stack](#️-tech-stack)
- [Documentation](#-documentation)
- [Keyboard Shortcuts](#️-keyboard-shortcuts)
- [License](#-license)

## ✨ Features Overview

### 🏠 Dashboard
- **Real-time Analytics** - Today's sales statistics and bill count
- **Interactive Sales Charts** - Visualize sales trends (today/week/month)
- **Quick Insights** - Total sales, number of parties, and growth trends
- **Responsive Graphs** - Beautiful charts powered by Recharts

### 💰 Billing & Invoicing
- **Invoice Management** - Create, search, edit, and delete sales invoices
- **Estimate Management** - Generate and manage price quotes
- **PDF Generation** - Export invoices to PDF format
- **Invoice Scanner (OCR)** - Scan physical invoices using AI (Google Gemini)
- **Quick Search** - Find invoices instantly by number, customer, or date
- **Payment Tracking** - Track cash, online, and unpaid transactions
- **Keyboard Shortcuts** - Lightning-fast invoice creation (F8)

### 👥 Customer Management
- **Advanced Search** - Filter customers by name, phone, vehicle, or GSTIN
- **Customer Profiles** - Detailed view with transaction history
- **Inline Editing** - Quick edit without page navigation
- **Transaction History** - View all invoices with payment status
- **Analytics Dashboard** - Total purchases, paid/unpaid amounts
- **Quick Actions** - Direct dial, delete with confirmation
- **GSTIN Support** - GST number tracking for tax compliance

### 📦 Inventory Management
- **Product Catalog** - Comprehensive product database
- **Stock Tracking** - Monitor inventory levels
- **HSN Code Support** - HSN/SAC codes for GST compliance
- **Product Search** - Quick product lookup
- **SKU Management** - Unique product identification
- **Pricing Management** - Purchase and sale rate tracking
- **QR Code Generation** - Generate QR codes for products

### 🏢 Vendor Management  
- **Vendor Database** - Manage supplier information
- **Bill Tracking** - Track vendor bills and purchases
- **OCR Scanner** - Scan vendor invoices automatically
- **Payment History** - Monitor vendor payments
- **Product Association** - Link products to vendors

### 👨‍💼 Staff Management
- **Employee Records** - Comprehensive staff database
- **Salary Management** - Track employee salaries
- **Salary Slips** - Generate and manage salary slips
- **Staff Analytics** - Monitor staff-related expenses

### 📊 Reports & Analytics
- **Sales Reports** - Comprehensive sales analysis
- **Custom Reports** - Generate reports for specific periods
- **Data Visualization** - Charts and graphs for insights

### 🌐 Multi-language Support
- **English & Hindi** - Full internationalization (i18n)
- **Language Switcher** - Easy toggle between languages
- **next-intl Integration** - Professional translation management

### 🎨 UI/UX Features
- **Modern Design** - Clean, professional interface
- **Toast Notifications** - Non-intrusive success/error alerts
- **Responsive Layout** - Works perfectly on all devices
- **Smooth Animations** - Polished user experience
- **Dark Mode Ready** - Interface optimized for readability
- **Keyboard Shortcuts** - Power user productivity features

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm/yarn
- Supabase account and project
- Google Gemini API key (for OCR features)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd HisabKitab
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Create a `.env.local` file:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   GEMINI_API_KEY=your_gemini_api_key
   # Optional failover keys (comma-separated). Used before GEMINI_API_KEY when set.
   GEMINI_API_KEYS=primary_key,backup_key_1,backup_key_2
   ```

4. **Set up Supabase database**
   
   Required tables:
   - `customers` - Customer information
   - `invoices` - Invoice/estimate data
   - `products` - Inventory items
   - `vendors` - Vendor information
   - `staff` - Employee records

5. **Run development server**
   ```bash
   npm run dev
   ```

6. **Open application**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🛠️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Language**: JavaScript/React 19
- **Database**: [Supabase](https://supabase.com/) (PostgreSQL)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Charts**: [Recharts](https://recharts.org/)
- **PDF Generation**: jsPDF, @react-pdf/renderer
- **OCR/AI**: Google Gemini AI (@google/genai)
- **i18n**: next-intl
- **QR Codes**: qrcode
- **Image Processing**: react-image-crop

## 📚 Documentation

For detailed information about each feature, see [FEATURES.md](./FEATURES.md)

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Esc` | Back / Cancel / Exit |
| `F8` | Create Sales Invoice |
| `Ctrl + A` | Save |
| `Ctrl + S` | Save (Invoice/Estimate Add) |
| `Alt + C` | Create customer/item inline |
| `Alt + D` | Delete invoice |
| `Alt + 2` | Duplicate invoice |
| `F12` | Invoice settings |
| `Alt + F2` | Change invoice date |
| `Ctrl + P` | Print / PDF |

Click the keyboard icon (⌨️) in the bottom-right corner to view shortcuts anytime.

## 📁 Project Structure

```
HisabKitab/
├── app/
│   ├── page.js              # Dashboard with analytics
│   ├── billing/             # Invoice & estimate management
│   │   ├── add/            # Create new invoice/estimate
│   │   ├── invoice/        # Invoice search & management
│   │   └── estimate/       # Estimate search & management
│   ├── customer/           # Customer management
│   │   ├── add/           # Add new customer
│   │   ├── search/        # Customer search
│   │   └── [id]/          # Customer details & transactions
│   ├── inventory/          # Product management
│   │   ├── add/           # Add new product
│   │   ├── search/        # Product search
│   │   └── scanner/       # OCR product scanner
│   ├── vendor/            # Vendor management
│   │   ├── scanner/       # Vendor invoice OCR
│   │   └── [vendorId]/    # Vendor bills & details
│   ├── staff/             # Employee management
│   │   └── salary-slip/   # Salary slip generation
│   └── report/            # Reports & analytics
├── components/
│   ├── Header.js                    # Navigation header
│   ├── KeyboardShortcutsHelp.js    # Shortcuts modal
│   └── LanguageSwitcher.js         # Language toggle
├── hooks/
│   └── useKeyboardShortcuts.js     # Keyboard shortcuts hook
├── utils/
│   └── supabaseClient.js           # Database configuration
├── messages/                        # i18n translations
│   ├── en.json                     # English translations
│   └── hi.json                     # Hindi translations
└── public/                          # Static assets
```

## 🎯 Core Features Breakdown

### 1. Dashboard (`/`)
- Real-time business metrics
- Sales visualization charts
- Quick statistics (today/week/month views)

### 2. Billing (`/billing`)
- Invoice creation and management
- Estimate/quotation system
- OCR invoice scanning
- PDF export

### 3. Customers (`/customer`)
- Comprehensive customer database
- Transaction history tracking
- Payment status monitoring
- GSTIN/GST compliance

### 4. Inventory (`/inventory`)
- Product catalog management
- Stock tracking
- HSN code support
- QR code generation

### 5. Vendors (`/vendor`)
- Supplier management
- Purchase tracking
- Vendor bill scanning (OCR)

### 6. Staff (`/staff`)
- Employee records
- Salary management
- Salary slip generation

### 7. Reports (`/report`)
- Business analytics
- Custom reports

## 🔒 Database Schema

See [FEATURES.md](./FEATURES.md) for complete database schema and setup instructions.

## 🌟 Key Highlights

- ✅ **Complete Business Solution** - Everything you need in one app
- ✅ **AI-Powered OCR** - Automatic invoice scanning with Google Gemini
- ✅ **Multi-language** - English & Hindi support
- ✅ **Mobile Responsive** - Works on all devices
- ✅ **Keyboard-first** - Productivity shortcuts for power users
- ✅ **Modern UI** - Clean, professional design
- ✅ **Real-time Data** - Instant updates and synchronization
- ✅ **PDF Export** - Professional invoice generation
- ✅ **QR Codes** - Product identification system

## 👨‍💻 Development

### Available Scripts

- `npm run dev` - Start development server (http://localhost:3000)
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

### Contributing

Please follow the existing code style and patterns when contributing.

## 📝 License

This project is private and proprietary.

---

**Built with ❤️ using Next.js and Supabase**

For detailed feature documentation, see [FEATURES.md](./FEATURES.md)
