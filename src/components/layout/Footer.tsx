export default function Footer() {
  return (
    <footer className="bg-[hsl(var(--card))] text-[hsl(var(--muted-foreground))] mt-10 py-6 border-t border-[hsl(var(--border))] text-center text-sm">
      <p>
        &copy; {new Date().getFullYear()} Deeptrack Gotham &middot; All rights reserved.
      </p>
    </footer>
  );
}
