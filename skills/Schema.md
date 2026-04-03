Database Schema & Architecture - HisabKitab
This document outlines the complete PostgreSQL database schema for the HisabKitab application, hosted on Supabase. It reflects the multi-company architecture, ensuring strong data isolation, and comprehensive modules for billing, inventory, vendor management, HR/staffing, and payments.

1. Multi-Company & Workspace Core
The foundation of the architecture is a multi-company structure where users can own or administer multiple companies.

created_by
user_id
company_id
auth_users
companies
uuid
id
PK
string
name
string
company_code
UK
text
created_by
FK
jsonb
settings
company_members
uuid
id
PK
uuid
company_id
FK
text
user_id
FK
string
role
owner, admin
companies: Central tenant table. Each operating business gets a company_code.
company_members: Link table resolving which system users have access to which companies, and their respective roles (owner or admin).
Every operational table across the database (e.g., invoices, customers, vendors, staff) maintains a company_id foreign key referencing the companies table. Row Level Security (RLS) policies tightly enforce that a user only sees records linked to their authorized companies.

2. Customer & Inventory Modules
owns
owns
has
included in
companies
customers
uuid
id
PK
string
name
string
phone_number
string
vehicle
products
uuid
id
PK
string
product_name
string
hsn_code
decimal
purchase_rate
decimal
selling_rate
decimal
gst_percentage
integer
current_stock
string
part_number
invoices
invoice_items
customers: Stores client profiles including GST numbers, vehicle details (e.g., for auto shops), and contact info.
products: Acts as the master catalog and live inventory tracker. Tracks current_stock, pricing (purchase_rate, selling_rate, discount), and taxation (gst_percentage, hsn_code).
3. Billing & Estimates (Accounts Receivable)
contains
contains
billed to
estimated for
attached to
attached to
invoices
uuid
id
PK
string
invoice_number
UK
date
bill_date
decimal
total_amount
string
mode_of_payment
invoice_items
uuid
id
PK
string
product_name
numeric
quantity
numeric
total_product
estimate
estimate_items
customers
invoice_photos
invoices & estimate: Headers for financial transactions. Tracking totals and payment statuses. Safe atomic sequential numbering is powered by the invoice_counter locking mechanism.
invoice_items & estimate_items: Line items resolving specific products, quantities, applied GST, and total product revenues.
4. Vendor Management & Payables
issues
contains
paid via
vendors
uuid
id
PK
string
name
string
gstin
uuid
company_id
FK → companies(id)
vendor_bills
uuid
id
PK
string
bill_number
UK
decimal
total_amount
string
payment_status
paid, unpaid, partial
vendor_bill_items
uuid
id
PK
uuid
product_id
FK
numeric
quantity
numeric
purchase_rate
payments
vendors: Directory of suppliers. company_id (FK → companies) added for multi-tenant isolation — vendors are scoped per company. An index (idx_vendors_company_id) exists for fast filtering. RLS policy: company_id IS NULL OR user_has_company_access(company_id).
vendor_bills: Inbound purchasing bills (often captured via AI OCR scanning). Tracks payment_status.
vendor_bill_items: Maps directly to products. AI integrations typically execute "Add" or "Replace" flows to synchronize vendor_bill_items directly into the products.current_stock when bills are validated.
5. Payments Ledger
has
makes
receives
payments
uuid
id
PK
string
payment_number
UK
decimal
amount
string
payment_method
CHEQUE, RECEIPT, RTGS etc
string
status
PENDING, CLEARED
payment_details
uuid
id
PK
string
cheque_number
string
rtgs_transaction_id
customers
vendor_bills
payments: The central ledger for cash flows (both inbound from customers or outbound to vendor bills via vendor_bill_id).
payment_details: One-to-one extension isolating specific metadata (like cheque photos, RTGS reference ids, etc.).
6. Staffing & HR
logs
takes
earns
mapped to
staff
uuid
id
PK
string
full_name
string
role
decimal
monthly_salary
attendance
uuid
id
PK
date
date
string
status
present, half_day, absent
salary_advances
salary_records
uuid
id
PK
int
month
int
year
decimal
net_salary
auth_users
staff: Employee records. Optionally tied to formal auth.users for platform access.
attendance & salary_advances: Daily operational tracking affecting payouts.
salary_records: Aggregated monthly slips factoring working days, absences, base salaries, and advances into a finalized net_salary.
7. Security (Row Level Security & Functions)
Due to the multi-tenant architecture, robust database native functions evaluate access in real-time.

check_company_access(p_company_id, p_user_id): Validates if a user is within the boundaries of a given company.
is_company_owner(p_company_id, p_user_id): Checks for restrictive administrative 'owner' privilege over lower-tier tables.
user_has_company_access(p_company_id): The fundamental engine behind RLS policies. Almost all transaction tables feature a policy structured exactly like: CREATE POLICY "Company access" ON <table> FOR ALL USING (company_id IS NULL OR user_has_company_access(company_id))