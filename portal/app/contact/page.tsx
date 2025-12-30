// portal/app/contact/page.tsx
import PublicNavbar from "@/components/PublicNavbar";
import PublicFooter from "@/components/PublicFooter";

export default function ContactPage() {
  return (
    <main className="min-h-screen flex flex-col bg-midnight text-porcelain">
      <PublicNavbar />
      
      <section className="pt-24 pb-12">
        <div className="container mx-auto px-6">
          <h1 className="text-5xl font-semibold mb-6">Contact & Send a Case</h1>
          <p className="text-xl text-white/60 max-w-2xl">
            Flat price. Fast turnaround. Made in USA. We promise delivery in 7 business days.
          </p>
        </div>
      </section>

      <section className="container mx-auto px-6 pb-24 grid lg:grid-cols-2 gap-8">
        {/* Main Contact Card */}
        <div className="p-8 md:p-12 rounded-3xl border border-white/10 bg-white/[0.02]">
          <h2 className="text-2xl font-medium mb-4">Send Scans Via Email</h2>
          <p className="text-white/60 mb-8">
            Attach STL/PLY files, photos, shade, and notes. We’ll reply quickly with design confirmation.
          </p>
          
          <a href="mailto:hello@glo.dental" className="inline-block w-full text-center py-4 rounded-xl bg-white text-midnight font-bold hover:bg-gray-200 transition mb-8">
            Email hello@glo.dental
          </a>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-white/10 bg-black/20">
              <div className="text-xs text-white/40 mb-1">Phone</div>
              <div className="font-medium">+1 (000) 000-0000</div>
            </div>
            <div className="p-4 rounded-xl border border-white/10 bg-black/20">
              <div className="text-xs text-white/40 mb-1">Delivery</div>
              <div className="font-medium">7 business days</div>
            </div>
          </div>
        </div>

        {/* Info Sidebar */}
        <div className="space-y-6">
          <div className="p-8 rounded-3xl border border-white/10 bg-white/[0.02]">
            <h3 className="text-lg font-medium mb-2">Submissions</h3>
            <p className="text-white/60 text-sm">
              <strong className="text-white">Scans only</strong> (no hard impressions). We support common formats (STL/PLY). 
              We ship the finished crown to your office.
            </p>
          </div>
          
          <div className="p-8 rounded-3xl border border-white/10 bg-white/[0.02]">
            <h3 className="text-lg font-medium mb-2">Address</h3>
            <p className="text-white/60 text-sm">
              Lumera Dental Lab<br/>
              [Your Street]<br/>
              [City, State ZIP]<br/>
              <span className="text-accent mt-2 inline-block">Made in USA</span>
            </p>
          </div>
        </div>
      </section>

      <PublicFooter />
    </main>
  );
}