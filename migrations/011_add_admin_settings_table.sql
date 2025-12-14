-- Create admin_settings table for storing admin panel password
CREATE TABLE IF NOT EXISTS admin_settings (
  id SERIAL PRIMARY KEY,
  admin_password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  changed_by VARCHAR(255),
  change_reason VARCHAR(500)
);

-- Insert initial admin password (hashed with bcrypt)
-- Default password: pawnflowniran!@#12
-- Hash generated with bcrypt rounds=10
INSERT INTO admin_settings (admin_password, changed_by, change_reason)
SELECT '$2a$10$abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHIJKLMNOPQRST', 'system', 'Initial setup'
WHERE NOT EXISTS (SELECT 1 FROM admin_settings);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_admin_settings_id ON admin_settings(id);
