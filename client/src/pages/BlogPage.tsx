import { useState } from "react";
import { Calendar, Clock, ArrowRight, Tag } from "lucide-react";
import { NavBar, Footer } from "./Landing";
import { BLOG_POSTS } from "../data/blog-posts";

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[m - 1]} ${d}, ${y}`;
}

function BlogContent() {
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const categories = Array.from(new Set(BLOG_POSTS.map(p => p.category)));
  const filtered = activeCategory === "All" ? BLOG_POSTS : BLOG_POSTS.filter(p => p.category === activeCategory);
  const sorted = [...filtered].sort((a, b) => b.date.localeCompare(a.date));

  useState(() => {
    document.title = "Blog | Layer One Staging";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "Practical notes on IT staging, kitting, rollout logistics, and asset management from the Layer One Staging team in DFW, Texas.");
  });

  return (
    <section className="pt-32 pb-20">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-12">
          <span className="inline-block text-xs font-semibold tracking-widest uppercase text-[#0A84FF] mb-3">Blog</span>
          <h1 className="text-4xl md:text-5xl font-black tracking-[-1.5px] mb-4 text-white">From the Field</h1>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">Practical notes on staging, kitting, rollout logistics, and the problems we solve every day. Written by people who have done the work.</p>
        </div>

        {/* Hero Image */}
        <div className="rounded-2xl overflow-hidden border border-white/10 mb-12">
          <img src="/images/blog-hero.png" alt="Layer One Staging blog - insights, tips, and industry updates from the field to the warehouse" className="w-full h-auto" />
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 justify-center mb-10">
          {["All", ...categories].map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${
                activeCategory === cat
                  ? "bg-[#0A84FF] text-white border-[#0A84FF]"
                  : "border-white/15 text-slate-400 hover:border-[#0A84FF]/50 hover:text-slate-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Post Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {sorted.map(post => (
            <a
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group rounded-2xl border border-white/10 bg-white/[0.03] hover:border-[#0A84FF]/40 hover:bg-white/[0.05] transition-all p-7 flex flex-col"
            >
              <div className="flex items-center gap-3 mb-4">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-[#0A84FF]/15 text-[#5eb2ff]">
                  <Tag className="w-3 h-3" /> {post.category}
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                  <Clock className="w-3.5 h-3.5" /> {post.readTime} min read
                </span>
              </div>
              <h2 className="text-xl font-bold text-white mb-2 group-hover:text-[#5eb2ff] transition-colors leading-snug">
                {post.title}
              </h2>
              <p className="text-sm text-slate-400 leading-relaxed mb-5 flex-1">{post.excerpt}</p>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                  <Calendar className="w-3.5 h-3.5" /> {formatDate(post.date)}
                </span>
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0A84FF] group-hover:gap-2.5 transition-all">
                  Read post <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </a>
          ))}
        </div>

        {sorted.length === 0 && (
          <p className="text-center text-slate-500 py-12">No posts in this category yet.</p>
        )}

        <div className="text-center mt-14">
          <a
            href="/get-started"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold bg-[#0A84FF] text-white hover:bg-[#3d9dff] transition-colors shadow-[0_14px_34px_rgba(10,132,255,0.3)]"
          >
            Request a Project Quote <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </section>
  );
}

export default function BlogPage() {
  return (
    <div
      className="min-h-screen"
      style={{
        background: "radial-gradient(circle at top left, rgba(10,132,255,0.12) 0%, transparent 35%), linear-gradient(135deg, #0B1320, #0B1320)",
        color: "#f5f8fc",
      }}
    >
      <NavBar />
      <main>
        <BlogContent />
      </main>
      <Footer />
    </div>
  );
}
