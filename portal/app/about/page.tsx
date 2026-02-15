// portal/app/about/page.tsx
import PublicNavbar from "@/components/PublicNavbar";
import PublicFooter from "@/components/PublicFooter";

export default function AboutPage() {
  return (
    <main className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-300">
      <PublicNavbar />
      
      <section className="pt-24 pb-12">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-5xl font-semibold mb-6">About Lumera</h1>
          <p className="text-xl text-muted max-w-3xl mx-auto">
            We build one thing exceptionally well: zirconia crowns. When other restorations reach 
            the efficiency and reliability of The Crown, we’ll add them. Never before.
          </p>
        </div>
      </section>

      <section className="container mx-auto px-6 pb-24 max-w-4xl space-y-8">
        {/* Story Card */}
        <div className="p-8 md:p-12 rounded-3xl border border-border bg-surface transition-colors">
          <h2 className="text-2xl font-medium mb-4">Our Story</h2>
          <p className="text-muted leading-relaxed text-lg">
            We started as a <b>boutique lab for personalized restorations</b>, a small team obsessed with detail. 
            As a private lab we served a network of 50+ clinics in the Northeast and refined a single workflow end to end. 
            Today we’re opening to the public with that same craft and focus.
          </p>
        </div>

        {/* Founders Grid */}
        <div className="p-8 md:p-12 rounded-3xl border border-border bg-surface transition-colors">
          <h2 className="text-2xl font-medium mb-8">Founders</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { role: "Dentist", sub: "Clinical Lead", desc: "Sets standards for margin capture, occlusion, and chairside simplicity." },
              { role: "Group Owner", sub: "Operations", desc: "Ensures submission clarity, communication speed, and predictable delivery." },
              { role: "Engineer", sub: "Biomedical / Software", desc: "Operations, data flow, and reliability across production." }
            ].map((f, i) => (
              <div key={i} className="p-6 rounded-2xl border border-border bg-surface-highlight transition-colors">
                <h3 className="font-semibold text-lg mb-1">{f.role}</h3>
                <div className="text-xs text-accent uppercase tracking-wider font-bold mb-3">{f.sub}</div>
                <p className="text-sm text-muted">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <PublicFooter />
    </main>
  );
}