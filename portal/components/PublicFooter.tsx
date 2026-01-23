// portal/components/PublicFooter.tsx
export default function PublicFooter() {
  return (
    <footer className="border-t border-white/10 bg-background py-12 text-center">
      <div className="container mx-auto px-6">
        <p className="text-white/40 text-sm">
          © {new Date().getFullYear()} Lumera Dental Lab. All rights reserved.
        </p>
        <p className="text-white/20 text-xs mt-2">
          Made in USA. Designed Globally.
        </p>
      </div>
    </footer>
  );
}