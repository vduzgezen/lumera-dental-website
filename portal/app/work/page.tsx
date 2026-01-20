// portal/app/work/page.tsx
import PublicNavbar from "@/components/PublicNavbar";
import PublicFooter from "@/components/PublicFooter";
import Link from "next/link";

export default function WorkPage() {
  // Placeholder data for when you have images.
  // Replace 'bg-white/5' with <Image src="..." /> later.
  const galleryItems = [
    { id: 1, title: "Full Arch Zirconia", category: "Restoration", colSpan: "col-span-1 md:col-span-2 row-span-2" },
    { id: 2, title: "Single Central Incisor", category: "Esthetic", colSpan: "col-span-1" },
    { id: 3, title: "Gold Crown", category: "Classic", colSpan: "col-span-1" },
    { id: 4, title: "Implant Bridge", category: "Complex", colSpan: "col-span-1" },
    { id: 5, title: "Veneer Case", category: "Cosmetic", colSpan: "col-span-1" },
  ];

  return (
    // FIX: Removed 'font-sans' to match HomePage (Arial default) and prevent Navbar jump
    // FIX: Changed structure to 'main' with 'flex flex-col' for consistent sticky footer behavior
    <main className="min-h-screen flex flex-col bg-midnight text-porcelain selection:bg-accent/30">
      <PublicNavbar />

      <div className="flex-1">
        {/* HERO SECTION */}
        <section className="relative pt-32 pb-20 px-6 overflow-hidden">
          {/* Ambient Background */}
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-accent/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
          
          <div className="container mx-auto text-center relative z-10">
            <h1 className="text-4xl md:text-6xl font-light mb-6 tracking-tight">
              Our <span className="text-accent">Masterpieces</span>
            </h1>
            <p className="text-lg text-white/60 max-w-2xl mx-auto leading-relaxed">
              Precision meets artistry. Explore our gallery of complex restorations, 
              aesthetic makeovers, and everyday crown & bridge work.
            </p>
          </div>
        </section>

        {/* GALLERY GRID */}
        <section className="py-20 px-6 bg-[#0a1020]/50">
          <div className="container mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 auto-rows-[300px] gap-6">
              {galleryItems.map((item) => (
                <div 
                  key={item.id} 
                  className={`group relative rounded-3xl overflow-hidden border border-white/5 bg-white/5 backdrop-blur-sm hover:border-accent/30 transition-all duration-500 ${item.colSpan}`}
                >
                  {/* Placeholder for Image */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent flex items-center justify-center group-hover:scale-105 transition-transform duration-700">
                    <svg className="w-12 h-12 text-white/10 group-hover:text-accent/20 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>

                  {/* Overlay Content */}
                  <div className="absolute inset-0 bg-gradient-to-t from-midnight via-midnight/50 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                  
                  <div className="absolute bottom-0 left-0 p-8 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                    <span className="text-accent text-xs font-bold tracking-widest uppercase mb-2 block opacity-0 group-hover:opacity-100 transition-opacity delay-100">
                      {item.category}
                    </span>
                    <h3 className="text-xl font-medium text-white group-hover:text-accent transition-colors">
                      {item.title}
                    </h3>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA SECTION */}
        <section className="py-32 px-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-accent/5" />
          <div className="container mx-auto text-center relative z-10">
            <h2 className="text-3xl font-light mb-8">Ready to send your first case?</h2>
            <Link 
              href="/signup"
              className="inline-flex items-center justify-center px-8 py-4 text-base font-bold text-midnight bg-accent rounded-full hover:bg-white hover:scale-105 transition-all shadow-[0_0_30px_rgba(121,231,224,0.3)]"
            >
              Get Started
            </Link>
          </div>
        </section>
      </div>

      <PublicFooter />
    </main>
  );
}