import { useEffect, useRef, useState } from "react";
import type { MiniCalendarProps } from "../types";
import { MONTHS } from "../utils";
import "../css/MiniCalendar.css";

export default function MiniCalendar({
  currentMonth,
  currentYear,
  onSelect,
  onClose,
  anchorRef,
}: MiniCalendarProps) {
  const [typedMonth, setTypedMonth] = useState(
    String(currentMonth + 1).padStart(2, "0"),
  );
  const [typedYear, setTypedYear] = useState(String(currentYear));
  const [scrollMonth, setScrollMonth] = useState(currentMonth);
  const [scrollYear, setScrollYear] = useState(currentYear);

  const monthListRef = useRef<HTMLDivElement>(null);
  const yearListRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  // Scroll list shows ±50 years around current for quick nearby nav.
  // Typing input is unrestricted — user can jump to any year.
  const SCROLL_RANGE = 50;
  const years = Array.from(
    { length: SCROLL_RANGE * 2 + 1 },
    (_, i) => currentYear - SCROLL_RANGE + i,
  );

  // Scroll selected items into view on open
  useEffect(() => {
    if (monthListRef.current) {
      const selectedEl = monthListRef.current.querySelector(
        ".selected",
      ) as HTMLElement;
      selectedEl?.scrollIntoView({ block: "center" });
    }
    if (yearListRef.current) {
      const selectedEl = yearListRef.current.querySelector(
        ".selected",
      ) as HTMLElement;
      selectedEl?.scrollIntoView({ block: "center" });
    }
  }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(e.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose, anchorRef]);

  const handleTypedMonthChange = (val: string) => {
    setTypedMonth(val);
    const n = parseInt(val, 10);
    if (!isNaN(n) && n >= 1 && n <= 12) setScrollMonth(n - 1);
  };

  const handleTypedYearChange = (val: string) => {
    setTypedYear(val);
    const n = parseInt(val, 10);
    // No range restriction — any valid integer year is accepted
    if (!isNaN(n) && val.length >= 4) {
      setScrollYear(years.includes(n) ? n : currentYear);
      // Update Go button year directly from typed value
      setScrollYear(n);
    }
  };

  const handleScrollMonthSelect = (idx: number) => {
    setScrollMonth(idx);
    setTypedMonth(String(idx + 1).padStart(2, "0"));
  };

  const handleScrollYearSelect = (y: number) => {
    setScrollYear(y);
    setTypedYear(String(y));
  };

  const handleGo = () => {
    // scrollYear is synced from scroll clicks; for typed years outside scroll range,
    // parse typedYear directly so any arbitrary year works.
    const finalYear = parseInt(typedYear, 10);
    const year = !isNaN(finalYear) ? finalYear : scrollYear;
    onSelect(scrollMonth, year);
    onClose();
  };

  return (
    <>
      <div className="mini-cal-overlay" />
      <div className="mini-cal-popup" ref={popupRef}>
        {/* Typing inputs */}
        <div className="mini-cal-inputs">
          <div className="mini-cal-input-group">
            <label>Month (1–12)</label>
            <input
              type="number"
              min={1}
              max={12}
              value={typedMonth}
              onChange={(e) => handleTypedMonthChange(e.target.value)}
            />
          </div>
          <div className="mini-cal-input-group">
            <label>Year (any)</label>
            <input
              type="number"
              value={typedYear}
              onChange={(e) => handleTypedYearChange(e.target.value)}
            />
          </div>
        </div>

        <div className="mini-cal-divider">Scroll</div>

        {/* Scroll columns */}
        <div className="mini-cal-scrollers">
          <div className="mini-cal-scroll-col">
            <h4>Month</h4>
            <div className="mini-cal-scroll-list" ref={monthListRef}>
              {MONTHS.map((m, i) => (
                <div
                  key={m}
                  className={`mini-cal-scroll-item${scrollMonth === i ? " selected" : ""}`}
                  onClick={() => handleScrollMonthSelect(i)}
                >
                  {m}
                </div>
              ))}
            </div>
          </div>
          <div className="mini-cal-scroll-col">
            <h4>Year</h4>
            <div className="mini-cal-scroll-list" ref={yearListRef}>
              {years.map((y) => (
                <div
                  key={y}
                  className={`mini-cal-scroll-item${scrollYear === y ? " selected" : ""}`}
                  onClick={() => handleScrollYearSelect(y)}
                >
                  {y}
                </div>
              ))}
            </div>
          </div>
        </div>

        <button className="mini-cal-go" onClick={handleGo}>
          Go to {MONTHS[scrollMonth].slice(0, 3)}{" "}
          {parseInt(typedYear, 10) || scrollYear}
        </button>
      </div>
    </>
  );
}
