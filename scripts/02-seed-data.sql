-- Insert sample products (20L water jars)
INSERT INTO products (name, description, price, brand, image_url) VALUES
('Bisleri 20L Jar', 'Pure and safe drinking water', 65.00, 'Bisleri', '/placeholder.svg?height=200&width=200'),
('Aquafina 20L Jar', 'Trusted water brand', 60.00, 'Aquafina', '/placeholder.svg?height=200&width=200'),
('Kinley 20L Jar', 'Coca-Cola trusted water', 62.00, 'Kinley', '/placeholder.svg?height=200&width=200'),
('Rail Neer 20L Jar', 'Indian Railways premium water', 55.00, 'Rail Neer', '/placeholder.svg?height=200&width=200');

-- Insert admin user (password will be hashed in real implementation)
INSERT INTO users (email, phone, name, role) VALUES
('admin@paani.now', '9999999999', 'Admin', 'admin');
