// TooltipPortal.tsx
import { createPortal } from "react-dom";

export default function TooltipPortal({
  open,
  children,
}: {
  open: boolean;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return createPortal(children, document.body);
}
