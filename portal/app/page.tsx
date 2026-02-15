// portal/app/page.tsx
"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import PublicNavbar from "@/components/PublicNavbar";
import PublicFooter from "@/components/PublicFooter";

export default function HomePage() {
  // Reveal Animation Logic
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
          }
        });
      },
      { threshold: 0.1 }
    );
    document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // Card Tilt Logic
  const cardRef = useRef<HTMLDivElement>(null);
  const handleMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const r = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    cardRef.current.style.transform = `rotateY(${x * 8}deg) rotateX(${-y * 8}deg)`;
  };
  const handleLeave = () => {
    if (cardRef.current) cardRef.current.style.transform = "rotateY(0) rotateX(0)";
  };

  return (
    <main className="min-h-screen flex flex-col bg-background text-foreground selection:bg-accent selection:text-background transition-colors duration-300">
      <PublicNavbar />

      {/* HERO SECTION */}
      <section className="relative pt-24 pb-20 md:pt-32 md:pb-32 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-accent/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/4" />
        </div>

        <div className="container mx-auto px-6 relative z-10 grid lg:grid-cols-2 gap-12 items-center">
          {/* Text Content */}
          <div className="space-y-8">
            <h1 className="text-5xl md:text-7xl font-semibold tracking-tight reveal">
              The Crown
            </h1>
            <p className="text-xl md:text-2xl text-muted max-w-lg leading-relaxed reveal">
              One product. $60 all-in. Zirconia perfected — no menus, no upsells, no confusion.
            </p>
            <div className="flex flex-wrap gap-4 reveal">
              <Link
                href="/contact"
                className="px-8 py-4 rounded-full bg-foreground text-background font-bold hover:bg-foreground/90 transition-all shadow-lg"
              >
                Send a Case
              </Link>
              <Link
                href="/work"
                className="px-8 py-4 rounded-full border border-border hover:bg-surface transition-colors font-medium backdrop-blur-md"
              >
                See the Craft
              </Link>
            </div>
            <div className="flex items-center gap-3 text-sm text-muted reveal">
              <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.6)]" />
              <span>Made in USA • Delivery in 7 business days</span>
            </div>
          </div>

          {/* 3D Card */}
          <div className="perspective-1000 flex justify-center lg:justify-end reveal">
            <div
              ref={cardRef}
              onMouseMove={handleMove}
              onMouseLeave={handleLeave}
              className="relative w-full max-w-md aspect-[4/5] rounded-[32px] border border-border bg-surface backdrop-blur-xl shadow-2xl overflow-hidden transition-all duration-300 ease-out"
              style={{ transformStyle: "preserve-3d" }}
            >
              {/* Card Glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
              
              <div className="relative p-8 h-full flex flex-col justify-between z-10">
                <div className="flex justify-between items-start">
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 rounded-full border border-border bg-surface-highlight text-xs font-medium transition-colors">Zirconia</span>
                    <span className="px-3 py-1 rounded-full border border-border bg-surface-highlight text-xs font-medium transition-colors">USA</span>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-foreground">$60</div>
                    <div className="text-xs text-muted">all-in</div>
                  </div>
                </div>

                {/* Animated GIF - REQUIRES Images/CrownLoop.gif in public folder */}
                <div className="flex-1 flex items-center justify-center my-4">
                  <div className="relative w-64 h-64">
                    <Image 
                      src="/Images/CrownLoop.gif" 
                      alt="Crown" 
                      fill
                      className="object-contain drop-shadow-[0_20px_50px_rgba(150,150,226,0.15)]"
                      unoptimized
                    />
                  </div>
                </div>

                {/* Specs */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="p-3 rounded-xl border border-border bg-surface-highlight flex justify-between items-center transition-colors">
                    <span className="text-muted">Strength</span>
                    <span className="font-semibold">1200 MPa</span>
                  </div>
                  <div className="p-3 rounded-xl border border-border bg-surface-highlight flex justify-between items-center transition-colors">
                    <span className="text-muted">Translucency</span>
                    <span className="font-semibold">43%</span>
                  </div>
                  <div className="p-3 rounded-xl border border-border bg-surface-highlight flex justify-between items-center transition-colors">
                    <span className="text-muted">Margin</span>
                    <span className="font-semibold">0.2 mm</span>
                  </div>
                  <div className="p-3 rounded-xl border border-border bg-surface-highlight flex justify-between items-center transition-colors">
                    <span className="text-muted">Material</span>
                    <span className="font-semibold">3Y</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* QUALITY SECTION */}
      <section className="py-24 border-t border-white/5 relative">
        <div className="container mx-auto px-6">
          <div className="max-w-2xl mb-16">
            <h2 className="text-4xl font-semibold mb-6 reveal text-foreground">Quality without complexity</h2>
            <p className="text-xl text-muted leading-relaxed reveal">
              We focus on one thing—zirconia crowns—so every step is tuned for excellence. 
              Our globally distributed design team keeps work moving overnight; US manufacturing ensures consistent quality.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { title: "Microscopic fit", desc: "Margins verified under magnification; designed for a consistent passive fit to reduce chairside adjustment." },
              { title: "Global design, local quality", desc: "Overnight responsiveness from our global design team; Made in USA production for precision." },
              { title: "Always responsive", desc: "A highly responsive team with clear communication at every step." }
            ].map((card, i) => (
              <div key={i} className="p-8 rounded-3xl border border-border bg-surface hover:bg-surface-highlight transition-colors reveal">
                <h3 className="text-xl font-medium mb-4">{card.title}</h3>
                <p className="text-muted leading-relaxed">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <PublicFooter />
    </main>
  );
}