-- 0029: referrer contact details on quote inquiries.
-- Expands the simple "Who referred you?" name field (0028) into full contact
-- details so the referrer can be reached and paid their 10% of the customer's
-- first paid invoice. Collected via the expandable "I was referred by someone"
-- checkbox on the quote request form. Name and email are required when the
-- checkbox is checked; phone is optional. The old referredBy column is kept
-- for backward compatibility.
ALTER TABLE `package_inquiries` ADD `referrerName` varchar(120) NULL;
ALTER TABLE `package_inquiries` ADD `referrerEmail` varchar(255) NULL;
ALTER TABLE `package_inquiries` ADD `referrerPhone` varchar(40) NULL;
