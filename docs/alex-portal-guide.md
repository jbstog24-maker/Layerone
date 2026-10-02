# Alex Knowledge Base: Layer One Staging Site and Customer Portal Guide

> NOTE FOR MAINTAINERS: Regenerate this guide whenever portal navigation or pages change materially. It is uploaded to Alex's knowledge base in Bland. Last generated: 2026-10-02 from the actual site codebase.

## What Layer One Staging is

Layer One Staging is a B2B IT equipment staging, kitting, logistics, and deployment-readiness company serving the Dallas-Fort Worth metro. Tagline: "Layer One Staging is the operational layer between equipment procurement and field deployment." Customers are MSPs, IT integrators, national rollout companies, retailers, restaurant and franchise groups, and any organization deploying technology across multiple locations.

Core services: receiving, configuration, asset tagging, QA, site-specific kitting, storage, DFW delivery, documentation, and a customer portal with full project transparency (photos, status, messaging, quotes, invoices, documents).

The public site is https://www.layeronestaging.com. The customer portal lives at the same domain under /dashboard and related paths.

Business phone (Alex's line): (469) 537-4378. Business email: info@layeronestaging.com.

## Public site map (no login needed)

- / : Homepage. Hero, how it works, services, why Layer One, rollout types, packages, add-ons, customer portal preview, industries, about, facility gallery, FAQ, contact CTA. Also has a "24/7 Direct Line" section: every customer company gets a direct line answered around the clock, no hold time.
- /about : Company story. Founder is James Stogner, a U.S. Air Force veteran with 20+ years in IT. Disabled veteran-owned company.
- /team : Meet the team, including Alex (AI Client Representative), Morgan (AI Scheduling Coordinator), and Casey (AI Project Coordinator). Be honest that you are AI if asked; the site already says so.
- /get-started : Project quote request form. Collects contact info, location count, equipment types, start date, rollout duration. Phone number is required.
- /services/* : Twelve SEO service pages (IT equipment staging DFW, network equipment staging, IT rollout logistics, technology deployment logistics, POS deployment staging, network deployment kitting, IT equipment kitting services, multi-site technology rollouts, IT asset tagging and inventory, device configuration and firmware staging, retail technology deployment, restaurant and franchise technology rollouts).
- /login : Customer and staff login (email + password).
- /register : New account registration.
- /set-password : Set password via invite link.
- /sign/:token : MSA signing page (opened from the link in the proposal email).
- /privacy, /terms : Privacy policy and terms.
- /verify-call, /cancel-call : Schedule-a-call verification and cancellation pages.

## Customer portal: logging in

1. Go to https://www.layeronestaging.com/login.
2. Enter the email address and password. New users get here from an invite email; the invite link goes to /set-password to create the password first.
3. Trouble logging in: use the password reset option on the login page, or call (469) 537-4378 and Alex can take a message for a reset link.

There are two customer roles. Customer Admin can view everything and submit requests (delivery requests, shipment requests). Customer Viewer is read-only. If someone needs more users added to their account, that is handled by their Layer One account manager (James).

## Customer portal navigation (sidebar)

Customers see these sections. Admin-only items are not visible to customers.

**Overview**
- Dashboard (/dashboard): The home screen after login. Shows attention items (things needing action), key numbers, and recent activity.

**My Portal** (customer_admin and customer_viewer)
- My Devices (/my-devices): The customer's own equipment in the system. Search and filter by status, site, or type.
- Staging Instructions (/my-instructions): Special instructions the customer has left for staging work.
- Messages (/support-messages): Conversation threads with the Layer One team. Customers can read and reply here.
- Support Tickets (/support): Formal support tickets. Open a new ticket here for issues needing tracking.

**Billing** (customer_admin and customer_viewer)
- Invoices (/invoices): List of invoices with status badges (e.g. draft, sent, paid, overdue). Clicking an invoice opens the detail view with line items, totals, tax, and notes. Payment is handled through the secure Stripe payment link sent by email with the invoice or proposal; once paid, the invoice status in the portal updates to paid.

**Audit**
- Activity Log (/activity): A timeline of account activity.

**Account**
- My Account (/account): Profile settings, contact info, and the "Phone PIN for Alex" card. The phone PIN is 4 to 6 digits, set here, and is what Alex asks for (on the keypad) before discussing account details by phone. If no PIN is set, the portal shows a banner prompting to set one.

**Help**
- Help Center (/help): FAQs and guides.

**Onboarding**
- New customers get an onboarding checklist in the portal after their first payment clears. It tracks setup steps (account details, contacts, delivery preferences) until the account is fully active.

## Step-by-step how-tos (speakable)

**How to log in:** "Go to layeronestaging.com and click Login at the top, or go straight to layeronestaging.com/login. Enter your email and password."

**How to reset a password:** "On the login page, use the password reset option. You'll get an email with a link to set a new password."

**How to view an invoice:** "Log in, then in the left sidebar under Billing, click Invoices. You'll see every invoice with its status. Click any row to open the detail with line items and totals."

**How to pay an invoice:** "Open the invoice in the portal to review it. Payment goes through the secure Stripe payment link we emailed you. Once it clears, the invoice shows as paid in the portal."

**How to check a quote:** TODO: confirm the exact customer-facing quote page path. Quotes are created from the /get-started form; customers are notified by email.

**How to approve a quote:** TODO: confirm the exact customer approval flow in the portal.

**How to track a shipment:** "Log in and look for your shipments section. Each shipment shows its status and tracking details." TODO: confirm the exact customer-visible shipments path.

**How to message the team:** "In the left sidebar under My Portal, click Messages. Open the thread and type your reply. We see it right away."

**How to open a support ticket:** "Under My Portal, click Support Tickets, then open a new ticket. Describe the issue and we'll pick it up."

**How to set the phone PIN for Alex:** "Log in, go to My Account, and find the Phone PIN for Alex card. Enter 4 to 6 digits, confirm them, and save. Next time you call in, I'll ask you to punch that PIN in on your keypad before I share any account details."

**How to sign the MSA:** "Open the proposal email we sent you and click the MSA signing link. It takes you to a signing page where you review and sign. Your first payment is due before any equipment can be received."

**How to update contact info:** "Go to My Account to update your profile. For changes to delivery addresses or dates, call in or message us and we'll confirm and handle it."

## What happens next (after key actions)

- After submitting the /get-started quote form: the request lands in the system, a quote is drafted, and the customer gets a proposal email with the MSA signing link and a Stripe payment link.
- After signing the MSA and paying: the onboarding checklist appears in the portal and the account becomes active. Note: first payment must clear before any equipment is received at the dock.
- After paying an invoice: the invoice flips to paid in the portal.
- After sending a portal message: the Layer One team is notified and replies in the same thread.
- After requesting a call on the website: the caller gets an email verification link; once verified, the call is scheduled and Alex calls at the chosen time.

## Key URLs

- Homepage: https://www.layeronestaging.com/
- Login: https://www.layeronestaging.com/login
- Dashboard: https://www.layeronestaging.com/dashboard
- Quote request: https://www.layeronestaging.com/get-started
- About: https://www.layeronestaging.com/about
- Team: https://www.layeronestaging.com/team
- My devices: https://www.layeronestaging.com/my-devices
- Messages: https://www.layeronestaging.com/support-messages
- Support tickets: https://www.layeronestaging.com/support
- Invoices: https://www.layeronestaging.com/invoices
- My account: https://www.layeronestaging.com/account
- Help center: https://www.layeronestaging.com/help
- Phone: https://www.layeronestaging.com/ (click to call (469) 537-4378) or dial (469) 537-4378 directly.
- Email: info@layeronestaging.com

## FAQ for callers

- "Where is my invoice?" Billing, then Invoices in the sidebar. Click the row for detail.
- "How do I pay?" Through the secure Stripe payment link in your email. The portal then shows it as paid.
- "Where is my shipment?" Check the shipments area of your portal; each shows status and tracking.
- "How do I reach a person?" Message us in the portal under Messages, open a support ticket, email info@layeronestaging.com, or call (469) 537-4378 any time.
- "Can you take my card over the phone?" No. Alex never takes card numbers on a call. Use the secure payment link.
- "I forgot my password." Use the reset option on the login page.
- "How do I add someone to my account?" Your Layer One account manager handles that; message us in the portal.
- "What are your hours?" The phone line is answered 24/7. Office hours are Monday to Friday, 8 AM to 5 PM Central.

## Notes for Alex

- Never invent portal pages, URLs, or features not listed here. If unsure, say so and offer to have James follow up.
- Never name the facility provider. All facility capabilities are Layer One's own operation.
- Never quote prices, stats, or customer claims not in your instructions.
- If asked whether you are AI, answer honestly: yes.
- For account-specific lookups and changes, follow the caller verification flow (account identifier plus keypad PIN) before sharing anything.
