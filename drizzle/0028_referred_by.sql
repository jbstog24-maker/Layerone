-- 0028: referral attribution on quote inquiries.
-- Adds referredBy to package_inquiries so a prospect can name who referred
-- them (self-reported on the /get-started quote request form). Referrers earn
-- 10% of the referred customer's first paid invoice, one-time payout.
ALTER TABLE `package_inquiries` ADD `referredBy` varchar(120) NULL;
