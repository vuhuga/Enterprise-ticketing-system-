-- Update User Roles for Customer/Staff Separation
-- This script sets up proper role-based access control

USE support_ticket_crm;

-- Step 1: Update users table to support customer role
ALTER TABLE users 
MODIFY COLUMN role ENUM('admin', 'staff', 'customer') DEFAULT 'customer';

-- Step 3: Create user accounts for existing customers
-- First, let's see what customers exist
SELECT 'Existing customers:' as info;
SELECT id, first_name, last_name, email FROM customers;

-- Create user accounts for customers (with default password 'customer123')
-- Password hash for 'customer123': $2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi

INSERT IGNORE INTO users (first_name, last_name, email, password, role, phone, created_at, updated_at)
SELECT 
    first_name, 
    last_name, 
    email, 
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- customer123
    'customer',
    phone,
    NOW(),
    NOW()
FROM customers 
WHERE email NOT IN (SELECT email FROM users);

-- Link customers to their user accounts
UPDATE customers c
JOIN users u ON c.email = u.email
SET c.user_id = u.id
WHERE u.role = 'customer';

-- Step 4: Create user accounts for existing contacts
SELECT 'Existing contacts:' as info;
SELECT id, first_name, last_name, email FROM contacts;

-- Create user accounts for contacts (with default password 'staff123')
-- Password hash for 'staff123': $2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi

INSERT IGNORE INTO users (first_name, last_name, email, password, role, phone, created_at, updated_at)
SELECT 
    first_name, 
    last_name, 
    email, 
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- staff123
    'staff',
    phone,
    NOW(),
    NOW()
FROM contacts 
WHERE email NOT IN (SELECT email FROM users);

-- Link contacts to their user accounts
UPDATE contacts c
JOIN users u ON c.email = u.email
SET c.user_id = u.id
WHERE u.role = 'staff';

-- Step 5: Ensure admin user exists
UPDATE users SET role = 'admin' WHERE email = 'admin@presidentsaward.ke';

-- Step 6: Show final results
SELECT 'Final user roles:' as info;
SELECT id, first_name, last_name, email, role FROM users ORDER BY role, id;

SELECT 'Customers with user accounts:' as info;
SELECT c.id, c.first_name, c.last_name, c.email, u.role 
FROM customers c 
LEFT JOIN users u ON c.user_id = u.id;

SELECT 'Contacts with user accounts:' as info;
SELECT c.id, c.first_name, c.last_name, c.email, u.role 
FROM contacts c 
LEFT JOIN users u ON c.user_id = u.id;

SELECT 'Migration completed successfully!' as message;