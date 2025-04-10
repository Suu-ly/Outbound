"use client";

import { ComponentProps, ReactNode, useEffect, useRef } from "react";

const TabDisable = ({
  children,
  className,
  active = true,
  ...rest
}: {
  children: ReactNode;
  active?: boolean;
} & ComponentProps<"div">) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (active) return;
    if (!containerRef.current) return;
    // List of focusable elements
    const focusableSelector = [
      "button",
      "a",
      "input",
      "select",
      "textarea",
      '[tabindex="0"]',
    ].join(", ");

    const focusableElements =
      containerRef.current.querySelectorAll(focusableSelector);
    const affectedElements: { element: Element; original: string | null }[] =
      [];

    for (let i = 0; i < focusableElements.length; i++) {
      if (focusableElements[i].getAttribute("tabindex") !== "-1") {
        affectedElements.push({
          element: focusableElements[i],
          original: focusableElements[i].getAttribute("tabindex"),
        });
        focusableElements[i].setAttribute("tabindex", "-1");
      }
    }

    // Cleanup: Restore original tabIndex values
    return () => {
      for (let i = 0; i < affectedElements.length; i++) {
        if (affectedElements[i].original) {
          affectedElements[i].element.setAttribute(
            "tabindex",
            affectedElements[i].original!,
          );
        } else {
          affectedElements[i].element.removeAttribute("tabindex");
        }
      }
    };
  }, [active]);

  return (
    <div
      className={className}
      ref={containerRef}
      {...rest}
      inert={!active ? true : undefined}
    >
      {children}
    </div>
  );
};

TabDisable.displayName = "TabDisable";

export default TabDisable;
