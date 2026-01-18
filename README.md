# HisabKitab - Business Management System

A modern, full-featured business management application built with Next.js for managing customers, invoices, estimates, and inventory.

## ✨ Features

### Customer Management
- **Customer Search & Filter** - Advanced search with filtering by name, phone, vehicle
- **Customer Details View** - Split-panel interface showing customer info and transaction history
- **Inline Editing** - Edit customer details without leaving the page
- **Quick Actions** - Direct dial phone numbers, delete customers with confirmation 
- **Add Customers** - Modal form for quick customer creation
- **Transaction Tracking** - View all invoices with payment status (Paid/Unpaid)
- **Analytics** - Total purchases, paid amounts, and unpaid balances

### Billing
- **Invoice Management** - Create, search, and manage sales invoices
- **Estimate Management** - Create and manage price quotes
- **Clean UI** - Simple, professional interface with clear action buttons
- **Quick Navigation** - Easy access to create new or search existing documents

### Inventory
- **Product Management** - Add and search products
- **Stock Tracking** - Keep track of inventory items
- **Simple Interface** - Clean, focused design for product operations

### UI/UX Features
- **Toast Notifications** - Modern, non-intrusive alerts for success/error messages
- **Keyboard Shortcuts** - Power user shortcuts for quick navigation and actions
- **Responsive Design** - Works seamlessly on desktop and mobile devices
- **Modern Design** - Clean, minimal interface with proper whitespace
- **Smooth Animations** - Subtle transitions and hover effects

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Esc` | Back / Cancel / Exit current screen |
| `F8` | Create Sales Invoice |
| `Ctrl + A` | Save |
| `Alt + C` | Create customer/item inline |
| `Alt + D` | Delete invoice |
| `Alt + 2` | Duplicate invoice |
| `F12` | Invoice settings |
| `Alt + F2` | Change invoice date |
| `Ctrl + P` | Print / PDF |

Click the keyboard icon (bottom-right) to view shortcuts anytime.

## 🛠️ Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Language**: JavaScript/React
- **Database**: [Supabase](https://supabase.com/) (PostgreSQL)
- **Styling**: Tailwind CSS
- **Icons**: [Lucide React](https://lucide.dev/)
- **UI Components**: Custom components with modern design patterns

## 📦 Installation

### Prerequisites
- Node.js 18+ and npm/yarn
- Supabase account and project

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd HisabKitab
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Configure environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Set up Supabase database**
   
   Create the following tables in your Supabase project:
   
   - `customers` - Stores customer information
   - `invoices` - Stores invoice data
   - `products` - Stores inventory items

5. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

6. **Open the application**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
HisabKitab/
├── app/
│   ├── billing/          # Billing pages (invoices, estimates)
│   ├── customer/         # Customer management pages
│   ├── customer1/        # Enhanced customer view with split panel
│   ├── inventory/        # Inventory management pages
│   ├── layout.js         # Root layout with header and shortcuts
│   └── globals.css       # Global styles
├── components/
│   ├── Header.js         # Navigation header
│   └── KeyboardShortcutsHelp.js  # Shortcuts help modal
├── hooks/
│   └── useKeyboardShortcuts.js   # Custom keyboard shortcuts hook
├── utils/
│   └── supabaseClient.js # Supabase configuration
└── public/               # Static assets
```

## 🚀 Usage

### Customer Management

1. **View Customers**: Navigate to `/customer1`
   - Left panel: Search and filter customers
   - Right panel: View selected customer details and transactions

2. **Add Customer**: Click "Add Customer" button
   - Fill in name, phone (required)
   - Optionally add vehicle and address
   - Click "Add Customer" to save

3. **Edit Customer**: Click edit icon next to customer name
   - Modify details inline
   - Click "Save Changes" or "Cancel"

4. **Delete Customer**: Click trash icon
   - Confirmation dialog appears
   - All customer invoices will be deleted

### Billing

1. **Create Invoice**: Navigate to `/billing` → Click "New Invoice"
2. **Search Invoices**: Click "Search Invoice" to find existing invoices
3. **Create Estimate**: Click "New Estimate" for price quotes
4. **Search Estimates**: Click "Search Estimate" to find existing quotes

### Inventory

1. **Add Product**: Navigate to `/inventory` → Click "Add Product"
2. **Search Products**: Click "Search Products" to find inventory items

## 🎨 Design Philosophy

- **Simplicity First**: Clean, uncluttered interface
- **Minimal Colors**: Strategic use of blue, orange, and green accents
- **Proper Whitespace**: Breathing room for better readability
- **Smooth Interactions**: Subtle animations without distractions
- **Mobile Responsive**: Works great on all screen sizes

## 🔧 Configuration

### Database Schema

#### Customers Table
```sql
- id (uuid, primary key)
- name (text, required)
- phone_number (text, required)
- vehicle (text, optional)
- address (text, optional)
- created_at (timestamp)
```

#### Invoices Table
```sql
- id (uuid, primary key)
- customer_id (uuid, foreign key)
- invoice_number (text)
- bill_date (date)
- total_amount (numeric)
- mode_of_payment (text: 'cash' | 'online' | 'unpaid')
- created_at (timestamp)
```

## 📝 License

This project is private and proprietary.

## 👨‍💻 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

### Contributing

Please follow the existing code style and patterns when contributing.

---

Built with ❤️ using Next.js and Supabase
