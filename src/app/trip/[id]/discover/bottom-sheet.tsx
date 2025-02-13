"use client";

import { cn } from "@/lib/utils";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import {
  animate,
  HTMLMotionProps,
  motion,
  PanInfo,
  useDragControls,
  useMotionValue,
  useTransform,
} from "motion/react";
import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import {
  drawerDragProgressAtom,
  drawerMinimisedAtom,
  scrolledToTopAtom,
} from "../../atoms";

type BottomSheetProps = HTMLMotionProps<"div"> & {
  children: ReactNode;
};

const BottomSheet = ({ children, className, ...rest }: BottomSheetProps) => {
  const [minimised, setMinimised] = useAtom(drawerMinimisedAtom);
  const [finalPosition, setFinalPosition] = useState(
    window.innerHeight - 56 + 24 - 64 - 112,
  ); // 56 header size, 24 excess height, 64 bottom bar height, 104 = size of visible elements + 12px padding
  const drawerY = useMotionValue(minimised ? finalPosition : 0);
  const drawerControls = useDragControls();
  const dragContainerRef = useRef<HTMLDivElement>(null);

  const drawerProgress = useTransform(
    drawerY,
    [finalPosition - 16, 0], // 16px buffer for when it is considered "closed"
    [0, 1],
    {
      clamp: true,
    },
  );

  const scrolledToTop = useAtomValue(scrolledToTopAtom);
  const setDrawerProgress = useSetAtom(drawerDragProgressAtom);
  const dragStartPos = useRef(0);

  const handlePanStart = useCallback(
    (event: globalThis.PointerEvent, info: PanInfo) => {
      if (Math.abs(info.offset.x) < Math.abs(info.offset.y) && minimised) {
        drawerControls.start(event);
      } else if (
        Math.abs(info.offset.x) < Math.abs(info.offset.y) &&
        scrolledToTop &&
        info.offset.y > 0
      ) {
        drawerControls.start(event);
      }
    },
    [drawerControls, minimised, scrolledToTop],
  );

  const minimiseDrawer = useCallback(
    (velocity?: number) => {
      setMinimised(true);
      animate(drawerY, finalPosition, {
        velocity: velocity,
        type: "spring",
        damping: 23,
        stiffness: 200,
      });
    },
    [finalPosition, drawerY, setMinimised],
  );
  const maximiseDrawer = useCallback(
    (velocity?: number) => {
      setMinimised(false);
      animate(drawerY, 0, {
        velocity: velocity,
        ease: [0.2, 0, 0, 1.0],
        duration: 0.3,
      });
    },
    [drawerY, setMinimised],
  );

  const onDrawerDragEnd = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
  ) => {
    if (info.point.y + 0.15 * info.velocity.y <= window.innerHeight * 0.45) {
      maximiseDrawer(info.velocity.y);
    } else if (
      info.point.y + 0.15 * info.velocity.y >
      window.innerHeight * 0.45
    ) {
      minimiseDrawer(minimised ? 0 : info.velocity.y);
    }
  };

  useEffect(() => {
    const handleTouchMove = (e: TouchEvent) => {
      if (!scrolledToTop) return;
      if (e.targetTouches[0].clientY - dragStartPos.current > 0 && e.cancelable)
        e.preventDefault();
    };

    const dragContainer = dragContainerRef.current;

    dragContainer?.addEventListener("touchmove", handleTouchMove, {
      passive: false,
    });

    return () => {
      dragContainer?.removeEventListener("touchmove", handleTouchMove);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleWheelUp = (e: WheelEvent) => {
      if (e.deltaY > 0 || !e.target) return;
      if (e.deltaY < 0 && scrolledToTop) {
        minimiseDrawer();
      }
    };
    const handleWheelDown = (e: WheelEvent) => {
      if (e.deltaY > 0 && e.clientY > window.innerHeight - 64 - 112) {
        maximiseDrawer();
      }
    };
    const setTranslateAmout = () => {
      setFinalPosition(window.innerHeight - 56 + 24 - 64 - 112);
      if (minimised) {
        drawerY.set(window.innerHeight - 56 + 24 - 64 - 112);
      }
    };

    const dragContainer = dragContainerRef.current;

    if (minimised) {
      document.body.addEventListener("wheel", handleWheelDown);
    }
    if (!minimised && dragContainer)
      dragContainer.addEventListener("wheel", handleWheelUp);

    window.addEventListener("resize", setTranslateAmout);

    return () => {
      document.body.removeEventListener("wheel", handleWheelDown);
      window.removeEventListener("resize", setTranslateAmout);
      dragContainer?.removeEventListener("wheel", handleWheelUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minimised, scrolledToTop]);

  useEffect(() => {
    setDrawerProgress(drawerProgress);
  }, [drawerProgress, setDrawerProgress]);

  return (
    <motion.div
      ref={dragContainerRef}
      initial={{ bottom: -320 }}
      animate={{ bottom: 64 }}
      role={"dialog"}
      transition={{
        duration: 0.5,
        ease: [0, 0, 0, 1.0],
      }}
      style={{ y: drawerY }}
      dragListener={false}
      drag="y"
      dragControls={drawerControls}
      dragConstraints={{ top: 0, bottom: finalPosition }}
      dragElastic={{ bottom: 0.05 }}
      onPanStart={handlePanStart}
      onDragEnd={onDrawerDragEnd}
      whileDrag={{
        cursor: "grabbing",
      }}
      onPointerDown={(e) => {
        if (!scrolledToTop) return;
        dragStartPos.current = e.clientY;
      }}
      className={cn(
        "absolute bottom-16 z-10 flex h-[calc(100%+24px-64px)] w-full touch-none select-none flex-col rounded-t-2xl bg-zinc-50 pt-4",
        className,
      )}
      {...rest}
    >
      <div
        className="w-full touch-none"
        onPointerDown={(e) => drawerControls.start(e)}
      >
        <div className="mx-auto h-2 w-10 cursor-grab rounded-full bg-zinc-200"></div>
      </div>
      <div className="relative h-full">{children}</div>
    </motion.div>
  );
};

export default BottomSheet;
