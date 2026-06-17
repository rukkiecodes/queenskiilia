/**
 * Text wordmark. Kept as styled text (not an image asset) so it stays crisp at
 * any size and inherits the current text color — drop in a real logo SVG later.
 */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span
      className={`tracking-tight-apple text-[17px] font-semibold leading-none ${className ?? ""}`}
    >
      QueenSkiilia
    </span>
  );
}
