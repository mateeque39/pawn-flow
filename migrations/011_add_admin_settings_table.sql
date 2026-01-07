-- Create admin_settings table for storing admin panel password
CREATE TABLE IF NOT EXISTS admin_settings (
  id SERIAL PRIMARY KEY,
  admin_password VARCHAR(255) NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add columns only if they don't exist
ALTER TABLE admin_settings ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Insert initial admin password if not exists
INSERT INTO admin_settings (admin_password)
SELECT '$2a$10$abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHIJKLMNOPQRST'
WHERE NOT EXISTS (SELECT 1 FROM admin_settings);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_admin_settings_id ON admin_settings(id);

