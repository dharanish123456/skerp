-- Update password for admin user to match BCrypt hash of 'admin'
UPDATE users 
SET password = '$2a$10$4s9W48K4Oj9ltS.2cYF90esYDrxonFVqA2tvIgRRQ83yNHH0rwdPe' 
WHERE username = 'admin';
