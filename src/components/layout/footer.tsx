import Link from "next/link"

const footerLinks = [
  { href: "/about", label: "About" },
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
  { href: "/contact", label: "Contact" },
]

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-border/80 bg-muted/30">
      <div className="container flex flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row">
        <nav
          className="flex flex-wrap items-center justify-center gap-6"
          aria-label="Нижняя навигация"
        >
          {footerLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {label}
            </Link>
          ))}
        </nav>
        <p className="text-center text-sm text-muted-foreground sm:text-right">
          © {year} GameAssets. Все права защищены.
        </p>
      </div>
    </footer>
  )
}
