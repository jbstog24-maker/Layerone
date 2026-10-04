import { useState } from "react";
import { useRoute, Link } from "wouter";
import { Calendar, Clock, Tag, ArrowLeft, ArrowRight, Phone } from "lucide-react";
import { NavBar, Footer } from "./Landing";
import { BLOG_POSTS } from "../data/blog-posts";

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  return `${months[m - 1]} ${d}, ${y}`;
}

function BlogPostContent({ slug }: { slug: string }) {
  const post = BLOG_POSTS.find(p => p.slug === slug);

  useState(() => {
    if (post) {
      document.title = `${post.title} | Layer One Staging Blog`;
      const meta = document.querySelector('meta[name="description"]');
      if (meta) meta.setAttribute("content", post.excerpt);
    } else {
      document.title = "Post Not Found | Layer One Staging";
    }
  });

  if (!post) {
    return (
      <section className="pt-40 pb-24">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h1 className="text-4xl font-black text-white mb-4">Post not found</h1>
          <p className="text-slate-400 mb-8">The article you are looking for does not exist or has been moved.</p>
          <Link href="/blog" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold bg-[#0A84FF] text-white hover:bg-[#3d9dff] transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Blog
          </Link>
        </div>
      </section>
    );
  }

  const related = BLOG_POSTS.filter(p => p.slug !== post.slug && p.category === post.category).slice(0, 2);
  const relatedFallback = BLOG_POSTS.filter(p => p.slug !== post.slug).slice(0, 2);
  const showRelated = related.length > 0 ? related : relatedFallback;

  return (
    <section className="pt-32 pb-20">
      <div className="max-w-3xl mx-auto px-6">
        <Link href="/blog" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" /> Back to Blog
        </Link>

        <div className="flex flex-wrap items-center gap-3 mb-5">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-[#0A84FF]/15 text-[#5eb2ff]">
            <Tag className="w-3 h-3" /> {post.category}
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
            <Calendar className="w-3.5 h-3.5" /> {formatDate(post.date)}
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
            <Clock className="w-3.5 h-3.5" /> {post.readTime} min read
          </span>
        </div>

        <h1 className="text-3xl md:text-5xl font-black tracking-[-1px] text-white mb-6 leading-tight">{post.title}</h1>
        <p className="text-lg text-slate-400 leading-relaxed mb-10 border-l-2 border-[#0A84FF]/40 pl-5">{post.excerpt}</p>

        <article className="space-y-6">
          {post.content.map((block, i) =>
            block.startsWith("## ") ? (
              <h2 key={i} className="text-2xl font-bold text-white pt-4">{block.slice(3)}</h2>
            ) : (
              <p key={i} className="text-slate-300 leading-relaxed text-[1.05rem]">{block}</p>
            )
          )}
        </article>

        {/* CTA Box */}
        <div className="mt-14 rounded-2xl border border-[#0A84FF]/30 bg-[#0A84FF]/[0.07] p-8 text-center">
          <h3 className="text-xl font-bold text-white mb-2">Dealing with this problem right now?</h3>
          <p className="text-slate-400 text-sm mb-6">Tell us about your project and we will build a quote around it. No generic packages, no guesswork.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="/get-started"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold bg-[#0A84FF] text-white hover:bg-[#3d9dff] transition-colors shadow-[0_14px_34px_rgba(10,132,255,0.3)]"
            >
              Request a Project Quote <ArrowRight className="w-4 h-4" />
            </a>
            <a href="tel:+14695374378" className="inline-flex items-center gap-2 text-slate-300 hover:text-white transition-colors font-semibold">
              <Phone className="w-4 h-4" /> (469) 537-4378
            </a>
          </div>
        </div>

        {/* Related Posts */}
        {showRelated.length > 0 && (
          <div className="mt-14">
            <h3 className="text-lg font-bold text-white mb-5">Keep reading</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              {showRelated.map(r => (
                <Link
                  key={r.slug}
                  href={`/blog/${r.slug}`}
                  className="group rounded-xl border border-white/10 bg-white/[0.03] hover:border-[#0A84FF]/40 transition-all p-5"
                >
                  <span className="text-xs font-semibold text-[#5eb2ff]">{r.category}</span>
                  <p className="text-sm font-bold text-white mt-1.5 group-hover:text-[#5eb2ff] transition-colors leading-snug">{r.title}</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default function BlogPost() {
  const [, params] = useRoute("/blog/:slug");
  const slug = params?.slug ?? "";

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
        <BlogPostContent slug={slug} />
      </main>
      <Footer />
    </div>
  );
}
