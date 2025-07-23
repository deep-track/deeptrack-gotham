export default function Footer() {
  return (
    <footer className="bg-[hsl(var(--card))]  mt-10 py-6 border-t border-[hsl(var(--border))] text-center text-sm text-white">
      <p>
        &copy; {new Date().getFullYear()} deeptrack &middot; All rights reserved.
      </p>
    </footer>
  );
}
