-- 0024: sales rep attribution on quote inquiries.
-- Adds salesRepName to package_inquiries so a prospect can name the
-- commission sales rep they are working with (self-reported on the
-- /get-started quote request form) and the rep gets compensated.
ALTER TABLE `package_inquiries` ADD `salesRepName` varchar(120) NULL;
