"use client";

import Script from "next/script";

const FORM_ID = "261676405204555";

declare global {
  interface Window {
    jotformEmbedHandler?: (selector: string, base: string) => void;
  }
}

/**
 * Waitlist signup. Submissions are collected by JotForm (form 261676405204555)
 * — no Supabase/Postgres. The official embed handler script auto-resizes the
 * iframe so it reads as a native section rather than a fixed-height frame.
 */
export function Waitlist() {
  return (
    <section
      id="waitlist"
      className="bg-parchment px-5 py-20 sm:py-24"
      aria-labelledby="waitlist-heading"
    >
      <div className="mx-auto max-w-[680px] text-center">
        <h2
          id="waitlist-heading"
          className="tracking-tight-apple text-[clamp(1.875rem,5vw,2.5rem)] font-semibold leading-[1.1] text-ink"
        >
          Join the Waitlist.
        </h2>
        <p className="mx-auto mt-4 max-w-[460px] text-[18px] leading-[1.47] text-ink-muted-80">
          Be first to know when QueenSkiilia opens. Get early access and help
          shape what we build.
        </p>

        <div className="mt-9 overflow-hidden rounded-[20px] border border-hairline bg-canvas text-left">
          <iframe
            id={`JotFormIFrame-${FORM_ID}`}
            title="QueenSkiilia Waitlist"
            onLoad={() => window.scrollTo(0, 0)}
            allow="geolocation; microphone; camera; fullscreen; payment"
            src={`https://form.jotform.com/${FORM_ID}`}
            scrolling="no"
            style={{
              minWidth: "100%",
              maxWidth: "100%",
              width: "100%",
              height: 600,
              border: "none",
            }}
          />
        </div>

        <p className="mt-4 text-center text-[12px] leading-[1.4] text-ink-muted-48">
          By joining you agree to receive launch updates from QueenSkiilia. We
          never share your email. Unsubscribe anytime.
        </p>
      </div>

      <Script
        src="https://cdn.jotfor.ms/s/umd/latest/for-form-embed-handler.js"
        strategy="afterInteractive"
        onLoad={() => {
          window.jotformEmbedHandler?.(
            `iframe[id='JotFormIFrame-${FORM_ID}']`,
            "https://form.jotform.com"
          );
        }}
      />
    </section>
  );
}
