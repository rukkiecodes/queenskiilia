export function Problem() {
  return (
    <section
      id="problem"
      className="bg-tile px-5 py-20 sm:py-24"
      aria-labelledby="problem-heading"
    >
      <div className="mx-auto max-w-[760px] text-center">
        <h2
          id="problem-heading"
          className="tracking-tight-apple text-[clamp(1.875rem,5vw,2.5rem)] font-semibold leading-[1.1] text-on-dark"
        >
          Tired of hearing{" "}
          <span className="text-primary-on-dark">
            &ldquo;You need experience&rdquo;
          </span>
          ?
        </h2>
        <p className="mx-auto mt-6 max-w-[620px] text-[19px] leading-[1.5] text-body-muted sm:text-[21px]">
          Millions of talented people are overlooked because they lack
          experience. Businesses struggle to know who they can trust.{" "}
          <span className="text-on-dark">QueenSkiilia changes that.</span>
        </p>
      </div>
    </section>
  );
}
