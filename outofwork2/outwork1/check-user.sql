SELECT p.id, p.email, p.role, sa.access_level 
FROM profiles p 
LEFT JOIN super_admins sa ON sa.id = p.id 
WHERE p.email = 'mubb@ymail.com';
