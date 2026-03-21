import { useEffect, useState } from "react";

export function useTooltipPosition(
  open: boolean,
  anchorRef: React.RefObject<HTMLElement | null>,
  tooltipRef: React.RefObject<HTMLElement | null>,
) {
  const [style, setStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    if (!open || !anchorRef.current || !tooltipRef.current) return;

    const rect = anchorRef.current.getBoundingClientRect();
    const tipH = tooltipRef.current.offsetHeight;
    const tipW = tooltipRef.current.offsetWidth;

    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const spaceBelow = vh - rect.bottom;

    const top = spaceBelow < tipH + 12 ? rect.top - tipH - 6 : rect.bottom + 6;

    let left = rect.left;
    if (left + tipW > vw - 12) left = vw - tipW - 12;
    if (left < 8) left = 8;

    setStyle({
      position: "fixed",
      top,
      left,
      zIndex: 9999,
    });
  }, [open]);

  return style;
}
