// Blog post data for the Layer One Staging blog.
// New posts can be appended to BLOG_POSTS by the daily blog cron.
// Each post: slug (URL-safe, unique), title, date (YYYY-MM-DD), excerpt,
// category, readTime (minutes), content (array of paragraph strings).
// Lines starting with "## " render as subheadings.
// Voice: warm, direct, down-to-earth, problem-first. NO em dashes, ever.
// Never invent customers, statistics, addresses, or performance claims.

export interface BlogPost {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  category: string;
  readTime: number;
  content: string[];
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "why-your-techs-should-never-unbox-another-switch",
    title: "Why Your Techs Should Never Unbox Another Switch",
    date: "2026-10-05",
    excerpt: "Every hour a field tech spends breaking down cardboard is an hour they are not billing. Here is the math on unboxing and what to do about it.",
    category: "MSP Operations",
    readTime: 4,
    content: [
      "Walk onto almost any MSP job site on a deployment day and you will see the same thing: a senior tech, the one you bill out at your highest rate, kneeling on the floor with a box cutter. There are forty switches to unbox, foam to bag up, and cardboard to haul to the dumpster. None of that is billable work, and all of it has to happen before the real job starts.",
      "## The unboxing tax is real",
      "Think about what actually happens when gear ships direct to a site. Somebody has to receive it, and that somebody is usually whoever happens to be standing nearby. Boxes get opened in hallways. Serial numbers never get recorded because nobody brought a scanner. The packing material piles up in a corner of the server room where it sits for three weeks. Then the tech starts the actual work, already behind schedule, in a room full of trash.",
      "Multiply that across a multi-site rollout and the waste gets serious. Ten locations, a few dozen devices each, and you have burned days of skilled labor on work a warehouse crew could have done for a fraction of the cost. Your techs did not get into this business to break down boxes.",
      "## What staging changes",
      "When equipment goes through a staging process first, the tech shows up to a clean job. Devices arrive unboxed, firmware checked, labeled, and kitted by site. Serial numbers and MAC addresses are already captured and documented. The packing material never leaves the warehouse. The tech walks in, racks the gear, and starts doing the work you actually hired them for.",
      "This is not about luxury. It is about putting your most expensive people on your most valuable work. Unboxing, labeling, and basic prep are real work, but they do not require a senior engineer. They require a process, a bench, and somebody whose whole job is getting gear deployment-ready.",
      "## How to start",
      "You do not need to overhaul your operation to fix this. Start with your next rollout: instead of shipping everything direct to site, route it through a staging step first. Even a basic receive, unbox, label, and kit-by-site workflow will save your techs hours per location. Once you see the difference on one project, it becomes hard to go back.",
      "Your techs will thank you. Your clients will notice the difference in how clean the deployment goes. And your margins will reflect the hours you stopped giving away to cardboard.",
    ],
  },
  {
    slug: "the-real-cost-of-shipping-gear-direct-to-site",
    title: "The Real Cost of Shipping Gear Direct to Site",
    date: "2026-10-06",
    excerpt: "Boxes arriving at a location with no IT staff is where rollouts go sideways. Here is what direct-to-site shipping actually costs you.",
    category: "Rollout Logistics",
    readTime: 4,
    content: [
      "It seems like the simple option. Order the gear, have the vendor ship it straight to each location, send the tech out when it all arrives. No middleman, no extra handling, no extra cost. Except the cost shows up anyway, just in places that are harder to see on a spreadsheet.",
      "## Nobody owns the receiving",
      "When a pallet of switches shows up at a retail store or a branch office, who signs for it? Usually the store manager, who has a business to run and no reason to inspect network hardware. The pallet sits in the back room. Sometimes it sits there for a week. Sometimes a box goes missing and nobody notices until install day, because nobody did an inventory when it arrived.",
      "Then the tech arrives and discovers the problem. Wrong quantities. A damaged box. Gear for a different site mixed in with this one. The install stalls while somebody scrambles to figure out what is missing and where it went. The client is watching, the schedule is slipping, and your tech is doing detective work instead of deployment work.",
      "## The site is not a warehouse",
      "Branch locations are not set up to store, secure, or organize IT equipment. There is no locked cage, no inventory system, no climate consideration. Expensive gear sits in unlocked back rooms next to the mop bucket. In our experience, this is also where equipment damage happens: boxes get moved by people who do not know what is inside, stacked under things they should not be stacked under, or left where foot traffic can reach them.",
      "Every one of these problems is preventable, and none of them are the site staff's fault. They were never supposed to be running a receiving dock.",
      "## The alternative",
      "Route shipments through a staging facility first. Everything gets received by people who do this for a living: inspected, inventoried, photographed, and documented. Gear gets kitted by site so each location receives exactly what it needs, labeled and ready. The tech arrives to a clean, verified kit instead of a mystery pile.",
      "Direct-to-site shipping looks cheaper until you count the stalled installs, the missing gear, the damaged boxes, and the tech hours burned sorting it out. A staging step in the middle is not an extra cost. It is the thing that keeps the rest of the project on budget.",
    ],
  },
  {
    slug: "what-good-asset-tagging-actually-looks-like",
    title: "What Good Asset Tagging Actually Looks Like",
    date: "2026-10-07",
    excerpt: "Serial numbers on a spreadsheet six months later is not asset tracking. Here is what a real chain of custody looks like, from dock to deployment.",
    category: "Asset Management",
    readTime: 4,
    content: [
      "Ask most IT teams where a specific switch is right now and you will get a pause. Somebody thinks it went to the Plano site. Somebody else remembers it was supposed to go to Plano but got rerouted. The spreadsheet says it was received, but nobody recorded which location it shipped to. This is normal, and it is a problem.",
      "## Tracking starts at receiving, not at install",
      "Good asset tagging begins the moment equipment arrives at the dock. Every device gets its serial number and MAC address captured before it goes on a shelf. That capture gets tied to the purchase order, the shipment, and the project it belongs to. From that point forward, the device has a record, and that record follows it everywhere it goes.",
      "Most teams skip this step because it feels like overhead. It is the opposite. The ten minutes spent capturing serials at receiving saves hours of hunting later, when a client asks for an asset report or a warranty claim needs a serial number nobody wrote down.",
      "## Chain of custody means proof",
      "Chain of custody is a simple idea: at every handoff, somebody records what moved, where it went, and when. Received at the dock, moved to storage, pulled for staging, kitted for a site, shipped out, delivered. Each step gets logged with a timestamp. If a device goes missing, you know exactly where the trail stops.",
      "Photo documentation belongs in this process too. A photo of the equipment condition at receiving protects you if a damage claim comes up later. A photo of the finished kit before it ships proves what left the building. These take seconds and settle arguments that would otherwise take days.",
      "## What to capture",
      "At minimum, every device should have: serial number, MAC address, model, the project and site it is assigned to, and a timestamped record of each handoff. That is the baseline. Anything less and you are guessing.",
      "Asset tagging is not glamorous work, but it is the difference between an operation that can answer questions and one that cannot. When a client asks for a full asset report, or an auditor shows up, or a warranty claim needs documentation, the teams with a real chain of custody pull it up in minutes. Everyone else starts digging through emails.",
    ],
  },
  {
    slug: "qa-before-ship-catching-doa-gear-before-it-leaves",
    title: "QA Before Ship: Catching DOA Gear Before It Leaves the Warehouse",
    date: "2026-10-05",
    excerpt: "Dead gear discovered on install day turns a scheduled deployment into an expensive troubleshooting trip. A bench check before shipping catches it when fixing it is still cheap.",
    category: "Staging Best Practices",
    readTime: 4,
    content: [
      "Every field tech has lived this one. You drive out to the site, sometimes an hour or more, rack the switch, plug it in, and nothing happens. No power light, no fan, dead. You try the second one in the box. Also dead. Now you are standing in a client's server room holding equipment that never should have left the warehouse, and the whole day's plan just changed.",
      "That tech is now doing RMA work instead of deployment work. Somebody has to document the failure, open a support case, arrange a replacement, and reschedule the install. The client, who was told this was a routine upgrade, watches the schedule slip over hardware that was broken before the tech ever touched it. Trust takes a hit, and the second trip eats whatever margin was left in the project.",
      "## Dead gear is a receiving problem, not a field problem",
      "Hardware fails out of the box. It happens with every vendor: power supplies that never wake up, boards that boot-loop, units that took a hit in transit. The failure rate is small, but on a 50-site rollout, small percentages become real numbers. If gear ships direct to site with no bench check in between, that DOA device is guaranteed to be discovered at the worst possible moment, in front of the client, with a tech who has no spare on the shelf.",
      "A warehouse bench catches this before it matters. Every device gets powered on, confirmed to boot, checked for obvious faults, and given a basic configuration sanity pass before it goes into a site kit. A unit that fails at the bench never leaves the building. The RMA starts from a warehouse with a returns process, not from a job site with a waiting client.",
      "## What a bench check actually covers",
      "This is not a full burn-in lab, and it does not need to be. Power on and confirm the device boots cleanly. Check that all ports respond. Verify the firmware version matches what the project requires, and flag anything outdated before it goes out. Do a visual pass for shipping damage: bent ears, cracked bezels, loose components. Capture the serial numbers and MAC addresses while the device is on the bench, so the asset record is built at the same time.",
      "Twenty minutes on a bench versus half a day lost on site. That is the real trade. The bench check costs almost nothing when it is part of a staging workflow, and it turns install day into what it is supposed to be: a tech walking in with verified gear and walking out with a completed job.",
      "The habit is simple. Nothing ships to a site without a power-on check first. Make that the rule and DOA gear becomes a warehouse inconvenience instead of a client-facing problem.",
    ],
  },
  {
    slug: "what-happens-when-freight-shows-up-with-nowhere-to-go",
    title: "What Happens When Freight Shows Up With Nowhere to Go",
    date: "2026-10-06",
    excerpt: "A pallet of networking gear is on the way, the site cannot take it, and the carrier will not wait. Here is how to keep early freight from wrecking your rollout.",
    category: "Staging Best Practices",
    readTime: 4,
    content: [
      "Every rollout has a moment where the timing breaks. The vendor ships early because they want to close the quarter, or a site gets pushed back a week and nobody told the carrier. Now there is a pallet of switches and access points rolling toward a location that has no dock, no storage room, and a store manager who did not agree to become a warehouse. The driver calls the number on the bill of lading, and your tech is suddenly negotiating freight instead of installing gear.",
      "This is one of the most common ways a deployment schedule falls apart, and it has nothing to do with the quality of the equipment or the skill of the tech. It is a receiving problem. The freight showed up before the site was ready, and there was nowhere for it to go.",
      "## The scramble is where the damage happens",
      "When freight arrives with nowhere to land, everything that follows is improvisation. The pallet gets stashed in a hallway, a back room, or the bed of someone's truck. Boxes get opened to check quantities because nobody did an intake when they arrived. Somebody signs for it without looking because the driver is in a hurry. By the time the tech actually gets to the install, nobody is sure everything is there, nothing got broken, or whose gear is whose.",
      "This is also where equipment goes missing. A box gets set aside during the scramble and forgotten. Two sites' shipments get mixed together because they arrived on the same truck. Expensive gear sits unsecured in a location with foot traffic and no one responsible for it. You do not need a story about theft to justify better receiving. Loss by confusion is expensive enough.",
      "## A receiving dock changes the whole equation",
      "The fix is not better timing. Timing will always break on a real project. The fix is a place where freight can land whenever it arrives, handled by people whose job is receiving. A pallet shows up early, it gets accepted, inspected, and put into secure storage. The serial numbers get captured, the condition gets photographed, and it waits for the site to be ready. The project manager gets a notification, not a panic call.",
      "This works for change orders too. When a site needs three more access points added late in the project, the gear lands at the dock, gets added to the site kit, and ships out with the rest. No emergency runs, no tech waiting on a FedEx truck.",
      "The cost of receiving early freight properly is a fraction of what a scrambled delivery costs you. A missed delivery fee, a lost box, a stalled install day with a client watching: each one is worth more than the warehouse space would have been. Plan for freight to arrive at the wrong time, because it will. The projects that survive are the ones where wrong timing is a notification instead of a crisis.",
    ],
  },
  {
    slug: "kitting-by-site-why-one-box-per-location-matters",
    title: "Kitting by Site: Why One Box per Location Matters",
    date: "2026-10-07",
    excerpt: "When a rollout's gear arrives as one mixed batch, the tech spends install day sorting instead of installing. Here is why kitting by site, one labeled box per location, keeps projects on schedule.",
    category: "Deployment Tips",
    readTime: 4,
    content: [
      "Here is a scene every deployment tech knows. They walk into a site with a spreadsheet that says this location gets six switches, twelve access points, and a firewall. The gear is stacked in a hallway in the vendor's boxes, part numbers on the labels, nothing saying which site any of it belongs to, because the whole project shipped in one mixed batch. So before any installing happens, the tech becomes a sort operator: opening boxes, checking part numbers against the spreadsheet, piling devices into 'this site' and 'not this site' stacks while the client's employees step around the mess. The clock is running, and none of this is the work the client is paying for.",
      "## The mixed-batch trap",
      "Shipping a rollout's gear in bulk looks efficient on paper. Fewer shipments, one delivery, everything in one place. But the place it lands is never set up for sorting, and the person doing the sorting is your most expensive person on the project. Warehouse work done in a client hallway is slow and sloppy. Part numbers get misread. A box meant for one site ends up in another site's pile. The worst version is the one nobody catches on install day: the wrong device goes up at the wrong location, and it surfaces weeks later when the inventory numbers do not add up. Now you are scheduling a return trip to fix a mistake that was made standing in a hallway with a box cutter.",
      "## What a real site kit looks like",
      "A site kit moves the sorting to where it belongs. Everything for one location goes into its own box or set of boxes. Each box is labeled with the site name and carries a contents list on the outside. Inside, devices are tagged by where they go: the access point for the break room is labeled for the break room. Serial numbers and MAC addresses were captured when the kit was built, not at the job site. The tech opens the box, checks the contents against the list, and starts installing. No sorting, no cross-referencing part numbers against a spreadsheet, no guessing.",
      "You do not need a big operation to do this. You need one rule: nothing ships to a site as part of a mixed batch. Sort once, on a bench, where a misread label costs a minute instead of a return trip. On a multi-site rollout, the hours you get back at every location add up fast, and the installs stop starting with a sorting session in front of the client. One box, one site, labeled on the outside. That is the whole discipline, and it is the difference between an install day and a sorting day.",
    ],
  },
  {
    slug: "receiving-done-right-what-good-intake-looks-like",
    title: "Receiving Done Right: What Good Intake Looks Like",
    date: "2026-10-08",
    excerpt: "Most rollout problems start at the loading dock, long before install day. Here is what a real intake process looks like, and why skipping it costs you later.",
    category: "Staging Best Practices",
    readTime: 4,
    content: [
      "Here is how most IT equipment gets received on a project: somebody signs for a pallet, the driver leaves, and the boxes sit wherever they landed until install day. Nobody counted them. Nobody checked what was inside. Nobody wrote anything down. If a box is missing or damaged, nobody finds out until the tech is standing at the site with an incomplete kit. By then, fixing it is an emergency instead of a phone call.",
      "Intake is the least glamorous part of a deployment, which is exactly why it gets skipped. But every problem that shows up later, missing gear, wrong quantities, damage discovered on install day, unlogged serial numbers, started life as an intake that did not happen. The dock is where you find out what you actually got, and it is the only place where finding a problem is cheap.",
      "## What good intake actually covers",
      "Good intake starts before the truck arrives. You know what is coming: which purchase order, how many boxes, what is supposed to be inside them. When the shipment lands, you count first. Boxes on the bill of lading versus boxes on the dock. Anything short gets noted right there, while the driver is still present, which is when shortage claims are easy and undisputed.",
      "Then the boxes get opened, and each item gets checked against the order. Right model, right quantity, right revision. Condition gets inspected too: crushed corners, punctured boxes, anything that took a hit in transit. A damaged box gets photographed before it is opened, because that photo is what makes a freight claim real. Serial numbers and MAC addresses get captured for every device, right then, while the box is open and the label is in front of you. Waiting until later means doing it twice, or not at all.",
      "Finally, everything gets put where it belongs. Received gear goes into secure, organized storage with the project and site assignments attached. Nothing sits in a hallway. Nothing gets stacked behind something else and forgotten. The intake is logged: what arrived, when, what condition, who handled it. That record is the first link in the chain of custody, and everything downstream depends on it.",
      "## Why most teams skip it",
      "Intake feels like overhead when the real work is waiting. The tech has installs scheduled, the project manager wants boxes moving, and standing around counting serial numbers does not look like progress. So the boxes get signed for and shoved aside, and the intake happens 'later,' which is to say it never happens.",
      "What those teams do not see is the cost of the skip. A missing device found on install day means an emergency reorder, a second trip, and a client asking why the schedule slipped. A damaged unit discovered at the rack means an RMA that should have started two weeks ago. Serial numbers captured wrong or never mean the asset report gets built from memory months later, which is how you end up with ghost devices and audit problems. Every one of these costs more than the intake would have.",
      "The discipline is simple. Nothing gets signed for blind, nothing goes into storage uncounted, and nothing leaves the dock without its serial numbers captured and logged. Do intake right and the rest of the project gets quieter: fewer surprises, fewer emergency orders, fewer second trips. The loading dock is not a detour from the real work. It is where the real work starts.",
    ],
  },
];
