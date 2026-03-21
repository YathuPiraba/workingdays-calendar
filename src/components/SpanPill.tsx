import type { SpanPillProps } from "../types";

export default function SpanPill({
  color,
  fg,
  label,
  spanRole,
  cellsRemainingInRow,
  showLabel,
}: SpanPillProps) {
  const endsThisRow = cellsRemainingInRow === 1;

  const isStart =
    spanRole === "solo" || spanRole === "start" || spanRole === "firstVisible";
  const isEnd = spanRole === "solo" || spanRole === "end" || endsThisRow;

  const borderRadius = `${isStart ? 4 : 0}px ${isEnd ? 4 : 0}px ${isEnd ? 4 : 0}px ${isStart ? 4 : 0}px`;

  // Continuation segments (mid and row-break end): muted fill
  const isMuted = spanRole === "mid";
  const bgColor = isMuted
    ? `${color}55` // 33% alpha for continuation
    : spanRole === "end" || (spanRole !== "solo" && !isStart && !isEnd)
      ? `${color}99` // end segments slightly more visible
      : color;

  // Negative horizontal margins so pill bleeds into cell borders for seamless stretch
  // start: bleed right only; mid: bleed both; end: bleed left only
  const marginLeft = isStart ? 0 : -1;
  const marginRight = isEnd ? 0 : -1;

  return (
    <div
      className={`wc-event-pill wc-pill-${spanRole}`}
      style={{
        background: bgColor,
        color: fg,
        borderRadius,
        marginLeft,
        marginRight,
      }}
    >
      {showLabel && <span className="wc-event-label">{label}</span>}
      {/* Continuation arrow indicator for row-wrap mid segments */}
      {!showLabel && spanRole === "mid" && (
        <span className="wc-span-continue-dot" aria-hidden="true" />
      )}
    </div>
  );
}
