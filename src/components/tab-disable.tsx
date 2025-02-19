import { composeRefs } from "@radix-ui/react-compose-refs";
import { useAtomValue } from "jotai";
import {
  ComponentProps,
  forwardRef,
  ReactNode,
  useEffect,
  useRef,
} from "react";
import { drawerMinimisedAtom } from "../app/trip/atoms";

const TabDisable = forwardRef<
  HTMLDivElement,
  {
    children: ReactNode;
    active?: boolean;
  } & ComponentProps<"div">
>(({ children, className, active = true, ...rest }, ref) => {
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

  return (
    <div className={className} ref={composeRefs(containerRef, ref)} {...rest}>
      {children}
    </div>
  );
});

TabDisable.displayName = "TabDisable";

export default TabDisable;
