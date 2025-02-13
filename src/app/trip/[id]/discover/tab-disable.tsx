import { useAtomValue } from "jotai";
import { ReactNode, useEffect, useRef } from "react";
import { drawerMinimisedAtom } from "../../atoms";

export default function TabDisable({
  children,
  active = true,
}: {
  children: ReactNode;
  active?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  const minimised = useAtomValue(drawerMinimisedAtom);

  useEffect(() => {
    if (active && !minimised) return;
    if (!containerRef.current) return;

    // List of focusable elements
    const focusableSelector = [
      "button",
      "a",
      "input",
      "select",
      "textarea",
    ].join(", ");

    const focusableElements =
      containerRef.current.querySelectorAll(focusableSelector);
    const affectedElements: Element[] = [];

    for (let i = 0; i < focusableElements.length; i++) {
      if (focusableElements[i].getAttribute("tabindex") !== "-1") {
        focusableElements[i].setAttribute("tabindex", "-1");
        affectedElements.push(focusableElements[i]);
      }
    }

    // Cleanup: Restore original tabIndex values
    return () => {
      for (let i = 0; i < affectedElements.length; i++) {
        affectedElements[i].removeAttribute("tabindex");
      }
    };
  }, [active, minimised]);

  return <div ref={containerRef}>{children}</div>;
}
