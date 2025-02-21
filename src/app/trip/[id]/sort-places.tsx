import DayFolder from "@/components/day-folder";
import { PlaceDetailsCompactProps } from "@/components/place-details-compact";
import { cn } from "@/lib/utils";
import { DayData, PlaceData } from "@/server/types";
import {
  CancelDrop,
  closestCenter,
  CollisionDetection,
  defaultDropAnimationSideEffects,
  DndContext,
  DragOverlay,
  DropAnimation,
  DroppableContainer as DropContainerType,
  getFirstCollision,
  KeyboardCode,
  KeyboardCoordinateGetter,
  KeyboardSensor,
  MeasuringStrategy,
  MouseSensor,
  pointerWithin,
  rectIntersection,
  TouchSensor,
  UniqueIdentifier,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  AnimateLayoutChanges,
  arrayMove,
  defaultAnimateLayoutChanges,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { addDays } from "date-fns";
import React, {
  ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import PlaceDetailsSortWrapper from "./place-details-sort-wrapper";

const directions: string[] = [KeyboardCode.Down, KeyboardCode.Up];

function useMountStatus() {
  const [isMounted, setIsMounted] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => setIsMounted(true), 500);

    return () => clearTimeout(timeout);
  }, []);

  return isMounted;
}

const coordinateGetter: KeyboardCoordinateGetter = (
  event,
  { context: { active, droppableRects, droppableContainers, collisionRect } },
) => {
  if (directions.includes(event.code)) {
    event.preventDefault();

    if (!active || !collisionRect) {
      return;
    }

    const filteredContainers: DropContainerType[] = [];

    droppableContainers.getEnabled().forEach((entry) => {
      if (!entry || entry?.disabled) {
        return;
      }

      const rect = droppableRects.get(entry.id);

      if (!rect) {
        return;
      }

      const data = entry.data.current;

      if (data) {
        const { type, children } = data;

        if (type === "container" && children?.length > 0) {
          if (active.data.current?.type !== "container") {
            return;
          }
        }
      }

      switch (event.code) {
        case KeyboardCode.Down:
          if (collisionRect.top < rect.top) {
            filteredContainers.push(entry);
          }
          break;
        case KeyboardCode.Up:
          if (collisionRect.top > rect.top) {
            filteredContainers.push(entry);
          }
          break;
      }
    });

    const collisions = closestCenter({
      active,
      collisionRect: collisionRect,
      droppableRects,
      droppableContainers: filteredContainers,
      pointerCoordinates: null,
    });
    const closestId = getFirstCollision(collisions, "id");

    if (closestId != null) {
      const newDroppable = droppableContainers.get(closestId);
      const newNode = newDroppable?.node.current;
      const newRect = newDroppable?.rect.current;

      if (newNode && newRect) {
        if (newDroppable.data.current?.type === "container") {
          return {
            x: newRect.left,
            y: newRect.top,
          };
        }

        return {
          x: newRect.left,
          y: newRect.top,
        };
      }
    }
  }

  return undefined;
};

const animateLayoutChanges: AnimateLayoutChanges = (args) =>
  defaultAnimateLayoutChanges({ ...args, wasDragging: true });

type SortableItemProps = {
  id: UniqueIdentifier;
  disabled?: boolean;
} & PlaceDetailsCompactProps;

function SortableItem({ disabled, id, ...rest }: SortableItemProps) {
  const {
    setNodeRef,
    listeners,
    isDragging,
    isSorting,
    transform,
    transition,
  } = useSortable({
    id,
  });
  const mounted = useMountStatus();
  const mountedWhileDragging = isDragging && !mounted;

  return (
    <PlaceDetailsSortWrapper
      ref={disabled ? undefined : setNodeRef}
      isDragging={isDragging}
      isSorting={isSorting}
      style={{
        transition,
        transform: CSS.Translate.toString(transform),
      }}
      fadeIn={mountedWhileDragging}
      listeners={listeners}
      {...rest}
    />
  );
}

function DroppableContainer({
  children,
  disabled,
  id,
  items,
  style,
  ...rest
}:
  | {
      day: true;
      date: Date;
      children: ReactNode;
      disabled?: boolean;
      id: UniqueIdentifier;
      items: UniqueIdentifier[];
      style?: React.CSSProperties;
    }
  | {
      day: false;
      children: ReactNode;
      disabled?: boolean;
      id: UniqueIdentifier;
      items: UniqueIdentifier[];
      style?: React.CSSProperties;
    }) {
  const [open, setOpen] = useState(false);
  const timer = useRef<NodeJS.Timeout>(null);
  const {
    active,
    attributes,
    isDragging,
    listeners,
    over,
    setNodeRef,
    transform,
  } = useSortable({
    id,
    data: {
      type: "container",
      children: items,
      isOpen: open,
    },
    animateLayoutChanges,
  });
  const isOverContainer = over
    ? (id === over.id && active?.data.current?.type !== "container") ||
      items.includes(over.id)
    : false;

  useEffect(() => {
    if (isOverContainer && !open)
      timer.current = setTimeout(() => {
        setOpen(true);
      }, 500);

    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOverContainer]);

  if (rest.day === false)
    return (
      <div
        className="flex min-h-32 flex-col gap-2 rounded-xl ring-brand-400 ring-offset-8 ring-offset-zinc-50 transition data-[hover=true]:ring-2"
        ref={disabled ? undefined : setNodeRef}
        data-hover={isOverContainer}
      >
        {children}
      </div>
    );

  return (
    <DayFolder
      ref={disabled ? undefined : setNodeRef}
      style={{
        ...style,
        // transition,
        transform: CSS.Translate.toString(transform),
      }}
      isOpen={open && !isDragging}
      onOpenChange={setOpen}
      isDragging={isDragging}
      hover={isOverContainer}
      handleProps={{
        ...attributes,
        ...listeners,
      }}
      date={rest.date}
    >
      {children}
    </DayFolder>
  );
}

const dropAnimation: DropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: {
      active: {
        opacity: "0.5",
      },
    },
  }),
};

interface Props {
  startDate: Date;
  isAdmin: boolean;
  cancelDrop?: CancelDrop;
  placesData: PlaceData;
  dayData: DayData[];
}

const SAVED_ID = "saved";

export default function SortPlaces({
  startDate,
  isAdmin,
  cancelDrop,
  placesData,
  dayData,
}: Props) {
  const [places, setPlaces] = useState<PlaceData>(placesData);
  const [days, setDays] = useState(dayData);
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const lastOverId = useRef<UniqueIdentifier | null>(null);
  const recentlyMovedToNewContainer = useRef(false);
  const isSortingContainer =
    activeId != null ? days.some((day) => day.dayId === activeId) : false;

  /**
   * Custom collision detection strategy optimized for multiple containers
   *
   * - First, find any droppable containers intersecting with the pointer.
   * - If there are none, find intersecting containers with the active draggable.
   * - If there are no intersecting containers, return the last matched intersection
   *
   */
  const collisionDetectionStrategy: CollisionDetection = useCallback(
    (args) => {
      if (activeId && activeId in places) {
        return closestCenter({
          ...args,
          droppableContainers: args.droppableContainers.filter(
            (container) => container.id in places,
          ),
        });
      }

      // Start by finding any intersecting droppable
      const pointerIntersections = pointerWithin(args);
      const intersections =
        pointerIntersections.length > 0
          ? // If there are droppables intersecting with the pointer, return those
            pointerIntersections
          : rectIntersection(args);
      let overId = getFirstCollision(intersections, "id");

      if (overId != null) {
        if (overId in places) {
          const containerItems = places[overId];
          const containerId = overId;
          // If a container is matched and it contains items (columns 'A', 'B', 'C')
          if (containerItems.length > 0) {
            // Return the closest droppable within that container
            overId =
              closestCenter({
                ...args,
                droppableContainers: args.droppableContainers.filter(
                  (container) =>
                    container.id !== overId &&
                    containerItems.some(
                      (item) => item.userPlaceInfo.placeId === container.id,
                    ),
                ),
              })[0]?.id ?? containerId;
          }
        }

        lastOverId.current = overId;

        return [{ id: overId }];
      }

      // When a draggable item moves to a new container, the layout may shift
      // and the `overId` may become `null`. We manually set the cached `lastOverId`
      // to the id of the draggable item that was moved to the new container, otherwise
      // the previous `overId` will be returned which can cause items to incorrectly shift positions
      if (recentlyMovedToNewContainer.current) {
        lastOverId.current = activeId;
      }

      // If no droppable is matched, return the last match
      return lastOverId.current ? [{ id: lastOverId.current }] : [];
    },
    [activeId, places],
  );
  const [clonedItems, setClonedItems] = useState<PlaceData | null>(null);
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 50, tolerance: 4 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter,
    }),
  );
  const findContainer = (id: UniqueIdentifier) => {
    if (id in places) {
      return id;
    }

    return Object.keys(places).find((placesGroup) =>
      places[placesGroup].some((place) => place.userPlaceInfo.placeId === id),
    );
  };

  const getIndex = (id: UniqueIdentifier) => {
    const container = findContainer(id);

    if (!container) {
      return -1;
    }

    const index = places[container].findIndex(
      (placesGroup) => placesGroup.userPlaceInfo.placeId === id,
    );

    return index;
  };

  const onDragCancel = () => {
    if (clonedItems) {
      // Reset items to their original state in case items have been
      // Dragged across containers
      setPlaces(clonedItems);
    }

    setActiveId(null);
    setClonedItems(null);
  };

  function renderSortableItemDragOverlay(id: UniqueIdentifier) {
    return (
      <div className="size-10 bg-red-50"></div>
      // <PlaceDetailsSortWrapper
      //   isDragging
      //   dragOverlay
      // />
    );
  }

  function renderContainerDragOverlay(date: Date) {
    return <DayFolder date={date} isDragOverlay />;
  }

  useEffect(() => {
    requestAnimationFrame(() => {
      recentlyMovedToNewContainer.current = false;
    });
  }, []);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetectionStrategy}
      measuring={{
        droppable: {
          strategy: MeasuringStrategy.WhileDragging,
        },
      }}
      onDragStart={({ active }) => {
        setActiveId(active.id);
        setClonedItems(places);
      }}
      onDragOver={({ active, over }) => {
        const overId = over?.id;
        console.log("event fired");
        // If dragging a day folder, do nothing
        if (overId == null || active.id in places) {
          return;
        }

        const overContainer = findContainer(overId);
        const activeContainer = findContainer(active.id);

        if (!overContainer || !activeContainer) {
          return;
        }

        if (
          activeContainer !== overContainer &&
          (over?.data.current?.type !== "container" ||
            over?.data.current?.isOpen)
        ) {
          setPlaces((currentPlaces) => {
            const activeItems = currentPlaces[activeContainer];
            const overItems = currentPlaces[overContainer];
            const overIndex = overItems.findIndex(
              (item) => item.userPlaceInfo.placeId === overId,
            );
            const activeIndex = activeItems.findIndex(
              (item) => item.userPlaceInfo.placeId === active.id,
            );

            let newIndex: number;

            // Over a day or saved places
            if (overId in currentPlaces) {
              newIndex = overItems.length;
            } else {
              // dragging item is currently below the item we are dragging over
              const isBelowOverItem =
                over &&
                active.rect.current.translated &&
                active.rect.current.translated.top >
                  over.rect.top + over.rect.height / 2;

              const modifier = isBelowOverItem ? 1 : 0;

              // If cannot find the index, set as last item
              newIndex =
                overIndex >= 0 ? overIndex + modifier : overItems.length;
            }
            recentlyMovedToNewContainer.current = true;

            return {
              ...currentPlaces,
              [activeContainer]: currentPlaces[activeContainer].filter(
                (place) => place.userPlaceInfo.placeId !== active.id,
              ), // remove item from current container
              [overContainer]: [
                // and add item to new container at the index
                ...currentPlaces[overContainer].slice(0, newIndex),
                currentPlaces[activeContainer][activeIndex],
                ...currentPlaces[overContainer].slice(
                  newIndex,
                  currentPlaces[overContainer].length,
                ),
              ],
            };
          });
        }
      }}
      onDragEnd={({ active, over }) => {
        if (active.id in places && over?.id) {
          setDays((currentDays) => {
            const activeIndex = currentDays.findIndex(
              (day) => day.dayId === active.id,
            );
            const overIndex = currentDays.findIndex(
              (day) => day.dayId === over.id,
            );

            return arrayMove(currentDays, activeIndex, overIndex);
          });
          return;
        }

        const activeContainer = findContainer(active.id);

        if (!activeContainer) {
          setActiveId(null);
          return;
        }

        const overId = over?.id;

        if (overId == null) {
          setActiveId(null);
          return;
        }

        const overContainer = findContainer(overId);

        if (overContainer) {
          const activeIndex = places[activeContainer].findIndex(
            (place) => place.userPlaceInfo.placeId === active.id,
          );
          if (activeContainer !== overContainer) {
            setPlaces((currentPlaces) => ({
              ...currentPlaces,
              [activeContainer]: currentPlaces[activeContainer].filter(
                (place) => place.userPlaceInfo.placeId !== active.id,
              ), // remove item from current container
              [overContainer]: [
                ...currentPlaces[overContainer],
                currentPlaces[activeContainer][activeIndex],
              ],
            }));
          } else {
            const overIndex = places[overContainer].findIndex(
              (place) => place.userPlaceInfo.placeId === overId,
            );
            if (activeIndex !== overIndex) {
              setPlaces((currentPlaces) => ({
                ...currentPlaces,
                [overContainer]: arrayMove(
                  currentPlaces[overContainer],
                  activeIndex,
                  overIndex,
                ),
              }));
            }
          }
        }

        setActiveId(null);
      }}
      cancelDrop={cancelDrop}
      onDragCancel={onDragCancel}
    >
      <div className="flex flex-col gap-4">
        <SortableContext
          items={[SAVED_ID, ...days.map((day) => day.dayId)]}
          strategy={verticalListSortingStrategy}
        >
          <DroppableContainer
            id={SAVED_ID}
            disabled={isSortingContainer}
            items={places.saved.map((place) => place.userPlaceInfo.placeId!)}
            day={false}
          >
            <SortableContext
              items={places.saved.map((place) => place.userPlaceInfo.placeId!)}
              strategy={verticalListSortingStrategy}
            >
              {places.saved.map((place, index) => (
                <div
                  key={place.userPlaceInfo.placeId}
                  className={"relative ml-6 border-l-2 border-zinc-50 pl-6"}
                >
                  <div
                    className={`absolute left-0 top-0 flex size-8 -translate-x-1/2 items-center justify-center rounded-full border-2 border-zinc-50 bg-amber-300 text-sm font-medium text-amber-900 transition-opacity ${activeId ? "opacity-0" : ""}`}
                    aria-label={`Saved place ${index + 1}`}
                  >
                    {index + 1}
                  </div>
                  <SortableItem
                    data={place}
                    days={days}
                    startDate={startDate}
                    isAdmin={isAdmin}
                    disabled={isSortingContainer}
                    id={place.userPlaceInfo.placeId!}
                  />
                </div>
              ))}
            </SortableContext>
          </DroppableContainer>
          {days.map((day, index) => (
            <DroppableContainer
              day
              key={day.dayId}
              id={day.dayId}
              items={places[day.dayId].map(
                (place) => place.userPlaceInfo.placeId!,
              )}
              date={addDays(startDate, index)}
            >
              <SortableContext
                items={places[day.dayId].map(
                  (place) => place.userPlaceInfo.placeId!,
                )}
                strategy={verticalListSortingStrategy}
              >
                {places[day.dayId].map((place, index) => {
                  return (
                    <div
                      key={place.userPlaceInfo.placeId}
                      className={cn(
                        "relative ml-6 border-l-2 border-slate-700 pb-2 pl-6 transition [&:nth-last-child(2)]:border-transparent [&:nth-last-child(2)]:pb-0",
                        activeId && "border-transparent",
                      )}
                    >
                      <div
                        className={`absolute left-0 top-0 flex size-8 -translate-x-1/2 items-center justify-center rounded-full border-2 border-zinc-50 bg-amber-300 text-sm font-medium text-amber-900 transition-opacity ${activeId ? "opacity-0" : ""}`}
                        aria-label={`Saved place ${index + 1}`}
                      >
                        {index + 1}
                      </div>
                      <SortableItem
                        data={place}
                        days={days}
                        startDate={startDate}
                        isAdmin={isAdmin}
                        isInDay={day.dayId}
                        disabled={isSortingContainer}
                        id={place.userPlaceInfo.placeId!}
                      />
                    </div>
                  );
                })}
              </SortableContext>
            </DroppableContainer>
          ))}
        </SortableContext>
      </div>
      {createPortal(
        <DragOverlay dropAnimation={dropAnimation}>
          {activeId
            ? dayData.some((day) => day.dayId === activeId)
              ? renderContainerDragOverlay(
                  addDays(
                    startDate,
                    days.findIndex((day) => day.dayId === activeId),
                  ),
                )
              : renderSortableItemDragOverlay(activeId)
            : null}
        </DragOverlay>,
        document.body,
      )}
    </DndContext>
  );
}
