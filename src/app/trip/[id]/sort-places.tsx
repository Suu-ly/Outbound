"use client";

import DayFolder from "@/app/trip/[id]/day-folder";
import { PlaceDetailsCompactProps } from "@/app/trip/[id]/place-details-compact";
import { Button } from "@/components/ui/button";
import ButtonLink from "@/components/ui/button-link";
import DrawerDialog from "@/components/ui/drawer-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { markerColorLookup } from "@/lib/color-lookups";
import {
  cn,
  getStartingIndex,
  insertAfter,
  insertBefore,
  insertBetween,
} from "@/lib/utils";
import {
  setPlaceAsUninterested,
  updateTripDayOrder,
  updateTripPlaceNote,
  updateTripPlaceOrder,
} from "@/server/actions";
import { PlaceData, PlaceDataEntry } from "@/server/types";
import {
  closestCenter,
  CollisionDetection,
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
import { Portal } from "@radix-ui/react-portal";
import { IconMapPinSearch, IconWand } from "@tabler/icons-react";
import { addDays } from "date-fns";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import React, {
  Dispatch,
  ReactNode,
  SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import { dayPlacesAtom, tripPlacesAtom, tripStartDateAtom } from "../atoms";
import PlaceDetailsSkeletonLoader from "./place-details-skeleton-loader";
import PlaceDetailsSortWrapper from "./place-details-sort-wrapper";
import TravelTimeIndicator from "./travel-time-indicator";
import TravelTimeSelect from "./travel-time-select";

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
        // Do not set container as valid target if children are inside
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
  onRemove: (isInDay: number | string, placeId: string) => void;
  handleMove: (
    isInDay: number | string,
    data: PlaceDataEntry,
    newDay: number | string,
  ) => void;
  handleNoteChange: (
    isInDay: number | string,
    placeId: string,
    note: string,
  ) => void;
  children?: ReactNode;
} & PlaceDetailsCompactProps;

function SortableItem({
  disabled,
  id,
  data,
  children,
  ...rest
}: SortableItemProps) {
  const { setNodeRef, listeners, isDragging, transform, transition } =
    useSortable({
      id,
      data: { data: data },
    });
  const mounted = useMountStatus();
  const mountedWhileDragging = isDragging && !mounted;

  return (
    <PlaceDetailsSortWrapper
      ref={disabled ? undefined : setNodeRef}
      {...rest}
      isDragging={isDragging}
      style={{
        transition,
        transform: CSS.Translate.toString(transform),
      }}
      data={data}
      fadeIn={mountedWhileDragging}
      listeners={listeners}
    >
      {children}
    </PlaceDetailsSortWrapper>
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
      handleMove: (
        isInDay: number | string,
        data: PlaceDataEntry,
        newDay: number | string,
      ) => void;
      setLoadingState: Dispatch<
        SetStateAction<Record<keyof PlaceData, string[]>>
      >;
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
  const [open, setOpen] = useState(true);
  const timer = useRef<NodeJS.Timeout>(null);
  const {
    active,
    attributes,
    isDragging,
    listeners,
    over,
    setNodeRef,
    transform,
    transition,
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
  const setPlaces = useSetAtom(tripPlacesAtom);

  useEffect(() => {
    if (isOverContainer && !open)
      timer.current = setTimeout(() => {
        setOpen(true);
        // Force item into container once opened for empty folders
        if (items.length === 0)
          setPlaces((currentPlaces) => {
            let activeIndex = 0;
            const activeContainer = Object.keys(currentPlaces).find(
              (placesGroup) => {
                activeIndex = currentPlaces[placesGroup].findIndex(
                  (place) => place.placeInfo.placeId === active?.id,
                );
                return activeIndex !== -1;
              },
            );
            if (!activeContainer) return currentPlaces;
            return {
              ...currentPlaces,
              [activeContainer]: currentPlaces[activeContainer].filter(
                (place) => place.placeInfo.placeId !== active?.id,
              ),
              [over!.id]: [
                ...currentPlaces[over!.id],
                currentPlaces[activeContainer][activeIndex],
              ],
            };
          });
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
        transition,
        transform: CSS.Translate.toString(transform),
      }}
      dayId={id}
      isOpen={open && !isDragging}
      onOpenChange={setOpen}
      isDragging={isDragging}
      hover={isOverContainer}
      handleMove={rest.handleMove}
      setLoadingState={rest.setLoadingState}
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
  duration: 300,
  easing: "cubic-bezier(.45,1.3,.3,1)",
  sideEffects: (params) => {
    const div = params.dragOverlay.node.querySelector(
      "div[data-drag-node='true']",
    );
    if (!div) return;
    div.animate(
      [
        {
          boxShadow:
            "0px 10px 15px -3px rgb(0, 0, 0, 0.1), 0px 4px 6px -4px rgb(0, 0, 0, 0.1)",
        },
        {
          boxShadow:
            "-1px 0 15px 0 rgba(34, 33, 81, 0), 0px 15px 15px 0 rgba(34, 33, 81, 0)",
        },
      ],
      {
        duration: 300,
        easing: "cubic-bezier(.45,1.3,.3,1)",
        fill: "forwards",
      },
    );
  },
};
const SAVED_ID = "saved";

export default function SortPlaces({ tripId }: { tripId: string }) {
  const [places, setPlaces] = useAtom(tripPlacesAtom);
  const [clonedItems, setClonedItems] = useState<PlaceData | null>(null);
  const [days, setDays] = useAtom(dayPlacesAtom);

  const startDate = useAtomValue(tripStartDateAtom);

  const [toBeRemoved, setToBeRemoved] = useState<{
    isInDay: string | number;
    placeId: string;
  }>();
  const [isRemovingPlace, setIsRemovingPlace] = useState(false);
  const [loadingState, setLoadingState] = useState<
    Record<keyof typeof places, string[]>
  >({});

  const [activeId, setActiveId] = useState<{
    id: UniqueIdentifier;
    data: PlaceDataEntry;
  } | null>(null);
  const lastOverId = useRef<UniqueIdentifier | null>(null);
  const recentlyMovedToNewContainer = useRef(false);
  const isSortingContainer =
    activeId != null ? days.some((day) => day.dayId === activeId.id) : false;

  /**
   * Custom collision detection strategy optimized for multiple containers
   *
   * - First, find any droppable containers intersecting with the pointer.
   * - If there are none, find intersecting containers with the active draggable.
   * - If there are no intersecting containers, return the last matched intersection
   *
   */
  // TODO FIX THE KEYBOARD MOVEMENT!
  const collisionDetectionStrategy: CollisionDetection = useCallback(
    (args) => {
      if (activeId && activeId.id in places) {
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
                      (item) => item.placeInfo.placeId === container.id,
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
        lastOverId.current = activeId ? activeId.id : activeId;
      }

      // If no droppable is matched, return the last match
      return lastOverId.current ? [{ id: lastOverId.current }] : [];
    },
    [activeId, places],
  );
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
      places[placesGroup].some((place) => place.placeInfo.placeId === id),
    );
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

  const removePlace = useCallback(
    async (isInDay: number | string, placeId: string) => {
      setIsRemovingPlace(true);
      const response = await setPlaceAsUninterested(placeId, tripId);
      if (response.status === "error") toast.error(response.message);
      else
        setPlaces((prev) => ({
          ...prev,
          [isInDay]: prev[isInDay].filter(
            (place) => place.placeInfo.placeId !== placeId,
          ),
        }));
      setIsRemovingPlace(false);
    },
    [setPlaces, tripId],
  );

  const onRemove = useCallback((isInDay: number | string, placeId: string) => {
    setToBeRemoved({
      isInDay: isInDay,
      placeId: placeId,
    });
  }, []);

  const handleMove = useCallback(
    (
      isInDay: number | string,
      data: PlaceDataEntry,
      newDay: number | string,
    ) => {
      const newOrder =
        places[newDay].length > 0
          ? insertAfter(
              places[newDay][places[newDay].length - 1].userPlaceInfo.tripOrder,
            )
          : getStartingIndex(); // No items in day
      setPlaces((prev) => ({
        ...prev,
        [isInDay]: prev[isInDay].filter(
          (place) => place.placeInfo.placeId !== data.placeInfo.placeId,
        ), // Remove from current day
        [newDay]: [
          ...prev[newDay],
          {
            placeInfo: data.placeInfo,
            userPlaceInfo: {
              ...data.userPlaceInfo,
              tripOrder: newOrder,
            },
          },
        ], // Add to the end of the new day with updated details
      }));
      console.log("Handlemove New order", newOrder);
      updateTripPlaceOrder(
        tripId,
        data.placeInfo.placeId,
        newOrder,
        newDay !== "saved" ? Number(newDay) : null,
      ).then((data) => {
        if (data.status === "error") toast.error(data.message);
      });
    },

    [places, setPlaces, tripId],
  );

  const handleNoteChange = useCallback(
    (isInDay: number | string, placeId: string, note: string) => {
      // update note value in places state
      let newNote = false;
      setPlaces((prev) => ({
        ...prev,
        [isInDay]: [
          ...prev[isInDay].map((place) => {
            if (place.placeInfo.placeId !== placeId) return place;
            // Null and "" are not the same but functionally they are, so we do this check to make sure
            // we do not consider it a new note
            if (
              place.userPlaceInfo.note !== note &&
              (place.userPlaceInfo.note !== null || note !== "")
            )
              newNote = true;
            return {
              placeInfo: place.placeInfo,
              userPlaceInfo: {
                ...place.userPlaceInfo,
                note: note,
              },
            };
          }),
        ],
      }));
      if (newNote) updateTripPlaceNote(tripId, placeId, note ? note : null);
    },
    [setPlaces, tripId],
  );

  function renderSortableItemDragOverlay(data: PlaceDataEntry) {
    return <PlaceDetailsSortWrapper isDragOverlay data={data} />;
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
      id="Sort-places-dnd-context"
      sensors={sensors}
      collisionDetection={collisionDetectionStrategy}
      measuring={{
        droppable: {
          strategy: MeasuringStrategy.WhileDragging,
        },
      }}
      onDragStart={({ active }) => {
        setActiveId({ id: active.id, data: active.data.current?.data });
        setClonedItems(places);
      }}
      onDragOver={({ active, over }) => {
        const overId = over?.id;
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
              (item) => item.placeInfo.placeId === overId,
            );
            const activeIndex = activeItems.findIndex(
              (item) => item.placeInfo.placeId === active.id,
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
                (place) => place.placeInfo.placeId !== active.id,
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
        setActiveId(null);
        // Dragging a day
        if (active.id in places && over?.id) {
          const activeIndex = days.findIndex((day) => day.dayId === active.id);
          const overIndex = days.findIndex((day) => day.dayId === over.id);
          // Nothing changed
          if (activeIndex === overIndex) return;
          let newOrder = "";
          // Is not the first or last element in the new array
          if (overIndex > 0 && overIndex < days.length - 1) {
            if (activeIndex > overIndex)
              newOrder = insertBetween(
                days[overIndex - 1].dayOrder,
                days[overIndex].dayOrder,
              );
            else
              newOrder = insertBetween(
                days[overIndex].dayOrder,
                days[overIndex + 1].dayOrder,
              );
          } else if (overIndex === 0) {
            newOrder = insertBefore(days[0].dayOrder);
          } else if (overIndex === days.length - 1) {
            newOrder = insertAfter(days[overIndex].dayOrder);
          }
          setDays((currentDays) => {
            currentDays[activeIndex] = {
              ...currentDays[activeIndex],
              dayOrder: newOrder,
            };
            return arrayMove(currentDays, activeIndex, overIndex);
          });
          updateTripDayOrder(tripId, Number(active.id), newOrder).then(
            (data) => {
              if (data.status === "error") toast.error(data.message);
            },
          );
          return;
        }

        const activeContainer = findContainer(active.id);

        if (!activeContainer) {
          return;
        }

        const overId = over?.id;

        if (overId == null) {
          return;
        }

        const overContainer = findContainer(overId);

        // Dragging a place
        if (overContainer) {
          const activeIndex = places[activeContainer].findIndex(
            (place) => place.placeInfo.placeId === active.id,
          );
          const overIndex = places[overContainer].findIndex(
            (place) => place.placeInfo.placeId === overId,
          );
          console.log(
            "Containers and indexes",
            activeContainer,
            activeIndex,
            overContainer,
            overIndex,
          );

          // Nothing happened
          if (
            activeContainer === overContainer &&
            clonedItems &&
            clonedItems[overContainer].length > overIndex && // Prevent out of bounds error
            clonedItems[overContainer][overIndex].placeInfo.placeId ===
              active.id
          ) {
            setPlaces(clonedItems);
            return;
          }

          let newOrder = "";
          const overPlaces = places[overContainer];
          const getOrder = (index: number) =>
            overPlaces[index].userPlaceInfo.tripOrder;
          // As we update the state when we drag over, the currently dragging item will be in the
          // same container as the over item, with the exception of dropping in a day folder
          // before it is open

          // Is not the first or last element in the new array
          if (overIndex > 0 && overIndex < places[overContainer].length - 1) {
            if (activeIndex > overIndex)
              // overIndex moves down to make space
              newOrder = insertBetween(
                getOrder(overIndex - 1),
                getOrder(overIndex),
              );
            else if (activeIndex < overIndex)
              // overIndex moves up to make space
              newOrder = insertBetween(
                getOrder(overIndex),
                getOrder(overIndex + 1),
              );
            else
              // Item is inserted at this index
              newOrder = insertBetween(
                getOrder(overIndex - 1),
                getOrder(overIndex + 1),
              );

            // Is the first item in the array
          } else if (overIndex === 0) {
            // Container is not previously empty
            if (overPlaces.length > 1) {
              if (overIndex !== activeIndex)
                // Place at index 0 moves down to make space
                newOrder = insertBefore(getOrder(0));
              // Place is inserted at 0 index, previous first element is now index 1
              else newOrder = insertBefore(getOrder(1));
            } else newOrder = getStartingIndex(); // Only item in day

            // Is the last item in the array and the array is not empty
          } else if (overIndex === overPlaces.length - 1 && overIndex > 0) {
            if (activeIndex !== overIndex)
              // Item at last index moves up to make space
              newOrder = insertAfter(getOrder(overIndex));
            else
              // Item is inserted at last index
              newOrder = insertAfter(getOrder(overIndex - 1));

            // Item is over a closed day folder
          } else {
            if (overPlaces.length > 0)
              newOrder = insertAfter(
                getOrder(places[overContainer].length - 1),
              );
            else newOrder = getStartingIndex();
          }
          console.log("New order", newOrder);

          if (activeContainer !== overContainer) {
            setPlaces((currentPlaces) => ({
              ...currentPlaces,
              [activeContainer]: currentPlaces[activeContainer].filter(
                (place) => place.placeInfo.placeId !== active.id,
              ), // remove item from current container
              [overContainer]: [
                ...currentPlaces[overContainer],
                {
                  placeInfo:
                    currentPlaces[activeContainer][activeIndex].placeInfo,
                  userPlaceInfo: {
                    ...currentPlaces[activeContainer][activeIndex]
                      .userPlaceInfo,
                    tripOrder: newOrder,
                  },
                },
              ], // add place to the end of the array with new order
            }));
          } else {
            setPlaces((currentPlaces) => {
              currentPlaces[overContainer][activeIndex] = {
                placeInfo: currentPlaces[overContainer][activeIndex].placeInfo,
                userPlaceInfo: {
                  ...currentPlaces[overContainer][activeIndex].userPlaceInfo,
                  tripOrder: newOrder,
                },
              };

              return {
                ...currentPlaces,
                [overContainer]: arrayMove(
                  currentPlaces[overContainer],
                  activeIndex,
                  overIndex,
                ),
              };
            });
          }
          updateTripPlaceOrder(
            tripId,
            String(active.id),
            newOrder,
            overContainer !== "saved" ? Number(overContainer) : null,
          ).then((data) => {
            if (data.status === "error") toast.error(data.message);
          });
        }
      }}
      onDragCancel={onDragCancel}
    >
      <div className="flex flex-col gap-4">
        <SortableContext
          items={[SAVED_ID, ...days.map((day) => day.dayId)]}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex justify-between gap-3">
            <h3 className="font-display text-2xl font-medium">Saved Places</h3>
            <Tooltip>
              <TooltipTrigger asChild>
                <ButtonLink
                  href={`/trip/${tripId}/discover`}
                  size="small"
                  variant="secondary"
                  iconOnly
                  aria-label="Discover places"
                >
                  <IconMapPinSearch />
                </ButtonLink>
              </TooltipTrigger>
              <TooltipContent>Discover places</TooltipContent>
            </Tooltip>
          </div>
          <DroppableContainer
            id={SAVED_ID}
            disabled={isSortingContainer}
            items={places.saved.map((place) => place.placeInfo.placeId!)}
            day={false}
          >
            <SortableContext
              items={places.saved.map((place) => place.placeInfo.placeId!)}
              strategy={verticalListSortingStrategy}
            >
              {places.saved.map((place, index) => (
                <div
                  key={place.placeInfo.placeId}
                  className={"relative ml-5 border-l-2 border-zinc-50 pl-6"}
                >
                  <div
                    className={`absolute -left-px top-0 flex size-8 -translate-x-1/2 items-center justify-center rounded-full border-2 border-zinc-50 bg-amber-300 text-sm font-medium text-amber-900 transition-opacity ${activeId && !isSortingContainer ? "opacity-0" : ""}`}
                    aria-label={`Saved place ${index + 1}`}
                  >
                    {index + 1}
                  </div>
                  <SortableItem
                    data={place}
                    disabled={isSortingContainer}
                    id={place.placeInfo.placeId!}
                    onRemove={onRemove}
                    handleMove={handleMove}
                    handleNoteChange={handleNoteChange}
                  />
                </div>
              ))}
            </SortableContext>
          </DroppableContainer>
          <div className="flex justify-between gap-3">
            <h3 className="font-display text-2xl font-medium">Itinerary</h3>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="small"
                  variant="secondary"
                  iconOnly
                  aria-label="Generate itinerary"
                >
                  <IconWand />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Generate itinerary</TooltipContent>
            </Tooltip>
          </div>
          {days.map((day, dayIndex) => (
            <DroppableContainer
              day
              key={day.dayId}
              id={day.dayId}
              items={places[day.dayId].map((place) => place.placeInfo.placeId!)}
              date={addDays(startDate, dayIndex)}
              handleMove={handleMove}
              setLoadingState={setLoadingState}
            >
              <SortableContext
                items={places[day.dayId].map(
                  (place) => place.placeInfo.placeId!,
                )}
                strategy={verticalListSortingStrategy}
              >
                {places[day.dayId].map((place, index) => {
                  return (
                    <div
                      key={place.placeInfo.placeId}
                      className={cn(
                        "relative ml-5 border-l-2 border-slate-700 pb-2 pl-6 transition [&:nth-last-child(2)]:border-transparent [&:nth-last-child(2)]:pb-0",
                        activeId && !isSortingContainer && "border-transparent",
                      )}
                    >
                      <div
                        className={`absolute -left-px top-0 flex size-8 -translate-x-1/2 items-center justify-center rounded-full border-2 border-zinc-50 text-sm font-medium transition-opacity ${activeId && !isSortingContainer ? "opacity-0" : ""} ${markerColorLookup[dayIndex % markerColorLookup.length]}`}
                        aria-label={`Saved place ${index + 1}`}
                      >
                        {index + 1}
                      </div>
                      <TravelTimeIndicator
                        places={places[day.dayId]}
                        index={index}
                        startTime={day.dayStartTime}
                        shouldHide={Boolean(activeId && !isSortingContainer)}
                      />
                      <SortableItem
                        data={place}
                        isInDay={day.dayId}
                        disabled={isSortingContainer}
                        id={place.placeInfo.placeId!}
                        date={addDays(startDate, dayIndex)}
                        onRemove={onRemove}
                        handleMove={handleMove}
                        handleNoteChange={handleNoteChange}
                      >
                        {index < places[day.dayId].length - 1 && ( // Not the last item
                          <TravelTimeSelect
                            fromId={place.placeInfo.placeId}
                            fromCoords={place.placeInfo.location}
                            toId={
                              places[day.dayId][index + 1].placeInfo.placeId
                            }
                            toCoords={
                              places[day.dayId][index + 1].placeInfo.location
                            }
                            tripId={tripId}
                            isDragging={Boolean(
                              activeId && !isSortingContainer,
                            )}
                          />
                        )}
                      </SortableItem>
                      {/* <TravelTimeIndicator
                        places={places[day.dayId]}
                        index={index}
                        startTime={day.dayStartTime}
                        shouldHide={Boolean(activeId && !isSortingContainer)}
                        bottom
                      /> */}
                    </div>
                  );
                })}
              </SortableContext>
              {loadingState[day.dayId]?.map((id) => (
                <PlaceDetailsSkeletonLoader key={`${id}loader`} />
              ))}
            </DroppableContainer>
          ))}
        </SortableContext>
      </div>
      <Portal>
        <DragOverlay dropAnimation={dropAnimation} zIndex={50}>
          {activeId
            ? days.some((day) => day.dayId === activeId.id)
              ? renderContainerDragOverlay(
                  addDays(
                    startDate,
                    days.findIndex((day) => day.dayId === activeId.id),
                  ),
                )
              : renderSortableItemDragOverlay(activeId.data)
            : null}
        </DragOverlay>
      </Portal>
      <DrawerDialog
        open={!!toBeRemoved}
        loading={isRemovingPlace}
        onOpenChange={(open) => !open && setToBeRemoved(undefined)}
        header="Remove from saved places?"
        content={
          "To undo this action, you can go to the “View Skipped Places” page."
        }
        mainActionLabel="Remove"
        onMainAction={() => {
          if (toBeRemoved)
            removePlace(toBeRemoved.isInDay, toBeRemoved.placeId).then(() =>
              setToBeRemoved(undefined),
            );
          else setToBeRemoved(undefined);
        }}
        destructive
      />
    </DndContext>
  );
}
