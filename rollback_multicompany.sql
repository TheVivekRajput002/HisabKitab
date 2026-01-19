-- ============================================================================
-- ROLLBACK MULTI-COMPANY WORKSPACE
-- This script removes all multi-company features and restores original setup
-- ============================================================================

-- STEP 1: Drop all company-related RLS policies
-- ============================================================================

-- Companies table policies
DROP POLICY IF EXISTS "Users can view their companies" ON companies;
DROP POLICY IF EXISTS "Users can create companies" ON companies;
DROP POLICY IF EXISTS "Owners can update companies" ON companies;
DROP POLICY IF EXISTS "Owners can delete companies" ON companies;

-- Company members policies
DROP POLICY IF EXISTS "Users can view company members" ON company_members;
DROP POLICY IF EXISTS "Users can join companies" ON company_members;
DROP POLICY IF EXISTS "Owners can update members" ON company_members;
DROP POLICY IF EXISTS "Users can leave or owners can remove" ON company_members;

-- Data tables - drop company access policies
DROP POLICY IF EXISTS "Company access" ON invoices;
DROP POLICY IF EXISTS "Company access" ON invoice_items;
DROP POLICY IF EXISTS "Company access" ON estimate;
DROP POLICY IF EXISTS "Company access" ON estimate_items;
DROP POLICY IF EXISTS "Company access" ON customers;
DROP POLICY IF EXISTS "Company access" ON products;
DROP POLICY IF EXISTS "Company access" ON vendors;
DROP POLICY IF EXISTS "Company access" ON vendor_bills;
DROP POLICY IF EXISTS "Company access" ON vendor_bill_items;
DROP POLICY IF EXISTS "Company access" ON staff;
DROP POLICY IF EXISTS "Company access" ON attendance;
DROP POLICY IF EXISTS "Company access" ON salary_advances;
DROP POLICY IF EXISTS "Company access" ON salary_records;
DROP POLICY IF EXISTS "Company access" ON invoice_photos;
DROP POLICY IF EXISTS "Company access" ON invoice_counter;

-- STEP 2: Drop triggers
-- ============================================================================

DROP TRIGGER IF EXISTS companies_updated_at ON companies;
DROP TRIGGER IF EXISTS add_company_owner ON companies;

-- STEP 3: Drop functions
-- ============================================================================

DROP FUNCTION IF EXISTS generate_company_code();
DROP FUNCTION IF EXISTS get_user_companies(UUID);
DROP FUNCTION IF EXISTS check_company_access(UUID, UUID);
DROP FUNCTION IF EXISTS is_company_owner(UUID, UUID);
DROP FUNCTION IF EXISTS user_has_company_access(UUID);
DROP FUNCTION IF EXISTS update_updated_at();
DROP FUNCTION IF EXISTS add_creator_as_owner();

-- STEP 4: Drop indexes on company_id columns
-- ============================================================================

DROP INDEX IF EXISTS idx_invoices_company;
DROP INDEX IF EXISTS idx_invoice_items_company;
DROP INDEX IF EXISTS idx_estimate_company;
DROP INDEX IF EXISTS idx_estimate_items_company;
DROP INDEX IF EXISTS idx_customers_company;
DROP INDEX IF EXISTS idx_products_company;
DROP INDEX IF EXISTS idx_vendors_company;
DROP INDEX IF EXISTS idx_vendor_bills_company;
DROP INDEX IF EXISTS idx_vendor_bill_items_company;
DROP INDEX IF EXISTS idx_staff_company;
DROP INDEX IF EXISTS idx_attendance_company;
DROP INDEX IF EXISTS idx_salary_advances_company;
DROP INDEX IF EXISTS idx_salary_records_company;
DROP INDEX IF EXISTS idx_invoice_photos_company;
DROP INDEX IF EXISTS idx_invoice_counter_company;

-- Company table indexes
DROP INDEX IF EXISTS idx_companies_code;
DROP INDEX IF EXISTS idx_companies_created_by;
DROP INDEX IF EXISTS idx_company_members_company;
DROP INDEX IF EXISTS idx_company_members_user;
DROP INDEX IF EXISTS idx_company_members_role;

-- STEP 5: Remove company_id columns from all tables
-- ============================================================================

ALTER TABLE invoices DROP COLUMN IF EXISTS company_id;
ALTER TABLE invoice_items DROP COLUMN IF EXISTS company_id;
ALTER TABLE estimate DROP COLUMN IF EXISTS company_id;
ALTER TABLE estimate_items DROP COLUMN IF EXISTS company_id;
ALTER TABLE customers DROP COLUMN IF EXISTS company_id;
ALTER TABLE products DROP COLUMN IF EXISTS company_id;
ALTER TABLE vendors DROP COLUMN IF EXISTS company_id;
ALTER TABLE vendor_bills DROP COLUMN IF EXISTS company_id;
ALTER TABLE vendor_bill_items DROP COLUMN IF EXISTS company_id;
ALTER TABLE staff DROP COLUMN IF EXISTS company_id;
ALTER TABLE attendance DROP COLUMN IF EXISTS company_id;
ALTER TABLE salary_advances DROP COLUMN IF EXISTS company_id;
ALTER TABLE salary_records DROP COLUMN IF EXISTS company_id;
ALTER TABLE invoice_photos DROP COLUMN IF EXISTS company_id;
ALTER TABLE invoice_counter DROP COLUMN IF EXISTS company_id;

-- STEP 6: Drop company tables
-- ============================================================================

DROP TABLE IF EXISTS company_members CASCADE;
DROP TABLE IF EXISTS companies CASCADE;

-- STEP 7: Restore original permissive RLS policies
-- ============================================================================

-- Invoices
CREATE POLICY "Allow all operations on invoices" ON invoices FOR ALL
USING (true)
WITH CHECK (true);

-- Invoice Items
CREATE POLICY "Allow all operations on invoice_items" ON invoice_items FOR ALL
USING (true)
WITH CHECK (true);

-- Estimate
CREATE POLICY "Allow all operations on estimate" ON estimate FOR ALL
USING (true)
WITH CHECK (true);

-- Estimate Items
CREATE POLICY "Allow all operations on estimate_items" ON estimate_items FOR ALL
USING (true)
WITH CHECK (true);

-- Customers
CREATE POLICY "Allow all operations on customers" ON customers FOR ALL
USING (true)
WITH CHECK (true);

-- Products
CREATE POLICY "Allow all operations on products" ON products FOR ALL
USING (true)
WITH CHECK (true);

-- Vendors
CREATE POLICY "Allow all operations on vendors" ON vendors FOR ALL
USING (true)
WITH CHECK (true);

-- Vendor Bills
CREATE POLICY "Allow all operations on vendor_bills" ON vendor_bills FOR ALL
USING (true)
WITH CHECK (true);

-- Vendor Bill Items
CREATE POLICY "Allow all operations on vendor_bill_items" ON vendor_bill_items FOR ALL
USING (true)
WITH CHECK (true);

-- Staff
CREATE POLICY "Allow all operations on staff" ON staff FOR ALL
USING (true)
WITH CHECK (true);

-- Attendance
CREATE POLICY "Allow all operations on attendance" ON attendance FOR ALL
USING (true)
WITH CHECK (true);

-- Salary Advances
CREATE POLICY "Allow all operations on salary_advances" ON salary_advances FOR ALL
USING (true)
WITH CHECK (true);

-- Salary Records
CREATE POLICY "Allow all operations on salary_records" ON salary_records FOR ALL
USING (true)
WITH CHECK (true);

-- Invoice Photos
CREATE POLICY "Allow all operations on invoice_photos" ON invoice_photos FOR ALL
USING (true)
WITH CHECK (true);

-- Invoice Counter
CREATE POLICY "Allow all operations on invoice_counter" ON invoice_counter FOR ALL
USING (true)
WITH CHECK (true);

-- ============================================================================
-- ROLLBACK COMPLETE!
-- ============================================================================

SELECT 'Multi-company workspace rollback complete! Database restored to original state.' as status;
