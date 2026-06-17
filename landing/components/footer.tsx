const LEGAL_BASE =
  process.env.NEXT_PUBLIC_LEGAL_URL || "https://queenskilla-legal.vercel.app";

export function Footer() {
  return (
    <footer className="bg-parchment px-5 pb-12 pt-12 text-ink-muted-80">
      <div className="mx-auto flex max-w-[1080px] flex-col items-center gap-6 text-center">
        <nav
          aria-label="Footer"
          className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[14px]"
        >
          <a className="press text-primary" href="#how">
            How it works
          </a>
          <a className="press text-primary" href="#waitlist">
            Join the waiting list
          </a>
          <a className="press text-primary" href={`${LEGAL_BASE}/privacy.html`}>
            Privacy
          </a>
          <a className="press text-primary" href={`${LEGAL_BASE}/terms.html`}>
            Terms
          </a>
          <a className="press text-primary" href="mailto:support@queenskilla.app">
            Contact
          </a>
        </nav>
        <p className="text-[12px] leading-[1.4] text-ink-muted-48">
          © {2026} QueenSkiilia. From Skill to Real Experience.
        </p>
      </div>
    </footer>
  );
}
