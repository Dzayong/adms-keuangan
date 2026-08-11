-- ADMS QRIS INTERNAL Database Seed Data (MySQL Compatible)
-- Default Password for Admin123!: $2a$10$Y1xOnD7Z8A9yq0yJv0bE9.c/u2eD3x4f5g6h7i8j9k0l1m2n3o4p5
-- Default Password for Operator123!: $2a$10$Z2yPoE8a9B0zr1zKw1cF0.d/v3fE4y5g6h7i8j9k0l1m2n3o4p5

-- WARNING FOR PRODUCTION: Change these default passwords immediately after setup!

INSERT INTO users (id, name, email, password_hash, role, is_active) VALUES
(1, 'System Administrator', 'admin@admsqris.local', '$2a$10$2S3A2c2lO9kXjCq9aH4D3.N33A8Yy9uV/J6Nl8e5M8p2P1Q8R3K2.', 'ADMIN', 1),
(2, 'Operations Staff', 'operator@admsqris.local', '$2a$10$2S3A2c2lO9kXjCq9aH4D3.N33A8Yy9uV/J6Nl8e5M8p2P1Q8R3K2.', 'OPERATOR', 1)
ON DUPLICATE KEY UPDATE name=VALUES(name);

INSERT INTO payment_providers (id, name, code, environment, is_active) VALUES
(1, 'Mock QRIS', 'mock', 'sandbox', 1),
(2, 'DANA QRIS (Placeholder)', 'dana', 'sandbox', 0)
ON DUPLICATE KEY UPDATE name=VALUES(name);

INSERT INTO settings (`key`, `value`) VALUES
('company_name', 'PT ADMS Solusi Digital'),
('company_email', 'contact@admsqris.local'),
('company_phone', '021-555-0199'),
('currency', 'IDR'),
('timezone', 'Asia/Jakarta'),
('mock_expiry_minutes', '15'),
('dana_client_id', ''),
('dana_client_secret', ''),
('dana_environment', 'sandbox')
ON DUPLICATE KEY UPDATE `value`=`value`;
