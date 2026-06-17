import { HeroCtas } from "@/components/hero-ctas";

export function Hero() {
  return (
    <section
      id="top"
      className="bg-canvas px-5 pb-20 pt-20 sm:pt-28"
      aria-labelledby="hero-heading"
    >
      <div className="mx-auto max-w-[860px] text-center">
        <p className="mb-5 text-[15px] font-semibold tracking-tight-apple text-primary">
          Don&rsquo;t tell us. Prove it.
        </p>
        <h1
          id="hero-heading"
          className="tracking-tight-apple text-[clamp(2.25rem,6.5vw,3.5rem)] font-semibold leading-[1.07] text-ink"
        >
          The World&rsquo;s First
          <br className="hidden sm:block" /> Verified Talent Ecosystem
        </h1>
        <p className="mx-auto mt-6 max-w-[600px] text-[19px] leading-[1.47] text-ink-muted-80 sm:text-[21px]">
          Beginners prove their skills. Businesses hire with confidence.
        </p>

        <HeroCtas />

        <p className="mt-5 text-[13px] text-ink-muted-48">
          Be first in line when we launch. No spam, ever.
        </p>
      </div>
    </section>
  );
}
