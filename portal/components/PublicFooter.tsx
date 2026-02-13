// portal/components/PublicFooter.tsx
export default function PublicFooter() {
  return (
    <footer className="border-t border-border bg-background py-12 text-center">
      <div className="container mx-auto px-6">
        <p className="text-muted text-sm">
          © {new Date().getFullYear()} Lumera Dental Lab. All rights reserved.
        </p>
        <p className="text-muted/50 text-xs mt-2">
          Made in USA. Designed Globally.
        </p>
      </div>
    </footer>
  );
}