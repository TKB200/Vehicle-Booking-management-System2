-- Create Database
CREATE DATABASE IF NOT EXISTS `vehicle_booking_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `vehicle_booking_db`;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    role ENUM('admin', 'employee') DEFAULT 'employee',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vehicles Table
CREATE TABLE IF NOT EXISTS vehicles (
    id VARCHAR(10) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,
    status ENUM('Available', 'Maintenance') DEFAULT 'Available',
    image VARCHAR(255)
);

-- Bookings Table
CREATE TABLE IF NOT EXISTS bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vehicle_id VARCHAR(10) NOT NULL,
    user_id VARCHAR(50) NOT NULL,
    pickup_date DATE NOT NULL,
    pickup_time TIME NOT NULL,
    return_date DATE NOT NULL,
    return_time TIME NOT NULL,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- Seed Admin User
INSERT IGNORE INTO users (user_id, password, name, phone, role) 
VALUES ('AD001', '1234', 'Fleet Administrator', 'SYSTEM', 'admin');

-- Seed Default Vehicles
INSERT IGNORE INTO vehicles (id, name, type, status, image) VALUES 
('V001', 'Fleet Vehicle 1', 'Executive Sedan', 'Available', 'assets/vehicle.png'),
('V002', 'Fleet Vehicle 2', 'Executive Sedan', 'Available', 'assets/vehicle.png'),
('V003', 'Fleet Vehicle 3', 'Executive Sedan', 'Available', 'assets/vehicle.png'),
('V004', 'Fleet Vehicle 4', 'Executive Sedan', 'Available', 'assets/vehicle.png'),
('V005', 'Fleet Vehicle 5', 'Luxury SUV', 'Available', 'assets/vehicle.png'),
('V006', 'Fleet Vehicle 6', 'Luxury SUV', 'Available', 'assets/vehicle.png'),
('V007', 'Fleet Vehicle 7', 'Luxury SUV', 'Available', 'assets/vehicle.png'),
('V008', 'Fleet Vehicle 8', 'Luxury SUV', 'Available', 'assets/vehicle.png'),
('V009', 'Fleet Vehicle 9', 'Utility Van', 'Available', 'assets/vehicle.png'),
('V010', 'Fleet Vehicle 10', 'Utility Van', 'Available', 'assets/vehicle.png'),
('V011', 'Fleet Vehicle 11', 'Utility Van', 'Available', 'assets/vehicle.png');
