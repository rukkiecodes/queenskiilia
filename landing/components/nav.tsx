import { Wordmark } from "@/components/wordmark";

export function Nav() {
  return (
    <header className="sticky top-0 z-50 bg-black-true/85 backdrop-blur-md backdrop-saturate-150">
      <nav
        aria-label="Primary"
        className="mx-auto flex h-12 max-w-[1080px] items-center justify-between px-5"
      >
        <a
          href="#top"
          className="press flex items-center gap-2 text-on-dark"
          aria-label="QueenSkiilia home"
        >
          <Wordmark className="h-5 w-auto" />
        </a>
        <a
          href="#waitlist"
          className="press rounded-pill bg-primary px-4 py-1.5 text-[13px] font-normal text-white"
        >
          Join the waiting list
        </a>
      </nav>
    </header>
  );
}
