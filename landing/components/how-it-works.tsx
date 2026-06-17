const STEPS = [
  {
    n: "01",
    title: "Learn",
    body: "Master in-demand, real-world skills at your own pace.",
  },
  {
    n: "02",
    title: "Prove It",
    body: "Take practical assessments that show what you can actually do.",
  },
  {
    n: "03",
    title: "Work",
    body: "Get connected to real, paid opportunities.",
  },
  {
    n: "04",
    title: "Earn",
    body: "Build your career — and your income — with confidence.",
  },
];

export function HowItWorks() {
  return (
    <section
      id="how"
      className="bg-canvas px-5 py-20 sm:py-24"
      aria-labelledby="how-heading"
    >
      <div className="mx-auto max-w-[1080px]">
        <div className="mx-auto max-w-[720px] text-center">
          <p className="mb-3 text-[14px] font-semibold uppercase tracking-[0.08em] text-primary">
            How QueenSkiilia works
          </p>
          <h2
            id="how-heading"
            className="tracking-tight-apple text-[clamp(1.875rem,5vw,2.5rem)] font-semibold leading-[1.1] text-ink"
          >
            Four steps from learner to earner.
          </h2>
        </div>

        <ol className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step) => (
            <li
              key={step.n}
              className="flex flex-col rounded-lg border border-hairline bg-canvas p-6"
            >
              <span className="text-[14px] font-semibold text-primary">
                {step.n}
              </span>
              <h3 className="mt-3 tracking-tight-apple text-[22px] font-semibold leading-[1.2] text-ink">
                {step.title}
              </h3>
              <p className="mt-2 text-[16px] leading-[1.47] text-ink-muted-80">
                {step.body}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
