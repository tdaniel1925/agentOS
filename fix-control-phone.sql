-- Fix control_phone to correct area code (281, not 218)
UPDATE subscribers
SET control_phone = '+12815058290'
WHERE id = '09fab1d9-f180-44ca-acb6-5a3a774362e3';

-- Verify the update
SELECT id, name, email, control_phone, phone_number
FROM subscribers
WHERE id = '09fab1d9-f180-44ca-acb6-5a3a774362e3';
