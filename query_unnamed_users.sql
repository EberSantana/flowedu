SELECT id, openId, name, email, role, loginMethod, createdAt, lastSignedIn 
FROM users 
WHERE name IS NULL OR name = '' OR name = 'Sem nome'
ORDER BY createdAt DESC;
