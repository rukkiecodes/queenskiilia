"use client";

/**
 * Hero CTAs. Both scroll to the embedded JotForm waitlist (see
 * components/waitlist.tsx).
 */
export function HeroCtas() {
  function goToWaitlist() {
    if (typeof window === "undefined") return;
    document
      .getElementById("waitlist")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <>
      <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <a
          href="#waitlist"
          onClick={() => goToWaitlist()}
          className="press w-full rounded-pill bg-primary px-7 py-3.5 text-[17px] font-normal text-white sm:w-auto"
        >
          👑 Join the Waitlist
        </a>
        <a
          href="#waitlist"
          onClick={() => goToWaitlist()}
          className="press w-full rounded-pill border border-primary px-7 py-3.5 text-[17px] font-normal text-primary sm:w-auto"
        >
          🏢 Hire Verified Talent
        </a>
      </div>
      <a
        href="#how"
        className="press mt-5 inline-block text-[15px] text-primary"
      >
        See how it works ›
      </a>
    </>
  );
}
