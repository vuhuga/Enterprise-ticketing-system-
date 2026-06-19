/**
 * Enterprise Ticketing System - Database Schema
 * 
 * Complete database setup script for the ticketing platform.
 * This creates all necessary tables, relationships, and default data
 * required for full system operation.
 * 
 * Execute this script in MySQL Workbench or your preferred MySQL client.
 */

-- Initialize main database for the enterprise ticketing system
CREATE DATABASE IF NOT EXISTS support_ticket_crm;
USE support_ticket_crm;

-- Primary users table - unified authentication and profile management
-- Supports admin, staff, and customer roles with complete profile data
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'staff', 'user') DEFAULT 'user',
    phone VARCHAR(20),
    city VARCHAR(50),
    country VARCHAR(50),
    address TEXT,
    photo VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Core tickets table - handles all support requests with smart assignment
-- Includes comprehensive workflow states and department routing
CREATE TABLE IF NOT EXISTS tickets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    subject VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    type ENUM('General Inquiry', 'Award Progression', 'Certificate Request', 'Registration Issue', 'Complaint or Grievance', 'Technical Support') NOT NULL,
    department ENUM('Admin', 'ICT', 'Finance', 'Program Management', 'Customer Service') NOT NULL,
    priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
    status ENUM('new', 'open', 'in_progress', 'resolved', 'closed') DEFAULT 'new',
    assigned_to INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
);

-- Bootstrap system with administrative user (password: admin123)
INSERT IGNORE INTO users (first_name, last_name, email, password, role) 
VALUES ('Admin', 'User', 'admin@presidentsaward.ke', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin');

-- Create demo user account for testing (password: user123)
INSERT IGNORE INTO users (first_name, last_name, email, password, role) 
VALUES ('Regular', 'User', 'user@presidentsaward.ke', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user');

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20),
    company VARCHAR(100),
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create departments table
CREATE TABLE IF NOT EXISTS departments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    manager_id INT,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Create password reset tokens table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_token (token),
    INDEX idx_user_id (user_id),
    INDEX idx_expires_at (expires_at)
);

-- Create organizations table
CREATE TABLE IF NOT EXISTS organizations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(100),
    website VARCHAR(255),
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create contacts table
CREATE TABLE IF NOT EXISTS contacts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20),
    job_title VARCHAR(100),
    department VARCHAR(100),
    organization_id INT,
    city VARCHAR(50),
    country VARCHAR(50),
    address TEXT,
    notes TEXT,
    status ENUM('Active', 'Inactive') DEFAULT 'Active',
    preferred_contact_method ENUM('Email', 'Phone', 'SMS') DEFAULT 'Email',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL
);

-- Add customer_id to tickets table if it doesn't exist
ALTER TABLE tickets ADD COLUMN customer_id INT;

-- Insert default departments
INSERT IGNORE INTO departments (name, description) VALUES
('Admin', 'Administrative department handling general inquiries and management'),
('ICT', 'Information and Communication Technology department'),
('Finance', 'Financial department handling payments and financial inquiries'),
('Program Management', 'Department managing award programs and progressions'),
('Customer Service', 'Customer service department handling customer support');

-- Insert sample customers
INSERT IGNORE INTO customers (first_name, last_name, email, phone, company, status) VALUES
('John', 'Doe', 'john.doe@example.com', '+254700123456', 'Tech Solutions Ltd', 'active'),
('Jane', 'Smith', 'jane.smith@example.com', '+254700123457', 'Business Corp', 'active'),
('Mike', 'Johnson', 'mike.johnson@example.com', '+254700123458', 'Innovation Hub', 'active');

-- Insert sample organizations
INSERT IGNORE INTO organizations (name, description, email, phone) VALUES
('Tech Solutions Ltd', 'Technology solutions provider', 'info@techsolutions.com', '+254700111222'),
('Business Corp', 'Business consulting company', 'contact@businesscorp.com', '+254700111223'),
('Innovation Hub', 'Innovation and startup incubator', 'hello@innovationhub.com', '+254700111224');

-- Insert sample contacts
INSERT IGNORE INTO contacts (first_name, last_name, email, phone, job_title, department, organization_id, status) VALUES
('Alice', 'Brown', 'alice.brown@techsolutions.com', '+254700222333', 'Project Manager', 'ICT', 1, 'Active'),
('Bob', 'Wilson', 'bob.wilson@businesscorp.com', '+254700222334', 'Business Analyst', 'Admin', 2, 'Active'),
('Carol', 'Davis', 'carol.davis@innovationhub.com', '+254700222335', 'Innovation Lead', 'Program Management', 3, 'Active');

-- Insert some sample tickets for testing
INSERT IGNORE INTO tickets (user_id, customer_id, subject, description, type, department, priority, status) VALUES
(2, 1, 'Certificate Request', 'I need my award certificate', 'Certificate Request', 'Admin', 'medium', 'new'),
(2, 2, 'Technical Issue', 'Website not loading properly', 'Technical Support', 'ICT', 'high', 'open'),
(2, 3, 'Award Progression Query', 'When will I receive my bronze award?', 'Award Progression', 'Program Management', 'low', 'resolved');

SELECT 'Database setup completed successfully!' as message;