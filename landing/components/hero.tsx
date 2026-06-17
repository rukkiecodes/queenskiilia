export function Hero() {
  return (
    <section
      id="top"
      className="bg-canvas px-5 pb-20 pt-20 sm:pt-28"
      aria-labelledby="hero-heading"
    >
      <div className="mx-auto max-w-[820px] text-center">
        <p className="mb-5 text-[15px] font-semibold tracking-tight-apple text-primary">
          From Skill to Real Experience
        </p>
        <h1
          id="hero-heading"
          className="tracking-tight-apple text-[clamp(2.25rem,7vw,3.5rem)] font-semibold leading-[1.07] text-ink"
        >
          Get the experience
          <br className="hidden sm:block" /> nobody will give you.
        </h1>
        <p className="mx-auto mt-6 max-w-[600px] text-[19px] leading-[1.47] text-ink-muted-80 sm:text-[21px]">
          Learn real skills, prove them with practical assessments, get connected
          to paid opportunities, and build a career you can stand behind — all in
          one place.
        </p>
        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a
            href="#waitlist"
            className="press w-full rounded-pill bg-primary px-7 py-3.5 text-[17px] font-normal text-white sm:w-auto"
          >
            Join the waiting list
          </a>
          <a
            href="#how"
            className="press w-full rounded-pill border border-primary px-7 py-3.5 text-[17px] font-normal text-primary sm:w-auto"
          >
            See how it works
          </a>
        </div>
        <p className="mt-5 text-[13px] text-ink-muted-48">
          Be first in line when we launch. No spam, ever.
        </p>
      </div>
    </section>
  );
}
