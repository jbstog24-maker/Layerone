export interface ServiceFaq {
  q: string;
  a: string;
}

export interface ServiceIncluded {
  title: string;
  desc: string;
}

export interface ServicePageData {
  slug: string;
  title: string;
  h1: string;
  metaDescription: string;
  intro: string[];
  included: ServiceIncluded[];
  processTitle: string;
  processNote: string;
  audiences: ServiceIncluded[];
  faqs: ServiceFaq[];
}

export const SERVICE_PAGES: ServicePageData[] = [
  {
    slug: "it-equipment-staging-dallas-fort-worth",
    title: "IT Equipment Staging in Dallas–Fort Worth | Layer One Staging",
    h1: "IT Equipment Staging in Dallas–Fort Worth",
    metaDescription:
      "Layer One Staging provides IT equipment staging in Dallas–Fort Worth: receiving, configuration, asset tagging, QA, kitting, and deployment logistics for DFW technology rollouts.",
    intro: [
      "Layer One Staging operates an IT equipment staging facility in the Dallas–Fort Worth metro built for one purpose: turning boxed vendor shipments into deployment-ready technology. Equipment arrives from your distributors and vendors; it leaves our dock inventoried, configured, labeled, QA-verified, and kitted by site.",
      "Our DFW location puts us within same-day reach of project sites across the metroplex, with dock access for LTL and parcel freight from any carrier. Whether you're refreshing a dozen offices across North Texas or staging a national rollout from a central Texas hub, your gear moves through one accountable operation — with photo documentation and portal visibility at every step.",
    ],
    included: [
      { title: "Inbound receiving & inspection", desc: "Freight accepted at our dock, counted, inspected, and photographed — damage flagged on arrival." },
      { title: "Inventory control", desc: "Every pallet, box, and device logged into your portal inventory with serial-level detail." },
      { title: "Configuration & firmware", desc: "Baseline configs and firmware updates applied to your spec sheet before deployment." },
      { title: "Asset tagging", desc: "Barcode/QR asset tags and site labels applied and recorded per device." },
      { title: "QA verification", desc: "Power-on checks, config review, and a signed deployment-readiness checklist." },
      { title: "Kitting & outbound", desc: "Site-specific kits packed and shipped nationwide — or delivered locally across DFW." },
    ],
    processTitle: "How DFW staging works",
    processNote:
      "Most DFW projects follow the same path: your vendors ship to our Carrollton-area facility, we stage to your spec, and finished kits go out by parcel, pallet, or our local DFW delivery. Because we're local, rush changes — a swapped switch, an added access point — can be turned around in hours, not shipping cycles.",
    audiences: [
      { title: "DFW MSPs", desc: "Offload receiving and staging so your engineers stay billable and on schedule." },
      { title: "General contractors", desc: "A technology staging partner for office build-outs and tenant improvements." },
      { title: "Retail & restaurant groups", desc: "North Texas locations staged identically from one central point." },
      { title: "National rollout teams", desc: "A central Texas staging hub with nationwide outbound shipping." },
    ],
    faqs: [
      {
        q: "Where is your staging facility?",
        a: "Our facility is in Carrollton, Texas, in the Dallas–Fort Worth metro, with dock access for palletized freight and parcel carriers.",
      },
      {
        q: "Do you deliver locally in DFW?",
        a: "Yes. We offer local DFW delivery for palletized freight ($175/pallet) and loose devices ($30/device) within the metro area.",
      },
      {
        q: "Can you stage equipment shipping outside Texas?",
        a: "Absolutely. DFW is our staging point; finished kits ship nationwide via parcel and LTL carriers with tracking.",
      },
    ],
  },
  {
    slug: "network-equipment-staging",
    title: "Network Equipment Staging Services | Layer One Staging",
    h1: "Network Equipment Staging",
    metaDescription:
      "Professional network equipment staging: switches, routers, firewalls, and access points received, configured, labeled, QA-verified, and kitted per site by Layer One Staging.",
    intro: [
      "Network deployments live or die in staging. A switch that arrives unconfigured, unlabeled, or with the wrong firmware becomes a multi-hour problem at 2 AM during a cutover window. Layer One Staging exists to make sure that never happens — we stage your network equipment so every device arrives at site configured, labeled, and verified.",
      "We handle switches, routers, firewalls, access points, SD-WAN edge devices, UPS units, and the cabling and accessories that go with them. Each device is inventoried by serial and MAC, updated to your approved firmware, configured to your baseline, labeled for its rack or mounting location, and packed into a site-specific kit with a packing list your tech can follow blind.",
    ],
    included: [
      { title: "Serial & MAC capture", desc: "Model, serial number, and MAC address recorded per device into your portal inventory." },
      { title: "Firmware standardization", desc: "Every device brought to your approved firmware revision before it ships." },
      { title: "Baseline configuration", desc: "Hostname, management IP, VLANs, and base config applied to your template." },
      { title: "Rack/location labeling", desc: "Labels identifying device, site, and rack position — scannable via QR." },
      { title: "Power-on QA", desc: "Every device powered on, config verified, and signed off on a QA checklist." },
      { title: "Cutover-ready kitting", desc: "Per-site kits with devices, patch cables, console cables, and install notes." },
    ],
    processTitle: "Staging for cutover windows",
    processNote:
      "Network refreshes usually run on tight maintenance windows. We stage against your cutover schedule — devices configured and labeled per site, kits sequenced in ship order, and spares staged alongside production gear so a DOA unit doesn't burn your window.",
    audiences: [
      { title: "MSPs & integrators", desc: "Keep your engineers on billable work while we handle the bench time." },
      { title: "Enterprise IT teams", desc: "Standardize every site's network gear from one staging operation." },
      { title: "SD-WAN rollout teams", desc: "Edge devices staged with site-specific configs for rapid deployment." },
      { title: "Data center teams", desc: "Rack-ready equipment labeled and verified for tight install windows." },
    ],
    faqs: [
      {
        q: "What network equipment do you stage?",
        a: "Switches, routers, firewalls, wireless access points, SD-WAN edge devices, UPS units, PDUs, patch panels, and associated cabling and optics.",
      },
      {
        q: "Can you load our configuration templates?",
        a: "Yes. Provide your baseline configs and firmware targets and we'll apply them per device or per site, then verify before packing.",
      },
      {
        q: "Do you handle RMAs for DOA gear found in staging?",
        a: "We flag dead-on-arrival units during QA with photo documentation, so you can start the vendor RMA immediately — before it impacts a cutover.",
      },
    ],
  },
  {
    slug: "it-rollout-logistics",
    title: "IT Rollout Logistics Services | Layer One Staging",
    h1: "IT Rollout Logistics",
    metaDescription:
      "End-to-end IT rollout logistics: centralized receiving, staging, site kitting, and scheduled outbound shipping for multi-location technology deployments.",
    intro: [
      "An IT rollout is a logistics problem wearing a technology costume. The equipment is rarely the hard part — the hard part is getting the right gear, configured correctly, to the right site, on the right day, dozens or hundreds of times in a row. That's the operation Layer One Staging runs.",
      "We act as the single logistics point for your rollout: vendors ship to us, we receive and stage everything centrally, and finished site kits move out on your deployment schedule. One inventory, one accountable team, and full portal visibility from the first pallet to the final site delivery.",
    ],
    included: [
      { title: "Centralized receiving", desc: "All vendor shipments converge at one dock — counted, inspected, and logged." },
      { title: "Rollout inventory", desc: "One live inventory across every site, with allocation tracked per location." },
      { title: "Staging to schedule", desc: "Kits built and sequenced against your deployment calendar, not ours." },
      { title: "Site-specific kitting", desc: "Each location gets exactly its bill of materials — verified before packing." },
      { title: "Scheduled outbound", desc: "Parcel, pallet, or LTL dispatch timed to site readiness and install windows." },
      { title: "Exception handling", desc: "Shortages, damage, and DOA units flagged early with documentation for claims." },
    ],
    processTitle: "Logistics around your schedule",
    processNote:
      "Rollouts rarely go exactly to plan — sites slip, vendors split-ship, quantities change. Because all inventory sits in one staged operation, we can re-sequence kits, reallocate spares, and adjust ship dates without the chaos of gear scattered across vendor warehouses and techs' garages.",
    audiences: [
      { title: "National rollout companies", desc: "A central staging and logistics point for multi-state deployments." },
      { title: "MSPs", desc: "Deliver multi-site projects without turning your office into a warehouse." },
      { title: "Franchise systems", desc: "Identical site kits for every location, shipped on the opening schedule." },
      { title: "IT project managers", desc: "One throat to choke on hardware logistics — and one portal to watch it." },
    ],
    faqs: [
      {
        q: "How many sites can you support in one rollout?",
        a: "Our operation is built for dozens to hundreds of sites, with project-based pricing that scales down per-site costs as volume grows.",
      },
      {
        q: "What if our deployment schedule slips?",
        a: "Staged kits can be held in secure storage, and ship dates re-sequenced. Extended storage is available at published daily rates.",
      },
      {
        q: "Do you handle the actual onsite installation?",
        a: "No — we're the staging and logistics layer. Your technicians or ours-by-referral handle installation; we make sure they arrive to deployment-ready kits.",
      },
    ],
  },
  {
    slug: "technology-deployment-logistics",
    title: "Technology Deployment Logistics | Layer One Staging",
    h1: "Technology Deployment Logistics",
    metaDescription:
      "Technology deployment logistics from Layer One Staging: receive, configure, kit, and ship technology deployments with chain-of-custody tracking nationwide.",
    intro: [
      "Between the purchase order and the go-live date sits a gap most organizations underestimate: the physical movement and preparation of technology. Layer One Staging fills that gap with a dedicated deployment logistics operation — receiving, staging, kitting, and forward logistics for technology projects of any size.",
      "Unlike general 3PL warehouses, we speak technology: serial and MAC capture, firmware baselines, asset tagging, configuration, and QA verification are standard parts of our workflow, not special requests. Your deployment arrives in the field as finished kits, not boxes of parts.",
    ],
    included: [
      { title: "Technology-aware receiving", desc: "Inbound gear inspected by people who know what a DOA switch looks like." },
      { title: "Configuration services", desc: "Firmware, baselines, and site-specific configs applied in staging." },
      { title: "Asset lifecycle records", desc: "Serial, MAC, asset tag, and photos captured into a per-device record." },
      { title: "Deployment kitting", desc: "Complete per-site packages with devices, accessories, and documentation." },
      { title: "Forward logistics", desc: "Nationwide parcel, pallet, and LTL outbound with carrier tracking." },
      { title: "Chain of custody", desc: "Every movement logged — receipt to dispatch — with a full audit trail." },
    ],
    processTitle: "Built for deployment teams",
    processNote:
      "Deployment logistics differs from general warehousing in one key way: the output isn't a stored pallet, it's a working site. Every process we run — from how we label a switch to how we sequence a kit — is designed around the moment a technician opens the box.",
    audiences: [
      { title: "IT integrators", desc: "A warehouse extension purpose-built for project-based integration work." },
      { title: "VARs & resellers", desc: "Add staging and logistics to your deals without adding a warehouse." },
      { title: "Healthcare & education IT", desc: "Documented, tracked deployments that satisfy audit requirements." },
      { title: "Hospitality groups", desc: "Property-by-property technology deployments from one staging point." },
    ],
    faqs: [
      {
        q: "How is this different from a regular 3PL warehouse?",
        a: "3PLs store and ship boxes. We open them: configuring devices, capturing serials, applying asset tags, verifying QA, and kitting per site — then shipping finished deployment packages.",
      },
      {
        q: "Can you work from our existing asset management system?",
        a: "Yes. We can align our asset tags, labels, and serial/MAC capture format with your asset management or CMDB requirements.",
      },
      {
        q: "Do you provide installation services?",
        a: "Our operation covers everything up to the site: staging, kitting, and logistics. Installation is handled by your field teams arriving to ready kits.",
      },
    ],
  },
];
// ── Chunk 2: POS, network kitting, kitting services, multi-site rollouts ──
SERVICE_PAGES.push(
  {
    slug: "pos-deployment-staging",
    title: "POS Deployment Staging Services | Layer One Staging",
    h1: "POS Deployment Staging",
    metaDescription:
      "POS deployment staging for retail and restaurant rollouts: terminals, printers, and peripherals imaged, labeled, kitted per store, and shipped ready to install.",
    intro: [
      "Point-of-sale rollouts are unforgiving. Every lane, register, and back-office station has to work on day one — and the configuration, peripherals, and cabling behind each one are exactly the details that derail openings. Layer One Staging stages complete POS deployments so each location receives finished, tested register kits instead of a pile of components.",
      "We receive terminals, receipt printers, cash drawers, PIN pads, scanners, and displays from your vendors; image or configure them to your standard; label each unit to its lane or station; and kit everything per store with a lane-by-lane packing list. Your install team unboxes and connects — no bench work on site.",
    ],
    included: [
      { title: "Terminal imaging & config", desc: "OS images, POS software baselines, and network settings applied per your standard." },
      { title: "Peripheral pairing", desc: "Printers, drawers, PIN pads, and scanners matched and tested with their terminal." },
      { title: "Lane/station labeling", desc: "Every unit labeled to its lane, register, or back-office station." },
      { title: "Burn-in QA", desc: "Terminals powered on and smoke-tested so failures surface in staging, not on opening day." },
      { title: "Store-level kitting", desc: "Complete per-store kits sequenced by lane with install-order documentation." },
      { title: "Staged rollout shipping", desc: "Kits dispatched on your opening schedule — new stores, remodels, or refreshes." },
    ],
    processTitle: "Staging for store openings",
    processNote:
      "POS projects live on the store-opening calendar. We stage against it: store kits built in opening order, peripherals imaged identically across locations, and spares staged alongside so a failed terminal doesn't delay a launch.",
    audiences: [
      { title: "Retail chains", desc: "Identical register setups across every location, staged from one operation." },
      { title: "Restaurant groups", desc: "Front-of-house and kitchen display systems kitted per store layout." },
      { title: "POS VARs", desc: "Offer staging and logistics without building your own bench." },
      { title: "Franchise systems", desc: "Franchisees receive complete, tested kits — no local IT expertise required." },
    ],
    faqs: [
      {
        q: "Can you image terminals with our software build?",
        a: "Yes. Provide your image or configuration standard and we'll apply it to every terminal, then verify before kitting.",
      },
      {
        q: "Do you handle payment terminals and PIN pads?",
        a: "We stage and kit payment peripherals with their terminals. Note that key injection and PCI-scoped activities remain with your payment processor or certified provider.",
      },
      {
        q: "What about cash drawers and mounting hardware?",
        a: "All peripherals and accessories are received, matched to their station, and packed into the same store kit — nothing ships loose or separately.",
      },
    ],
  },
  {
    slug: "network-deployment-kitting",
    title: "Network Deployment Kitting Services | Layer One Staging",
    h1: "Network Deployment Kitting",
    metaDescription:
      "Network deployment kitting: per-site kits with configured switches, routers, APs, cables, and install docs — everything the tech needs in one box.",
    intro: [
      "The difference between a smooth network deployment and a chaotic one is usually decided before anyone leaves for the site. Layer One Staging builds network deployment kits — complete, site-specific packages where every device is configured, every cable is included, and every label tells the technician exactly where it goes.",
      "A typical kit: the site's switches and router pre-configured, access points labeled by mounting location, patch cables cut to the right lengths, console cable and USB drive included, and a one-page install sheet tying it all together. The tech opens the kit and starts racking — not hunting for missing parts.",
    ],
    included: [
      { title: "Per-site bill of materials", desc: "Kits built from your per-site BOM — verified complete before packing." },
      { title: "Pre-configured devices", desc: "Switches, routers, and APs loaded with site-specific configs." },
      { title: "Location labeling", desc: "APs and switches labeled by room, rack, or mounting position." },
      { title: "Cabling & accessories", desc: "Patch cables, console cables, power cords, and mounting kits included." },
      { title: "Install documentation", desc: "A concise per-kit install sheet: what's in the box and where it goes." },
      { title: "Spares management", desc: "Cold spares staged and tracked alongside production kits." },
    ],
    processTitle: "Kits built for the field",
    processNote:
      "We kit from the technician's point of view: heavy items on the bottom, devices in install order, labels facing out, and the install sheet on top. Multi-phase projects get kits sequenced by phase so wave one ships before wave two is even staged.",
    audiences: [
      { title: "MSPs", desc: "Send techs to site with everything they need — no return trips for forgotten gear." },
      { title: "National integrators", desc: "Consistent kits across every market, built from your standard BOM." },
      { title: "Wi-Fi upgrade teams", desc: "APs labeled by floor plan location for fast, error-free installs." },
      { title: "SD-WAN deployments", desc: "Edge kits with site configs pre-loaded for rapid branch turn-up." },
    ],
    faqs: [
      {
        q: "What goes into a typical network kit?",
        a: "Configured devices, location-labeled APs, patch cables, console cable, power cords, rack hardware, and a per-site install sheet — everything for that location in one shipment.",
      },
      {
        q: "Can kits vary by site?",
        a: "Yes. Kits are built per-site from your BOMs, so a 5-AP branch and a 40-AP campus each get exactly their equipment.",
      },
      {
        q: "How do you handle mid-project BOM changes?",
        a: "Because staging is centralized, we can update unshipped kits immediately and flag shipped ones for field add-ons — with the change documented.",
      },
    ],
  },
  {
    slug: "it-equipment-kitting-services",
    title: "IT Equipment Kitting Services | Layer One Staging",
    h1: "IT Equipment Kitting Services",
    metaDescription:
      "IT equipment kitting services: site-specific kits assembled, labeled, QA-checked, and shipped — laptops, peripherals, network gear, and accessories per location.",
    intro: [
      "Kitting is where multi-device projects become manageable: instead of shipping loose components and hoping the field sorts it out, everything for a site — or a user, or a workstation — arrives as one verified package. Layer One Staging builds IT equipment kits to your exact specification, from simple laptop-plus-peripherals bundles to complex multi-pallet site deployments.",
      "Every kit is assembled against a defined bill of materials, QA-checked for completeness, labeled, and documented with a packing list. Whether you're equipping new hires, refreshing offices, or deploying technology across hundreds of locations, kitting turns 'a shipment of stuff' into 'a deployment.'",
    ],
    included: [
      { title: "BOM-driven assembly", desc: "Kits built from your bill of materials — every item verified before the box closes." },
      { title: "Device configuration", desc: "Imaging, enrollment, and baseline config applied before kitting." },
      { title: "Asset tagging", desc: "Tags applied per device and recorded against the kit and site." },
      { title: "Completeness QA", desc: "A second verification pass: the kit matches the BOM, every time." },
      { title: "Packing lists", desc: "Per-kit documentation listing every item, serial, and tag." },
      { title: "Flexible kit types", desc: "User kits, workstation bundles, site kits, or phased rollout kits." },
    ],
    processTitle: "Kitting, verified twice",
    processNote:
      "Kitting errors are deployment errors — a missing power supply stalls an install just as surely as a missing switch. Our process verifies each kit against the BOM at assembly and again at pack-out, so the field gets what the plan promised.",
    audiences: [
      { title: "HR & IT onboarding teams", desc: "New-hire kits: laptop, peripherals, and accessories in one box." },
      { title: "Office refresh projects", desc: "Per-workstation bundles staged and shipped floor by floor." },
      { title: "Multi-site rollouts", desc: "Identical site kits across every location from one BOM." },
      { title: "VARs & MSPs", desc: "White-label kitting capacity without the warehouse overhead." },
    ],
    faqs: [
      {
        q: "What's the difference between kitting and staging?",
        a: "Staging is preparing the equipment (configuring, tagging, QA). Kitting is assembling the prepared equipment into defined packages per site, user, or workstation. We do both — staging feeds kitting.",
      },
      {
        q: "Can you kit from equipment we ship directly to you?",
        a: "Yes. Have your vendors ship to our dock and we'll receive, inventory, stage, and kit it all in one flow.",
      },
      {
        q: "Do you support ongoing kitting, not just projects?",
        a: "Yes — we support recurring programs like new-hire onboarding kits on a steady cadence, not only one-time rollouts.",
      },
    ],
  },
  {
    slug: "multi-site-technology-rollouts",
    title: "Multi-Site Technology Rollouts | Layer One Staging",
    h1: "Multi-Site Technology Rollouts",
    metaDescription:
      "Staging and logistics for multi-site technology rollouts: one central operation receives, configures, kits, and ships deployment-ready equipment to every location.",
    intro: [
      "Deploying technology across dozens, hundreds, or thousands of locations is an exercise in repeatability. The tenth site should look exactly like the first — same configuration, same labeling, same complete kit, same documentation. Layer One Staging is the operational layer that makes that repeatability possible.",
      "We centralize the physical work: all equipment flows through our staging operation, where it's configured to your standard, tagged, QA-verified, and packed into site-specific kits. Then kits ship on your schedule — phased by region, wave, or opening date — with every site tracked in one portal.",
    ],
    included: [
      { title: "Standardized staging", desc: "One configuration standard applied identically across every site." },
      { title: "Site-level tracking", desc: "Every location's kit, shipment, and status visible in one portal." },
      { title: "Phased dispatch", desc: "Kits sequenced and shipped by wave, region, or go-live date." },
      { title: "Spares pools", desc: "Hot spares staged centrally and dispatched when a site reports a failure." },
      { title: "Exception management", desc: "Shortages and DOA units caught in staging — before they reach the field." },
      { title: "Rollout documentation", desc: "Per-site packing lists, serial records, and QA sign-offs for the whole project." },
    ],
    processTitle: "One operation, every site",
    processNote:
      "Multi-site rollouts succeed on consistency and visibility. Consistency comes from staging every site to the same standard in one place; visibility comes from a portal where you can see each site's status — staged, shipped, delivered — without chasing spreadsheets.",
    audiences: [
      { title: "Retail rollouts", desc: "New stores, remodels, and refreshes with identical per-store kits." },
      { title: "Restaurant & franchise", desc: "Location-by-location deployments on the opening schedule." },
      { title: "Branch modernization", desc: "Bank, clinic, and office branches refreshed in coordinated waves." },
      { title: "Network refreshes", desc: "Enterprise-wide switch, Wi-Fi, and SD-WAN replacements, site by site." },
    ],
    faqs: [
      {
        q: "How do you keep hundreds of site kits consistent?",
        a: "Every kit is built from a controlled BOM, staged to the same configuration standard, and QA-verified twice — at assembly and at pack-out.",
      },
      {
        q: "Can you handle phased rollouts over several months?",
        a: "Yes. Staged inventory can be held securely and released in waves on your schedule, with extended storage at published rates.",
      },
      {
        q: "What does project pricing look like for large rollouts?",
        a: "Every rollout is quoted as a project based on sites, devices, services, storage, and schedule — with volume pricing that brings per-site costs down as scale grows.",
      },
    ],
  },
);

// ── Chunk 3: asset tagging, device config, retail, restaurant/franchise ──
SERVICE_PAGES.push(
  {
    slug: "it-asset-tagging-inventory",
    title: "IT Asset Tagging & Inventory Services | Layer One Staging",
    h1: "IT Asset Tagging & Inventory",
    metaDescription:
      "IT asset tagging and inventory services: barcode/QR asset tags, serial and MAC capture, photo documentation, and portal inventory for every device.",
    intro: [
      "You can't manage what you can't identify. Layer One Staging provides professional IT asset tagging and inventory services as part of every staging project — every device that moves through our operation gets tagged, recorded, and photographed, building the asset record your finance and IT teams need from day one.",
      "We apply durable barcode or QR asset tags to your specification, capture model, serial number, and MAC address per device, and log everything into your portal inventory with photos. The result is a deployment where every asset is identifiable, every serial is recorded, and nothing arrives as a mystery box.",
    ],
    included: [
      { title: "Asset tag application", desc: "Durable barcode/QR tags applied to your numbering scheme or ours." },
      { title: "Serial number capture", desc: "Model and serial recorded per device — no spreadsheets built by hand." },
      { title: "MAC address capture", desc: "Wired and wireless MACs recorded for network gear and endpoints." },
      { title: "Photo documentation", desc: "Per-device and per-kit photos stored against the asset record." },
      { title: "Portal inventory", desc: "A live, searchable inventory: every device, tag, serial, and location." },
      { title: "Audit-ready exports", desc: "Asset data exportable for your CMDB, finance, or compliance reviews." },
    ],
    processTitle: "Tagging as a system",
    processNote:
      "Asset tagging works best when it's part of staging, not an afterthought. Tags go on during configuration — while the device is already on the bench — and the serial/MAC capture happens in the same pass, so the asset record is complete before the device is ever packed.",
    audiences: [
      { title: "IT asset managers", desc: "Start the asset lifecycle with complete, accurate records." },
      { title: "Finance teams", desc: "Capital asset documentation captured at deployment, not reconstructed later." },
      { title: "Compliance-driven orgs", desc: "Chain-of-custody records from receiving through installation." },
      { title: "MSPs", desc: "Deliver clients a finished asset register with every deployment." },
    ],
    faqs: [
      {
        q: "Can you use our existing asset tag numbering?",
        a: "Yes. Provide your tag sequence or tag stock and we'll apply and record them; otherwise we'll generate a scheme for the project.",
      },
      {
        q: "What asset data do you capture?",
        a: "Asset tag ID, device model, serial number, MAC addresses, photos, and the site/kit assignment — all visible in your portal.",
      },
      {
        q: "Do you offer asset tagging as a standalone service?",
        a: "Tagging and inventory are built into our staging workflow, and we can also run tagging-only projects for equipment you already own.",
      },
    ],
  },
  {
    slug: "device-configuration-firmware-staging",
    title: "Device Configuration & Firmware Staging | Layer One Staging",
    h1: "Device Configuration & Firmware Staging",
    metaDescription:
      "Device configuration and firmware staging: baselines, firmware updates, enrollment, and QA verification applied before equipment ships to the field.",
    intro: [
      "Field technicians are expensive; bench time in staging is cheap. Layer One Staging moves device configuration out of the field and into our staging operation — firmware updates, baseline configurations, device enrollment, and verification all happen before equipment ships, so installation is the only thing left to do on site.",
      "We configure to your specification: network baselines and firmware for infrastructure gear, OS images and MDM enrollment for endpoints, and application baselines for POS and kiosk devices. Every configured device passes a QA check and ships with documentation of what was applied.",
    ],
    included: [
      { title: "Firmware standardization", desc: "All devices brought to your approved firmware or OS revision." },
      { title: "Baseline configuration", desc: "Network, security, and management baselines applied per your template." },
      { title: "MDM enrollment", desc: "Endpoints enrolled in your device management platform before they ship." },
      { title: "Application baselines", desc: "Standard software loads for POS, kiosk, and workstation devices." },
      { title: "Configuration QA", desc: "Every device verified against the standard — config drift caught in staging." },
      { title: "Config documentation", desc: "A record of firmware version and configuration applied, per device." },
    ],
    processTitle: "Configure once, deploy everywhere",
    processNote:
      "Configuration is where standardization pays off: one approved baseline, applied identically to every device in staging, verified by QA, and documented. The field team never touches a console cable — they rack, connect, and confirm.",
    audiences: [
      { title: "Network teams", desc: "Switches, routers, and APs arrive with configs loaded and verified." },
      { title: "Endpoint fleets", desc: "Laptops and tablets imaged, enrolled, and ready for users." },
      { title: "POS & kiosk projects", desc: "Application baselines tested in staging, not debugged on opening day." },
      { title: "Security-conscious orgs", desc: "Hardened baselines applied uniformly before devices touch your network." },
    ],
    faqs: [
      {
        q: "What do you need from us to configure devices?",
        a: "Your firmware targets, configuration templates or baselines, and any enrollment credentials or profiles — we'll handle the rest and document what was applied.",
      },
      {
        q: "Can you stage configurations that vary by site?",
        a: "Yes. Site-specific variables (hostnames, IPs, SSIDs) are applied per device from your site matrix while the common baseline stays identical.",
      },
      {
        q: "How do you verify configurations?",
        a: "Every device is powered on and checked against the standard — firmware version, config load, and enrollment status — with failures flagged before packing.",
      },
    ],
  },
  {
    slug: "retail-technology-deployment",
    title: "Retail Technology Deployment Services | Layer One Staging",
    h1: "Retail Technology Deployment",
    metaDescription:
      "Retail technology deployment staging: POS, network, and back-office systems staged, kitted per store, and shipped on the opening or refresh schedule.",
    intro: [
      "Retail technology deployments run on the store calendar — openings, remodels, and refreshes don't wait for IT. Layer One Staging gives retail IT teams and their integrators a staging operation built for that pace: complete per-store technology kits, configured and tested, shipped on the construction schedule.",
      "We stage the full store stack: POS terminals and peripherals, network switches and access points, back-office PCs, digital signage players, and kiosks. Each store gets an identical kit with lane-by-lane documentation, so the install crew works the same way at store one and store one hundred.",
    ],
    included: [
      { title: "Full store-stack staging", desc: "POS, network, back-office, signage, and kiosk gear staged together." },
      { title: "Per-store kitting", desc: "Identical kits per location with lane and station documentation." },
      { title: "Schedule-driven dispatch", desc: "Kits shipped against opening, remodel, and refresh dates." },
      { title: "Imaging & configuration", desc: "Terminals imaged, network gear configured to the store standard." },
      { title: "Burn-in QA", desc: "Terminals and displays powered on and tested before they ship." },
      { title: "Spares programs", desc: "Replacement units staged for rapid dispatch to open stores." },
    ],
    processTitle: "Staging on the store calendar",
    processNote:
      "Retail projects compress at the end — fixtures slip, then IT gets three days instead of three weeks. Centralized staging absorbs that compression: kits are built ahead, held securely, and released the moment the site is ready.",
    audiences: [
      { title: "Retail chains", desc: "New stores, remodels, and refreshes from one staging operation." },
      { title: "Store fixture contractors", desc: "A technology partner that delivers kits on the construction schedule." },
      { title: "POS integrators", desc: "Staging and logistics capacity without building a warehouse." },
      { title: "Franchise retailers", desc: "Identical store technology for every franchisee, ready to install." },
    ],
    faqs: [
      {
        q: "Can you stage for both new stores and remodels?",
        a: "Yes. New-store kits ship complete; remodel kits can be phased — for example, network first, POS at cutover — on your schedule.",
      },
      {
        q: "How do you handle different store formats?",
        a: "Kits are built per store format from your BOMs — a flagship and a small-format store each get exactly their equipment.",
      },
      {
        q: "What if a store opening slips?",
        a: "Finished kits are held in secure storage and re-sequenced to the revised date; extended storage is available at published rates.",
      },
    ],
  },
  {
    slug: "restaurant-franchise-technology-rollouts",
    title: "Restaurant & Franchise Technology Rollouts | Layer One Staging",
    h1: "Restaurant & Franchise Technology Rollouts",
    metaDescription:
      "Staging and kitting for restaurant and franchise technology rollouts: POS, KDS, network, and back-office kits per location, shipped on the opening schedule.",
    intro: [
      "Restaurant and franchise rollouts have a brutal constraint: the opening date doesn't move, and the technology has to work on day one. Layer One Staging stages restaurant technology so each location receives a complete, tested kit — POS terminals, kitchen displays, network gear, and back-office systems — ready for the install crew.",
      "Franchise systems add another layer: every location must match the brand standard, but franchisees aren't IT departments. Our per-location kits arrive configured, labeled, and documented so consistently that the fiftieth restaurant opens exactly like the first.",
    ],
    included: [
      { title: "Front-of-house staging", desc: "POS terminals, PIN pads, printers, and scanners imaged and tested." },
      { title: "Kitchen systems", desc: "Kitchen display systems and bump screens configured per location." },
      { title: "Restaurant network kits", desc: "Switches, APs, and firewall staged with the location's config." },
      { title: "Back-office bundles", desc: "Office PCs, safe drops, and manager workstation equipment kitted together." },
      { title: "Brand-standard consistency", desc: "One configuration standard enforced across every franchise location." },
      { title: "Opening-schedule dispatch", desc: "Kits shipped to hit the construction and opening timeline." },
    ],
    processTitle: "Built for opening day",
    processNote:
      "Restaurant openings compress everything into the final two weeks. We stage ahead of that crunch — kits built, tested, and held — then dispatch on the construction schedule so technology is never the reason an opening slips.",
    audiences: [
      { title: "Franchise systems", desc: "Brand-standard technology kits for every new and remodeled location." },
      { title: "Restaurant groups", desc: "Multi-concept operators with one staging partner for all brands." },
      { title: "Hospitality integrators", desc: "Staging capacity that scales with your project pipeline." },
      { title: "QSR rollouts", desc: "High-volume, identical-location deployments run as a production line." },
    ],
    faqs: [
      {
        q: "Can you support both corporate and franchise locations?",
        a: "Yes. Corporate sites and franchisee sites receive the same brand-standard kits; billing and shipping can be split per your requirements.",
      },
      {
        q: "Do you stage drive-thru and outdoor equipment?",
        a: "Yes — drive-thru timers, outdoor displays, and associated network gear are staged and kitted with the location's package.",
      },
      {
        q: "How fast can you turn around a new location kit?",
        a: "Standard kits are built to your BOM on a scheduled cadence; rush timelines are quoted per project based on equipment availability and scope.",
      },
    ],
  },
);

export function getServicePage(slug: string): ServicePageData | undefined {
  return SERVICE_PAGES.find((p) => p.slug === slug);
}
