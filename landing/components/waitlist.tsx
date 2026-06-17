"use client";

import { useEffect, useState } from "react";

type Status = "idle" | "submitting" | "success" | "error";

const ROLES = [
  { value: "student", label: "I want to learn & earn" },
  { value: "business", label: "I want to hire talent" },
  { value: "other", label: "Just curious" },
] as const;

export function Waitlist() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<(typeof ROLES)[number]["value"]>("student");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // The hero "Hire Verified Talent" CTA pre-selects the business role here.
  useEffect(() => {
    function onRole(e: Event) {
      const detail = (e as CustomEvent<string>).detail;
      if (detail === "student" || detail === "business" || detail === "other") {
        setRole(detail);
      }
    }
    window.addEventListener("wl-role", onRole);
    return () => window.removeEventListener("wl-role", onRole);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!emailValid || status === "submitting") return;

    setStatus("submitting");
    setMessage("");

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), role }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        alreadyJoined?: boolean;
      };

      if (!res.ok) {
        setStatus("error");
        setMessage(data.error || "Something went wrong. Please try again.");
        return;
      }

      setStatus("success");
      setMessage(
        data.alreadyJoined
          ? "You're already on the list — we'll be in touch."
          : "You're on the list. We'll email you the moment we launch."
      );
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  }

  if (status === "success") {
    return (
      <section id="waitlist" className="bg-parchment px-5 py-24" aria-labelledby="waitlist-heading">
        <div className="mx-auto max-w-[560px] text-center">
          <div
            aria-hidden
            className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-2xl text-white"
          >
            ✓
          </div>
          <h2
            id="waitlist-heading"
            className="tracking-tight-apple text-[clamp(1.75rem,4.5vw,2.25rem)] font-semibold leading-[1.1] text-ink"
          >
            You&rsquo;re in.
          </h2>
          <p className="mx-auto mt-4 max-w-[420px] text-[18px] leading-[1.47] text-ink-muted-80">
            {message}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section
      id="waitlist"
      className="bg-parchment px-5 py-20 sm:py-24"
      aria-labelledby="waitlist-heading"
    >
      <div className="mx-auto max-w-[560px] text-center">
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

        <form onSubmit={handleSubmit} className="mt-9 text-left" noValidate>
          <div className="flex flex-col gap-3">
            <label className="sr-only" htmlFor="wl-name">
              Your name
            </label>
            <input
              id="wl-name"
              type="text"
              autoComplete="name"
              placeholder="Your name (optional)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-12 rounded-pill border border-hairline bg-canvas px-5 text-[16px] text-ink placeholder:text-ink-muted-48"
            />

            <label className="sr-only" htmlFor="wl-email">
              Email address
            </label>
            <input
              id="wl-email"
              type="email"
              required
              autoComplete="email"
              inputMode="email"
              placeholder="you@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={email.length > 0 && !emailValid}
              className="h-12 rounded-pill border border-hairline bg-canvas px-5 text-[16px] text-ink placeholder:text-ink-muted-48"
            />
          </div>

          <fieldset className="mt-5">
            <legend className="mb-2 text-[14px] font-semibold text-ink">
              What brings you here?
            </legend>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              {ROLES.map((r) => (
                <label
                  key={r.value}
                  className={`press cursor-pointer rounded-pill border px-4 py-2.5 text-[14px] ${
                    role === r.value
                      ? "border-primary bg-primary text-white"
                      : "border-hairline bg-canvas text-ink-muted-80"
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={r.value}
                    checked={role === r.value}
                    onChange={() => setRole(r.value)}
                    className="sr-only"
                  />
                  {r.label}
                </label>
              ))}
            </div>
          </fieldset>

          {status === "error" && (
            <p role="alert" className="mt-4 text-[14px] text-[#c01000]">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={!emailValid || status === "submitting"}
            className="press mt-6 h-12 w-full rounded-pill bg-primary text-[17px] font-normal text-white disabled:opacity-40"
          >
            {status === "submitting" ? "Joining…" : "👑 Join the Waitlist"}
          </button>

          <p className="mt-4 text-center text-[12px] leading-[1.4] text-ink-muted-48">
            By joining you agree to receive launch updates from QueenSkiilia. We
            never share your email. Unsubscribe anytime.
          </p>
        </form>
      </div>
    </section>
  );
}
