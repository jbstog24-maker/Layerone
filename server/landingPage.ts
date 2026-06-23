/**
 * landingPage.ts
 *
 * Returns a fully-rendered HTML string for the public landing page at GET /.
 * All meaningful content is inline so crawlers and ingestion tools can read it
 * on the initial HTTP response without executing JavaScript.
 *
 * The page also loads the React bundle so authenticated users are seamlessly
 * handed off to the SPA dashboard after the JS hydrates.
 */

export function getLandingPageHtml(opts: {
  appTitle: string;
  analyticsEndpoint?: string;
  analyticsWebsiteId?: string;
  loginUrl?: string;
  viteScriptTag?: string; // injected by Vite in dev; empty in prod (bundle loaded via <script>)
  bundleScriptTag?: string; // prod: <script type="module" src="/assets/index-xxx.js">
}): string {
  // Use /api/oauth/start as the canonical server-side login redirect
  const effectiveLoginUrl = opts.loginUrl || "/api/oauth/start";
  const { appTitle, analyticsEndpoint, analyticsWebsiteId, viteScriptTag, bundleScriptTag } = opts;
  const loginUrl = effectiveLoginUrl;

  const analyticsTag =
    analyticsEndpoint && analyticsWebsiteId
      ? `<script defer src="${analyticsEndpoint}/umami" data-website-id="${analyticsWebsiteId}"></script>`
      : "";

  const scriptTag = viteScriptTag ?? bundleScriptTag ?? "";

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1" />
  <title>Layer One Staging Solutions — Receive. Stage. Kit. Deploy.</title>
  <meta name="description" content="Layer One Staging Solutions is a fully managed IT staging and logistics operation serving MSPs, cabling contractors, and rollout teams in the Dallas area. Receive, stage, kit, and deploy — all tracked in one portal." />
  <meta name="keywords" content="network equipment staging, device management, logistics portal, warehouse management, IT staging, network operations" />
  <meta property="og:title" content="${appTitle}" />
  <meta property="og:description" content="Professional operations portal for network equipment staging, warehousing, and logistics management." />
  <meta property="og:type" content="website" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --bg: #0a0a0f;
      --bg2: #111118;
      --card: #16161f;
      --border: rgba(255,255,255,0.08);
      --primary: #6366f1;
      --primary-light: #818cf8;
      --text: #f1f5f9;
      --muted: #94a3b8;
      --radius: 12px;
    }
    html { scroll-behavior: smooth; }
    body {
      font-family: 'Inter', system-ui, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.6;
      -webkit-font-smoothing: antialiased;
    }
    a { color: inherit; text-decoration: none; }
    /* ── Nav ── */
    nav {
      position: sticky; top: 0; z-index: 50;
      display: flex; align-items: center; justify-content: space-between;
      padding: 0 clamp(1rem, 5vw, 4rem);
      height: 60px;
      background: rgba(10,10,15,0.85);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--border);
    }
    .nav-logo { font-size: 1.05rem; font-weight: 700; letter-spacing: -0.02em; }
    .nav-logo span { color: var(--primary-light); }
    .nav-links { display: flex; align-items: center; gap: 10px; }
    .nav-signin {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 8px 16px; border-radius: 8px;
      background: transparent; color: var(--muted);
      font-size: 0.875rem; font-weight: 500;
      border: 1px solid var(--border);
      transition: color 0.15s, border-color 0.15s;
    }
    .nav-signin:hover { color: var(--text); border-color: rgba(255,255,255,0.2); }
    .nav-cta {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 8px 20px; border-radius: 8px;
      background: var(--primary); color: #fff;
      font-size: 0.875rem; font-weight: 600;
      transition: opacity 0.15s;
    }
    .nav-cta:hover { opacity: 0.88; }
    /* ── Hero ── */
    .hero {
      max-width: 900px; margin: 0 auto;
      padding: clamp(4rem, 10vw, 8rem) clamp(1rem, 5vw, 2rem) clamp(3rem, 8vw, 6rem);
      text-align: center;
    }
    .hero-badge {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 4px 14px; border-radius: 999px;
      background: rgba(99,102,241,0.12); border: 1px solid rgba(99,102,241,0.3);
      font-size: 0.75rem; font-weight: 600; color: var(--primary-light);
      letter-spacing: 0.04em; text-transform: uppercase;
      margin-bottom: 1.5rem;
    }
    .hero h1 {
      font-size: clamp(2rem, 5vw, 3.5rem);
      font-weight: 800; letter-spacing: -0.03em; line-height: 1.1;
      margin-bottom: 1.25rem;
    }
    .hero h1 em { font-style: normal; color: var(--primary-light); }
    .hero p {
      font-size: clamp(1rem, 2vw, 1.2rem);
      color: var(--muted); max-width: 620px; margin: 0 auto 2.5rem;
    }
    .hero-actions { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
    .btn-primary {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 13px 28px; border-radius: 10px;
      background: var(--primary); color: #fff;
      font-size: 0.95rem; font-weight: 600;
      transition: opacity 0.15s, transform 0.1s;
    }
    .btn-primary:hover { opacity: 0.88; transform: translateY(-1px); }
    .btn-secondary {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 13px 28px; border-radius: 10px;
      background: transparent; color: var(--text);
      border: 1px solid var(--border);
      font-size: 0.95rem; font-weight: 500;
      transition: border-color 0.15s, background 0.15s;
    }
    .btn-secondary:hover { border-color: rgba(255,255,255,0.2); background: rgba(255,255,255,0.04); }
    /* ── Stats bar ── */
    .stats-bar {
      display: flex; flex-wrap: wrap; justify-content: center; gap: 0;
      border-top: 1px solid var(--border); border-bottom: 1px solid var(--border);
      background: var(--bg2);
    }
    .stat-item {
      flex: 1; min-width: 160px;
      padding: 1.5rem 2rem;
      border-right: 1px solid var(--border);
      text-align: center;
    }
    .stat-item:last-child { border-right: none; }
    .stat-value { font-size: 1.75rem; font-weight: 800; color: var(--primary-light); }
    .stat-label { font-size: 0.8rem; color: var(--muted); margin-top: 2px; }
    /* ── Section ── */
    .section {
      max-width: 1100px; margin: 0 auto;
      padding: clamp(3rem, 8vw, 6rem) clamp(1rem, 5vw, 2rem);
    }
    .section-label {
      font-size: 0.75rem; font-weight: 600; letter-spacing: 0.08em;
      text-transform: uppercase; color: var(--primary-light);
      margin-bottom: 0.75rem;
    }
    .section-title {
      font-size: clamp(1.5rem, 3vw, 2.25rem);
      font-weight: 800; letter-spacing: -0.025em; line-height: 1.15;
      margin-bottom: 1rem;
    }
    .section-sub { font-size: 1rem; color: var(--muted); max-width: 560px; margin-bottom: 3rem; }
    /* ── Feature grid ── */
    .feature-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.25rem;
    }
    .feature-card {
      background: var(--card); border: 1px solid var(--border);
      border-radius: var(--radius); padding: 1.5rem;
      transition: border-color 0.2s;
    }
    .feature-card:hover { border-color: rgba(99,102,241,0.35); }
    .feature-icon {
      width: 40px; height: 40px; border-radius: 10px;
      background: rgba(99,102,241,0.12); border: 1px solid rgba(99,102,241,0.2);
      display: flex; align-items: center; justify-content: center;
      font-size: 1.1rem; margin-bottom: 1rem;
    }
    .feature-card h3 { font-size: 0.95rem; font-weight: 700; margin-bottom: 0.4rem; }
    .feature-card p { font-size: 0.85rem; color: var(--muted); line-height: 1.55; }
    /* ── How it works ── */
    .steps { display: flex; flex-direction: column; gap: 0; }
    .step {
      display: flex; gap: 1.5rem; align-items: flex-start;
      padding: 1.75rem 0; border-bottom: 1px solid var(--border);
    }
    .step:last-child { border-bottom: none; }
    .step-num {
      width: 36px; height: 36px; border-radius: 50%; shrink: 0;
      background: rgba(99,102,241,0.15); border: 1px solid rgba(99,102,241,0.3);
      display: flex; align-items: center; justify-content: center;
      font-size: 0.85rem; font-weight: 700; color: var(--primary-light);
      flex-shrink: 0;
    }
    .step h3 { font-size: 1rem; font-weight: 700; margin-bottom: 0.3rem; }
    .step p { font-size: 0.875rem; color: var(--muted); }
    /* ── Roles ── */
    .roles-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 1.25rem;
    }
    .role-card {
      background: var(--card); border: 1px solid var(--border);
      border-radius: var(--radius); padding: 1.5rem;
    }
    .role-card h3 { font-size: 0.95rem; font-weight: 700; margin-bottom: 0.5rem; }
    .role-card p { font-size: 0.82rem; color: var(--muted); line-height: 1.55; }
    .role-badge {
      display: inline-block; padding: 2px 10px; border-radius: 999px;
      font-size: 0.7rem; font-weight: 600; letter-spacing: 0.04em;
      text-transform: uppercase; margin-bottom: 0.75rem;
    }
    .badge-admin { background: rgba(239,68,68,0.12); color: #f87171; border: 1px solid rgba(239,68,68,0.2); }
    .badge-staff { background: rgba(99,102,241,0.12); color: var(--primary-light); border: 1px solid rgba(99,102,241,0.2); }
    .badge-customer { background: rgba(34,197,94,0.12); color: #4ade80; border: 1px solid rgba(34,197,94,0.2); }
    /* ── CTA section ── */
    .cta-section {
      background: linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(139,92,246,0.08) 100%);
      border-top: 1px solid var(--border); border-bottom: 1px solid var(--border);
    }
    .cta-inner {
      max-width: 700px; margin: 0 auto; text-align: center;
      padding: clamp(3rem, 8vw, 5rem) clamp(1rem, 5vw, 2rem);
    }
    .cta-inner h2 { font-size: clamp(1.5rem, 3vw, 2.25rem); font-weight: 800; letter-spacing: -0.025em; margin-bottom: 1rem; }
    .cta-inner p { font-size: 1rem; color: var(--muted); margin-bottom: 2rem; }
    /* ── Footer ── */
    footer {
      border-top: 1px solid var(--border);
      padding: 2rem clamp(1rem, 5vw, 4rem);
      display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem;
    }
    footer p { font-size: 0.8rem; color: var(--muted); }
    /* ── React root (hidden until JS hydrates) ── */
    #root:not(:empty) ~ .landing-page-shell { display: none !important; }
    .landing-page-shell { display: contents; }
  </style>
  ${analyticsTag}
</head>
<body>
  <!-- React SPA mounts here; once hydrated it takes over the page -->
  <div id="root"></div>

  <!--
    LANDING PAGE SHELL
    Visible to crawlers and on initial page load before React hydrates.
    When the React app mounts into #root, this shell is hidden via CSS.
  -->
  <div class="landing-page-shell" aria-hidden="false">

    <!-- Navigation -->
    <nav>
      <a href="/" class="nav-logo" style="display:flex;align-items:center;text-decoration:none;">
        <img src="/manus-storage/layerone-logo-on-dark_6114040f.png" alt="Layer One Staging Solutions" style="height:36px;width:auto;object-fit:contain;" />
      </a>
      <div class="nav-links">
        <a href="${loginUrl}" class="nav-signin">Sign In</a>
        <a href="${loginUrl}" class="nav-cta">Get Started →</a>
      </div>
    </nav>

    <!-- Hero -->
    <header class="hero">
      <div class="hero-badge">Receive. Stage. Kit. Deploy.</div>
      <h1>Secure network staging<br /><em>before the truck rolls.</em></h1>
      <p>
        Layer One handles receiving, organizing, staging, packing, shipping,
        and deployment-prep for MSPs, cabling contractors, security installers,
        and rollout teams — with full customer visibility through our portal.
      </p>
      <div class="hero-actions">
        <a href="${loginUrl}" class="btn-primary" style="font-size:1.05rem;padding:16px 36px;box-shadow:0 0 32px rgba(99,102,241,0.35);">Get Started Free →</a>
        <a href="${loginUrl}" class="btn-secondary">Sign In</a>
      </div>
      <p style="margin-top:1rem;font-size:0.8rem;color:var(--muted);">No credit card required &nbsp;·&nbsp; Setup in minutes &nbsp;·&nbsp; Cancel anytime</p>
    </header>

    <!-- Stats bar -->
    <div class="stats-bar" role="list" aria-label="Platform highlights">
      <div class="stat-item" role="listitem">
        <div class="stat-value">100%</div>
        <div class="stat-label">Device Traceability</div>
      </div>
      <div class="stat-item" role="listitem">
        <div class="stat-value">Real-time</div>
        <div class="stat-label">Status Updates</div>
      </div>
      <div class="stat-item" role="listitem">
        <div class="stat-value">End-to-end</div>
        <div class="stat-label">Chain of Custody</div>
      </div>
      <div class="stat-item" role="listitem">
        <div class="stat-value">Multi-client</div>
        <div class="stat-label">Isolated Portals</div>
      </div>
    </div>

    <!-- Features -->
    <main>
      <section class="section" id="features" aria-labelledby="features-title">
        <p class="section-label">Platform Features</p>
        <h2 class="section-title" id="features-title">Everything your staging operation needs</h2>
        <p class="section-sub">
          From the moment equipment arrives at your facility to the day it ships to the client site,
          every step is tracked, documented, and visible.
        </p>

        <div class="feature-grid" role="list">
          <article class="feature-card" role="listitem">
            <div class="feature-icon" aria-hidden="true">📦</div>
            <h3>Device Inventory Management</h3>
            <p>
              Track every piece of network equipment by serial number and MAC address through
              a 12-stage lifecycle — from Expected through Shipped. Bulk-import devices via CSV.
              Export the full inventory at any time.
            </p>
          </article>

          <article class="feature-card" role="listitem">
            <div class="feature-icon" aria-hidden="true">🏭</div>
            <h3>Staging Task Tracking</h3>
            <p>
              Assign firmware updates, labeling runs, switch staging, and AP prep tasks to
              technicians. Track estimated vs actual hours, set priorities, and monitor
              the full task pipeline from the dashboard.
            </p>
          </article>

          <article class="feature-card" role="listitem">
            <div class="feature-icon" aria-hidden="true">🚚</div>
            <h3>Outbound Shipment Management</h3>
            <p>
              Create shipments, attach carrier and tracking numbers, and upload shipping
              documents (BOL, labels). Clients see their shipment status in real time
              through their dedicated portal.
            </p>
          </article>

          <article class="feature-card" role="listitem">
            <div class="feature-icon" aria-hidden="true">🏢</div>
            <h3>Client Account Management</h3>
            <p>
              Each client gets a unique account number, a warehouse space assignment,
              an onboarding timeline, and a dedicated portal login. Archive clients
              without losing any historical data.
            </p>
          </article>

          <article class="feature-card" role="listitem">
            <div class="feature-icon" aria-hidden="true">📋</div>
            <h3>Warehouse &amp; Inventory Receiving</h3>
            <p>
              Log inbound deliveries, assign boxes and pallets to storage locations,
              and track forwarding status. Every item gets a unique code and a full
              chain-of-custody record.
            </p>
          </article>

          <article class="feature-card" role="listitem">
            <div class="feature-icon" aria-hidden="true">💳</div>
            <h3>Invoicing &amp; Payments</h3>
            <p>
              Generate itemised invoices, record payments, and track outstanding balances.
              Clients can pay online via Stripe. Monthly invoices can be auto-generated
              on a schedule.
            </p>
          </article>

          <article class="feature-card" role="listitem">
            <div class="feature-icon" aria-hidden="true">🎯</div>
            <h3>Leads &amp; Sales Pipeline</h3>
            <p>
              Manage your sales pipeline from New through Won. Import leads from CSV,
              log calls and emails in the activity timeline, and track follow-up dates
              so nothing falls through the cracks.
            </p>
          </article>

          <article class="feature-card" role="listitem">
            <div class="feature-icon" aria-hidden="true">🎫</div>
            <h3>Support Ticket System</h3>
            <p>
              Clients submit support tickets directly from their portal. Staff respond
              in a threaded conversation. Internal-only notes let your team coordinate
              without the client seeing the discussion.
            </p>
          </article>

          <article class="feature-card" role="listitem">
            <div class="feature-icon" aria-hidden="true">📊</div>
            <h3>Reports &amp; CSV Export</h3>
            <p>
              Export device inventory, shipments, and client data to CSV for external
              reporting. KPI dashboard cards give you an instant operational health snapshot.
            </p>
          </article>
        </div>
      </section>

      <!-- How it works -->
      <section class="section" style="padding-top:0" aria-labelledby="how-title">
        <p class="section-label">How It Works</p>
        <h2 class="section-title" id="how-title">From intake to delivery in one workflow</h2>
        <p class="section-sub">
          The portal guides your team through every step of the staging process
          and keeps your clients informed at every stage.
        </p>

        <div class="steps" role="list">
          <div class="step" role="listitem">
            <div class="step-num" aria-hidden="true">1</div>
            <div>
              <h3>Client Onboarding</h3>
              <p>Create the client account, assign a warehouse space, and pre-provision their portal login. The onboarding timeline tracks every milestone automatically.</p>
            </div>
          </div>
          <div class="step" role="listitem">
            <div class="step-num" aria-hidden="true">2</div>
            <div>
              <h3>Equipment Receiving</h3>
              <p>Log inbound deliveries and capture serial numbers and MAC addresses for every device. Boxes and pallets are assigned storage locations and unique tracking codes.</p>
            </div>
          </div>
          <div class="step" role="listitem">
            <div class="step-num" aria-hidden="true">3</div>
            <div>
              <h3>Staging &amp; Configuration</h3>
              <p>Assign staging tasks to technicians — firmware updates, labeling, switch configuration, AP prep. Track progress in real time and update device statuses as each step completes.</p>
            </div>
          </div>
          <div class="step" role="listitem">
            <div class="step-num" aria-hidden="true">4</div>
            <div>
              <h3>Packing &amp; Shipment</h3>
              <p>Create outbound shipments, attach carrier and tracking information, and upload shipping documents. The client sees the shipment status update in their portal the moment you save it.</p>
            </div>
          </div>
          <div class="step" role="listitem">
            <div class="step-num" aria-hidden="true">5</div>
            <div>
              <h3>Invoicing &amp; Closure</h3>
              <p>Generate the invoice, record payment, and close out the project. All records — devices, shipments, documents, communications — are preserved for future reference.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Roles -->
      <section class="section" style="padding-top:0" aria-labelledby="roles-title">
        <p class="section-label">User Roles</p>
        <h2 class="section-title" id="roles-title">Built for your whole team and your clients</h2>
        <p class="section-sub">
          Four role levels give every person exactly the access they need — no more, no less.
        </p>

        <div class="roles-grid" role="list">
          <div class="role-card" role="listitem">
            <span class="role-badge badge-admin">Admin</span>
            <h3>Administrator</h3>
            <p>Full access to all features including user management, financial reports, billing configuration, and system settings.</p>
          </div>
          <div class="role-card" role="listitem">
            <span class="role-badge badge-staff">Staff</span>
            <h3>Operations Staff</h3>
            <p>Access to clients, devices, shipments, staging tasks, and support tickets. Cannot manage users or view financial reports.</p>
          </div>
          <div class="role-card" role="listitem">
            <span class="role-badge badge-customer">Customer</span>
            <h3>Client Admin</h3>
            <p>Portal access for the client's primary contact. Can view all their company's devices, shipments, invoices, and submit support tickets.</p>
          </div>
          <div class="role-card" role="listitem">
            <span class="role-badge badge-customer">Viewer</span>
            <h3>Client Viewer</h3>
            <p>Read-only portal access for additional client contacts who need visibility without the ability to submit requests or view invoices.</p>
          </div>
        </div>
      </section>
    </main>

    <!-- CTA -->
    <div class="cta-section">
      <div class="cta-inner">
        <h2>Ready to streamline your staging operation?</h2>
        <p>Join Layer One clients already managing their equipment, shipments, and invoices through the portal.</p>
        <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
          <a href="${loginUrl}" class="btn-primary" style="font-size:1rem;padding:15px 36px;box-shadow:0 0 32px rgba(99,102,241,0.3);">Get Started Free →</a>
          <a href="${loginUrl}" class="btn-secondary">Sign In to Existing Account</a>
        </div>
        <p style="margin-top:1.25rem;font-size:0.8rem;color:var(--muted);">No credit card required &nbsp;·&nbsp; Setup in minutes &nbsp;·&nbsp; Full portal access</p>
      </div>
    </div>

    <!-- Footer -->
    <footer>
      <p>© ${new Date().getFullYear()} ${appTitle}. All rights reserved.</p>
      <p>Layer One Staging Solutions — Dallas, TX</p>
    </footer>

  </div><!-- /.landing-page-shell -->

  ${scriptTag}
</body>
</html>`;
}
