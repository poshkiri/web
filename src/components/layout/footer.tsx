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
    <footer className="border-t border-white/10 bg-black/60 text-foreground">
      <div className="container flex flex-col items-center justify-between gap-6 px-4 py-8 sm:flex-row">
        {/* Logo + Copyright */}
        <div className="flex flex-col items-center gap-2 sm:items-start">
          <Link
            href="/"
            className="flex items-center gap-2 font-bold tracking-tight text-foreground transition-colors hover:text-primary"
            aria-label="GameAssets — на главную"
          >
            <span className="text-lg leading-none" aria-hidden>
              ⬡
            </span>
            <span>GameAssets</span>
          </Link>
          <p className="text-sm text-muted-foreground">
            © {year} GameAssets. Все права защищены.
          </p>
        </div>

        {/* Links */}
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
      </div>
    </footer>
  )
}
