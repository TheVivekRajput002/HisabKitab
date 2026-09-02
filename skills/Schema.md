Database Schema & Architecture - HisabKitab

This document outlines the complete PostgreSQL database schema for the HisabKitab application, hosted on Supabase. It details the multi-company tenant architecture, table structures, foreign keys, indexing strategies, and Row Level Security (RLS) policies across billing, inventory, vendor management, cheque payments, HR/staffing, and cash flow ledgers.

---

1. Multi-Company & Workspace Core
The foundation of the architecture is a multi-company structure where users can own or administer multiple companies. Every tenant's operational data is isolated by `company_id`.

```mermaid
erDiagram
    companies ||--o{ company_members : "has"
    companies ||--o{ customers : "owns"
    companies ||--o{ products : "owns"
    companies ||--o{ vendors : "owns"
    companies ||--o{ invoices : "owns"
    companies ||--o{ vendor_bills : "owns"
    companies ||--o{ staff : "employs"

    companies {
        uuid id PK
        string name
        string company_code UK
        uuid created_by
        jsonb settings
        timestamp created_at
    }

    company_members {
        uuid id PK
        uuid company_id FK
        string user_id FK
        string role "owner, admin"
        timestamp created_at
    }
```

- `companies`: Central tenant table. Each operating business receives a unique `company_code`.
- `company_members`: Cross-reference table mapping platform users to authorized companies and their administrative roles (`owner`, `admin`).
- Every operational table across the database (e.g., `invoices`, `customers`, `vendors`, `vendor_bills`, `staff`) maintains a `company_id` foreign key referencing the `companies` table. Row Level Security (RLS) policies strictly enforce tenant-level isolation.

---

2. Customer & Inventory Modules

```mermaid
erDiagram
    customers {
        uuid id PK
        uuid company_id FK
        string name
        string phone_number
        string email
        string gstin
        string address
        jsonb vehicle_info "number, kilometers"
        timestamp created_at
    }

    products {
        uuid id PK
        uuid company_id FK
        string product_name
        string part_number
        string item_code
        string hsn_code
        decimal purchase_rate
        decimal selling_rate
        decimal gst_percentage
        decimal discount_percentage
        integer current_stock
        timestamp created_at
    }
```

- `customers`: Stores client profiles including GSTIN, contact data, and custom vehicle metadata (e.g., vehicle number, kilometers driven for automotive/service businesses).
- `products`: Master product catalog and live inventory ledger. Tracks `current_stock`, pricing (`purchase_rate`, `selling_rate`, `discount_percentage`), and tax rules (`gst_percentage`, `hsn_code`). Stock is automatically decremented during sales invoice creation and incremented upon vendor bill confirmation.

---

3. Billing & Estimates (Accounts Receivable)

```mermaid
erDiagram
    invoices ||--|{ invoice_items : "contains"
    invoices }|--|| customers : "billed to"
    estimates ||--|{ estimate_items : "contains"
    estimates }|--|| customers : "estimated for"

    invoices {
        uuid id PK
        uuid company_id FK
        uuid customer_id FK
        string invoice_number UK
        date bill_date
        decimal subtotal
        decimal tax_amount
        decimal discount_amount
        decimal total_amount
        string payment_status "paid, unpaid, partial"
        string mode_of_payment "CASH, UPI, CHEQUE, RTGS"
        timestamp created_at
    }

    invoice_items {
        uuid id PK
        uuid invoice_id FK
        uuid product_id FK
        string product_name
        numeric quantity
        decimal unit_price
        decimal gst_percentage
        decimal total_amount
    }
```

- `invoices` & `estimates`: Financial transaction headers tracking totals, payment statuses, and tax breakdowns. Safe sequential numbering is guaranteed via an atomic counter lock mechanism (`invoice_counter`).
- `invoice_items` & `estimate_items`: Line-item tables mapping specific products, quantities, tax rates, and subtotal revenues.

---

4. Vendor & Purchases Module (Accounts Payable)

```mermaid
erDiagram
    vendors ||--o{ vendor_bills : "issues"
    vendors ||--o{ vendor_payments : "receives"
    vendor_bills ||--|{ vendor_bill_items : "contains"
    vendor_bills ||--o{ vendor_payments : "settled by"

    vendors {
        uuid id PK
        uuid company_id FK
        string name
        string firm_name
        string gstin
        string phone
        string email
        string address
        jsonb bank_details "account_no, bank_name, ifsc"
        timestamp created_at
    }

    vendor_bills {
        uuid id PK
        uuid company_id FK
        uuid vendor_id FK
        string bill_number
        date bill_date
        date due_date
        decimal total_amount
        decimal paid_amount
        string payment_status "unpaid, partial, paid"
        jsonb ocr_raw_data "extracted AI OCR json payload"
        timestamp created_at
    }

    vendor_bill_items {
        uuid id PK
        uuid vendor_bill_id FK
        uuid product_id FK
        string product_name
        string part_number
        numeric quantity
        string unit
        decimal purchase_rate
        string hsn_code
        decimal gst_percentage
        decimal discount_percentage
        decimal total_amount
    }
```

- `vendors`: Directory of suppliers and vendors. Scoped per tenant using `company_id (FK -> companies.id)`. Index `idx_vendors_company_id` speeds up vendor lookups.
- `vendor_bills`: Inbound purchasing bills (captured manually or automatically via AI Bill OCR Scanner). Tracks total amount, paid amount, and payment status (`unpaid`, `partial`, `paid`). Stores raw OCR JSON payloads in `ocr_raw_data` for auditability.
- `vendor_bill_items`: Itemized lines from supplier bills. When a scanned or manual bill is saved, the application executes atomic updates to synchronize `vendor_bill_items` directly into `products.current_stock` (incrementing stock) and updating master `products.purchase_rate`.

---

5. Vendor Payments Ledger & Cheque OCR Details

```mermaid
erDiagram
    vendor_payments ||--o| payment_details : "has metadata"
    vendor_payments }|--|| vendors : "paid to"
    vendor_payments }|--o| vendor_bills : "settles"

    vendor_payments {
        uuid id PK
        uuid company_id FK
        uuid vendor_id FK
        uuid vendor_bill_id FK "nullable"
        string payment_number UK
        decimal amount
        date payment_date
        string payment_mode "CASH, CHEQUE, UPI, RTGS, BANK_TRANSFER"
        string status "CLEARED, PENDING, CANCELLED"
        string notes
        timestamp created_at
    }

    payment_details {
        uuid id PK
        uuid payment_id FK
        string cheque_number
        string cheque_bank
        date cheque_date
        string pay_name
        string payee_name
        string account_number
        string ifsc_code
        string cheque_image_url
        string notes
    }
```

- `vendor_payments`: Master ledger for outward cash flows to suppliers. Payments can be linked to a specific `vendor_bill_id` or applied directly to the vendor's running account balance.
- `payment_details`: One-to-one detail extension storing bank cheque metadata extracted directly via the AI Cheque Scanner (`/api/scan-check`) or banking transaction references (RTGS/NEFT IDs).

---

6. Staffing & HR Module

```mermaid
erDiagram
    staff ||--o{ attendance : "logs"
    staff ||--o{ salary_advances : "takes"
    staff ||--o{ salary_records : "earns"

    staff {
        uuid id PK
        uuid company_id FK
        string full_name
        string role
        string phone
        decimal monthly_salary
        boolean is_active
        timestamp created_at
    }

    attendance {
        uuid id PK
        uuid staff_id FK
        date date
        string status "present, half_day, absent"
    }

    salary_advances {
        uuid id PK
        uuid staff_id FK
        date advance_date
        decimal amount
        string notes
    }

    salary_records {
        uuid id PK
        uuid staff_id FK
        integer month
        integer year
        decimal base_salary
        decimal total_advances
        decimal net_salary
        timestamp generated_at
    }
```

- `staff`: Employee records tied to `company_id`.
- `attendance` & `salary_advances`: Operational logs tracking daily presence and cash advance loans deducted during payroll processing.
- `salary_records`: Monthly payroll calculations factoring working days, absences, base salaries, and advances into a finalized `net_salary` for automated PDF slip generation.

---

7. Security (Row Level Security & Helper Functions)

Database functions and RLS policies guarantee strict multi-tenant isolation:

```sql
-- Helper function to verify company access
CREATE OR REPLACE FUNCTION user_has_company_access(p_company_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM company_members
    WHERE company_id = p_company_id
    AND user_id = auth.uid()::text
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Universal Row Level Security Policy Template
CREATE POLICY "Tenant company isolation policy"
ON vendors
FOR ALL
USING (company_id IS NULL OR user_has_company_access(company_id));
```