-- Test Data: Create sample customers for testing
-- Run this script in your PostgreSQL database to populate test data

-- Insert test customers with IDs 1 and 2
INSERT INTO customers (
  first_name, last_name, email, home_phone, mobile_phone, 
  birthdate, id_type, id_number, referral, identification_info,
  street_address, city, state, zipcode, customer_number,
  created_by_user_id, created_by_username, created_at
) VALUES 
(
  'John', 'Smith', 'john.smith@example.com', '555-1234', '555-5678',
  '1985-03-15', 'Drivers License', 'DL123456', 'Walk-in', 'Valid ID on file',
  '123 Main Street', 'Springfield', 'IL', '62701', 'CUST001',
  1, 'admin', NOW()
),
(
  'Susan', 'Johnson', 'susan@example.com', '555-2345', '555-6789',
  '1990-07-22', 'Passport', 'PASS789012', 'Referral', 'Valid passport',
  '456 Oak Avenue', 'Chicago', 'IL', '60601', 'CUST002',
  1, 'admin', NOW()
),
(
  'Michael', 'Brown', 'michael.brown@example.com', '555-3456', '555-7890',
  '1988-11-10', 'Drivers License', 'DL234567', 'Walk-in', 'Valid ID',
  '789 Pine Road', 'Rockford', 'IL', '61101', 'CUST003',
  1, 'admin', NOW()
),
(
  'Emily', 'Davis', 'emily.davis@example.com', '555-4567', '555-8901',
  '1992-05-30', 'Drivers License', 'DL345678', 'Phone', 'Valid ID',
  '321 Elm Street', 'Peoria', 'IL', '61602', 'CUST004',
  1, 'admin', NOW()
),
(
  'Robert', 'Wilson', 'robert.w@example.com', '555-5678', '555-9012',
  '1987-09-18', 'Passport', 'PASS890123', 'Walk-in', 'Valid passport',
  '654 Cedar Lane', 'Evanston', 'IL', '60201', 'CUST005',
  1, 'admin', NOW()
)
ON CONFLICT DO NOTHING;

-- Verify customers were created
SELECT id, first_name, last_name, email, created_at FROM customers ORDER BY id LIMIT 10;
