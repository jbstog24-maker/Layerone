-- 0025: customer how-to guide sent tracking on quote inquiries.
-- Adds howToGuideSentAt to package_inquiries so the portal can show
-- whether the welcome email with the customer how-to guide was sent
-- (fired automatically on the paid+signed onboarding handoff).
ALTER TABLE `package_inquiries` ADD `howToGuideSentAt` timestamp NULL;
