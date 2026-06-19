
-- Insert new Brokerage-specific Departments
INSERT IGNORE INTO departments (name, description, status) VALUES
('Brokerage Operations', 'Direct handling of share transactions and account maintenance', 'active'),
('Compliance', 'KYC verification and regulatory adherence monitoring', 'active'),
('Trading Desk', 'Execution of buy and sell orders on the NSE', 'active');

-- Get department IDs for reference (in case we need to link them, though types are independent in current schema)
-- Current schema uses name (VARCHAR) in tickets table, so we just need the ticket_types table updated.

-- Insert new Brokerage-specific Ticket Types
INSERT IGNORE INTO ticket_types (name, description, category, priority_level, status) VALUES
('Account Opening', 'New CDSC account opening for individual or corporate clients', 'Onboarding', 'medium', 'active'),
('Order Placing', 'Buy or sell order execution on the Nairobi Securities Exchange', 'Trading', 'urgent', 'active'),
('Share Immobilization', 'Process of converting physical share certificates back to electronic form', 'Shares', 'medium', 'active'),
('Shares Transfer/Transmission', 'Transfer or transmission of shares after death or court order', 'Legal', 'high', 'active');
