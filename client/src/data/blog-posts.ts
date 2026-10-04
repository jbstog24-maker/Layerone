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
];
