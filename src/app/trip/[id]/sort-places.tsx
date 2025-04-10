"use client";

import { PlaceDetailsCompactProps } from "@/app/trip/[id]/place-details-compact";
import TimePicker from "@/components/time-picker";
import { Button } from "@/components/ui/button";
import ButtonLink from "@/components/ui/button-link";
import DrawerDialog from "@/components/ui/drawer-dialog";
import Spinner from "@/components/ui/spinner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { markerColorLookup } from "@/lib/color-lookups";
import {
  cn,
  digitStringToMins,
  getElementId,
  getStartingIndex,
  insertAfter,
  insertBefore,
  insertBetween,
  minsTo24HourFormat,
} from "@/lib/utils";
import {
  generateItinerary,
  moveTripPlace,
  setPlaceAsUninterested,
  updateDayStartTime,
  updateTripDayOrder,
  updateTripPlaceNote,
  updateTripPlaceOrder,
  updateTripTimeSpent,
} from "@/server/actions";
import { DayData, PlaceData, PlaceDataEntry } from "@/server/types";
import {
  Active,
  AutoScrollActivator,
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
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Portal } from "@radix-ui/react-portal";
import { IconMapPinSearch, IconWand } from "@tabler/icons-react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import {
  Dispatch,
  ReactNode,
  SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import { toast } from "sonner";
import {
  dayPlacesAtom,
  isDraggingAtom,
  tripDetailsAtom,
  tripPlacesAtom,
} from "../atoms";
import {
  DayFolderSortWrapper,
  SavedPlacesWrapper,
} from "./day-folder-sort-wrapper";
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
type SortableItemProps = {
  id: UniqueIdentifier;
  disabled?: boolean;
  onRemove: (isInDay: number | "saved", placeId: string) => void;
  handleMove: (
    isInDay: number | "saved",
    data: PlaceDataEntry,
    newDay: number | "saved",
  ) => void;
  handleNoteChange: (
    isInDay: number | "saved",
    placeId: string,
    note: string,
  ) => void;
  handleDurationChange: (
    isInDay: number | "saved",
    placeId: string,
    timeSpent: number,
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
  const {
    setNodeRef,
    listeners,
    isDragging,
    transform,
    transition,
    isSorting,
  } = useSortable({
    id,
    data: { data: data },
    animateLayoutChanges: () => true,
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
        transform: isSorting ? undefined : CSS.Translate.toString(transform),
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
  items,
  ...rest
}:
  | {
      day: true;
      index: number;
      children: ReactNode;
      disabled?: boolean;
      id: number;
      items: UniqueIdentifier[];
      handleMove: (
        isInDay: number | "saved",
        data: PlaceDataEntry,
        newDay: number | "saved",
      ) => void;
      setLoadingState: Dispatch<
        SetStateAction<Record<keyof PlaceData, string[]>>
      >;
      startTimeChange: (dayId: number) => void;
    }
  | {
      day: false;
      children: ReactNode;
      disabled?: boolean;
      id: string;
      items: UniqueIdentifier[];
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
    id: rest.id,
    data: {
      type: "container",
      children: items,
      isOpen: open,
    },
    animateLayoutChanges: () => false,
  });
  const isOverContainer = over
    ? (rest.id === over.id && active?.data.current?.type !== "container") ||
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

  if (!rest.day)
    return (
      <SavedPlacesWrapper
        ref={disabled ? undefined : setNodeRef}
        hover={isOverContainer}
      >
        {children}
      </SavedPlacesWrapper>
    );

  return (
    <DayFolderSortWrapper
      ref={disabled ? undefined : setNodeRef}
      style={{
        transition,
        transform: CSS.Translate.toString(transform),
      }}
      dayId={rest.id}
      isOpen={open}
      onOpenChange={setOpen}
      isDragging={isDragging}
      hover={isOverContainer}
      handleProps={{
        ...attributes,
        ...listeners,
      }}
      {...rest}
    >
      {children}
    </DayFolderSortWrapper>
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
          boxShadow: "0 0 #0000",
        },
      ],
      {
        duration: 300,
        easing: "ease",
        fill: "forwards",
      },
    );
  },
};
const SAVED_ID = "saved";

export default function SortPlaces({ tripId }: { tripId: string }) {
  const defaultStartTime = useAtomValue(tripDetailsAtom).startTime;
  const [places, setPlaces] = useAtom(tripPlacesAtom);
  const [days, setDays] = useAtom(dayPlacesAtom);

  const [toBeRemoved, setToBeRemoved] = useState<{
    isInDay: string | number;
    placeId: string;
  }>();
  const [changingDayTime, setChangingDayTime] = useState<DayData>();
  const [isRemovingPlace, setIsRemovingPlace] = useState(false);
  const [loadingState, setLoadingState] = useState<
    Record<keyof typeof places, string[]>
  >({});
  const [isGenerating, startGeneration] = useTransition();
  const [regenerateDialogOpen, setRegenerateDialogOpen] = useState(false);
  const [activeId, setActiveId] = useState<Active | null>(null);
  const isSortingContainer = activeId?.data.current?.type === "container";
  const setIsDragging = useSetAtom(isDraggingAtom);

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

        return [{ id: overId }];
      }

      // No droppable is matched
      return [];
    },
    [activeId, places],
  );
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 4 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter,
    }),
  );
  const findContainerAndIndex = (id: UniqueIdentifier) => {
    if (id in places) {
      const index = days.findIndex((day) => day.dayId === id);
      return { container: id, index: index };
    }
    let index = 0;
    const container = Object.keys(places).find((placesGroup) => {
      index = places[placesGroup].findIndex(
        (place) => place.placeInfo.placeId === id,
      );
      return index !== -1;
    });

    return { container: container, index: index };
  };

  const onDragCancel = () => {
    setActiveId(null);
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
              tripOrder:
                prev[newDay].length > 0
                  ? insertAfter(
                      prev[newDay][prev[newDay].length - 1].userPlaceInfo
                        .tripOrder,
                    )
                  : getStartingIndex(),
            },
          },
        ], // Add to the end of the new day with updated details
      }));
      moveTripPlace(
        tripId,
        data.placeInfo.placeId,
        newDay !== "saved" ? Number(newDay) : null,
      ).then((data) => {
        if (data.status === "error") toast.error(data.message);
      });
    },

    [setPlaces, tripId],
  );

  const handleNoteChange = useCallback(
    (isInDay: number | string, placeId: string, note: string) => {
      // update note value in places state
      let newNote = false;
      setPlaces((prev) => ({
        ...prev,
        [isInDay]: prev[isInDay].map((place) => {
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
      }));
      if (newNote)
        updateTripPlaceNote(tripId, placeId, note ? note : null).then(
          (data) => {
            if (data.status === "error") toast.error(data.message);
          },
        );
    },
    [setPlaces, tripId],
  );

  const handleDurationChange = useCallback(
    (isInDay: number | string, placeId: string, timeSpent: number) => {
      let durationChanged = false;
      setPlaces((prev) => ({
        ...prev,
        [isInDay]: prev[isInDay].map((place) => {
          if (place.placeInfo.placeId !== placeId) return place;
          if (place.userPlaceInfo.timeSpent !== timeSpent)
            durationChanged = true;
          return {
            placeInfo: place.placeInfo,
            userPlaceInfo: {
              ...place.userPlaceInfo,
              timeSpent: timeSpent,
            },
          };
        }),
      }));
      if (durationChanged)
        updateTripTimeSpent(tripId, placeId, timeSpent).then((data) => {
          if (data.status === "error") toast.error(data.message);
        });
    },

    [setPlaces, tripId],
  );

  const setChangingDayFromIndex = useCallback(
    (dayId: number) => {
      const day = days.find((day) => day.dayId === dayId);
      if (!day) return;
      if (day.dayStartTime === "auto")
        setChangingDayTime({ ...day, dayStartTime: defaultStartTime });
      else setChangingDayTime(day);
    },
    [days, defaultStartTime],
  );

  const onChangeDayTimeConfirm = useCallback(
    (dayId: number, newTime: string) => {
      let timeChanged = false;
      setDays((prev) =>
        prev.map((day) => {
          if (day.dayId !== dayId) return day;
          if (day.dayStartTime !== newTime) timeChanged = true;
          return { ...day, dayStartTime: newTime };
        }),
      );
      if (timeChanged)
        updateDayStartTime(dayId, newTime).then((data) => {
          if (data.status === "error") toast.error(data.message);
        });
    },
    [setDays],
  );

  const handleGenerateItinerary = useCallback(async () => {
    if (
      !regenerateDialogOpen &&
      Object.entries(places).some(
        ([key, places]) => key !== "saved" && places.length,
      )
    ) {
      setRegenerateDialogOpen(true);
      return;
    }
    startGeneration(async () => {
      const res = await generateItinerary(tripId);
      if (res.status === "error") toast.error(res.message);
      else {
        toast.success("Itinerary generated successfully!");
        setDays(res.data.days);
        setPlaces(res.data.places);
        setRegenerateDialogOpen(false);
      }
    });
  }, [setDays, setPlaces, tripId, places, regenerateDialogOpen]);

  return (
    <DndContext
      id="Sort-places-dnd-context"
      autoScroll={{
        threshold: { y: 0.25, x: 0 },
        interval: 2,
        acceleration: 12,
        activator: AutoScrollActivator.Pointer,
      }}
      sensors={sensors}
      collisionDetection={collisionDetectionStrategy}
      measuring={{
        droppable: {
          strategy: MeasuringStrategy.WhileDragging,
        },
      }}
      onDragAbort={() => {
        setIsDragging(false);
      }}
      onDragStart={({ active }) => {
        setIsDragging(true);
        setActiveId(active);
      }}
      onDragEnd={({ active, over }) => {
        setActiveId(null);
        setIsDragging(false);
        // Dragging a day
        if (active.id in places && over?.id) {
          const activeIndex = days.findIndex((day) => day.dayId === active.id);
          const overIndex = days.findIndex((day) => day.dayId === over.id);
          // Nothing changed
          if (activeIndex === overIndex) return;
          let newOrder = "";
          if (activeIndex > overIndex) {
            // Over index moves DOWN to make space
            if (overIndex === 0) newOrder = insertBefore(days[0].dayOrder);
            else
              newOrder = insertBetween(
                days[overIndex - 1].dayOrder,
                days[overIndex].dayOrder,
              );
          } else {
            // Over index moves UP to make space
            if (overIndex === days.length - 1)
              newOrder = insertAfter(days[days.length - 1].dayOrder);
            else
              newOrder = insertBetween(
                days[overIndex].dayOrder,
                days[overIndex + 1].dayOrder,
              );
          }
          setDays((currentDays) => {
            const newArr = arrayMove(currentDays, activeIndex, overIndex);
            newArr[overIndex] = {
              ...newArr[overIndex],
              dayOrder: newOrder,
            };
            return newArr;
          });
          updateTripDayOrder(tripId, Number(active.id), newOrder).then(
            (data) => {
              if (data.status === "error") toast.error(data.message);
            },
          );
          return;
        }

        const { container: activeContainer, index: activeIndex } =
          findContainerAndIndex(active.id);

        if (!activeContainer || !over) return;
        const overId = over.id;

        const { container: overContainer, index: overIndex } =
          findContainerAndIndex(overId);

        if (!overContainer) return;

        // Nothing happened
        if (activeContainer === overContainer && overId === active.id) {
          return;
        }

        // Dragging a place
        let newOrder = "";
        const overPlaces = places[overContainer];
        const getOrder = (index: number) =>
          overPlaces[index].userPlaceInfo.tripOrder;

        let newIndex: number;
        // Is dragging item currently below the item we are dragging over
        const isBelowOverItem =
          active.rect.current.translated &&
          active.rect.current.translated.top >
            over.rect.top + (over.rect.height / 4 - 32);

        if (overId in places) {
          // Over a empty/closed day or saved places
          newIndex = overPlaces.length;
          if (overPlaces.length > 0)
            newOrder = insertAfter(getOrder(overPlaces.length - 1));
          else newOrder = getStartingIndex();
          setPlaces((currentPlaces) => ({
            ...currentPlaces,
            [activeContainer]: currentPlaces[activeContainer].filter(
              (place) => place.placeInfo.placeId !== active.id,
            ), // remove item from current container
            [overContainer]: [
              // and add item to new container at the end
              ...currentPlaces[overContainer],
              {
                ...currentPlaces[activeContainer][activeIndex],
                userPlaceInfo: {
                  ...currentPlaces[activeContainer][activeIndex].userPlaceInfo,
                  tripOrder: newOrder,
                },
              },
            ],
          }));
        } else if (activeContainer !== overContainer) {
          // If cannot find the index, set as last item
          newIndex =
            overIndex >= 0
              ? isBelowOverItem
                ? overIndex + 1
                : overIndex
              : overPlaces.length;

          if (newIndex > overIndex) {
            // Over index item moves UP to make space
            if (overIndex === overPlaces.length - 1)
              newOrder = insertAfter(getOrder(overPlaces.length - 1));
            else
              newOrder = insertBetween(
                getOrder(overIndex),
                getOrder(overIndex + 1),
              );
          } else {
            // Over index item moves DOWN to make space
            if (overIndex === 0) newOrder = insertBefore(getOrder(0));
            else
              newOrder = insertBetween(
                getOrder(overIndex - 1),
                getOrder(overIndex),
              );
          }
          setPlaces((currentPlaces) => ({
            ...currentPlaces,
            [activeContainer]: currentPlaces[activeContainer].filter(
              (place) => place.placeInfo.placeId !== active.id,
            ), // remove item from current container
            [overContainer]: [
              // and add item to new container at the index
              ...currentPlaces[overContainer].slice(0, newIndex),
              {
                ...currentPlaces[activeContainer][activeIndex],
                userPlaceInfo: {
                  ...currentPlaces[activeContainer][activeIndex].userPlaceInfo,
                  tripOrder: newOrder,
                },
              },
              ...currentPlaces[overContainer].slice(newIndex),
            ],
          }));
        } else {
          // Dragging within the same container
          if (activeIndex > overIndex)
            newIndex = isBelowOverItem ? overIndex + 1 : overIndex;
          else newIndex = isBelowOverItem ? overIndex : overIndex - 1;

          // Nothing happened
          if (activeIndex === newIndex) return;

          if (activeIndex > newIndex) {
            // Items move DOWN to make space
            if (newIndex === 0) newOrder = insertBefore(getOrder(0));
            else
              newOrder = insertBetween(
                getOrder(newIndex - 1),
                getOrder(newIndex),
              );
          } else {
            // Items move UP to make space
            if (newIndex === overPlaces.length - 1)
              newOrder = insertAfter(getOrder(overPlaces.length - 1));
            else
              newOrder = insertBetween(
                getOrder(newIndex),
                getOrder(newIndex + 1),
              );
          }
          setPlaces((currentPlaces) => {
            const newArr = arrayMove(
              currentPlaces[overContainer],
              activeIndex,
              newIndex,
            );
            newArr[newIndex] = {
              ...newArr[newIndex],
              userPlaceInfo: {
                ...newArr[newIndex].userPlaceInfo,
                tripOrder: newOrder,
              },
            };

            return {
              ...currentPlaces,
              [overContainer]: newArr,
            };
          });
        }
        console.log("New order", newOrder);
        updateTripPlaceOrder(
          tripId,
          String(active.id),
          newOrder,
          overContainer !== "saved" ? Number(overContainer) : null,
        ).then((data) => {
          if (data.status === "error") toast.error(data.message);
        });
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
                  className={"relative ml-5 border-l-2 border-gray-50 pl-6"}
                >
                  <div
                    className={`absolute -left-px top-0 flex size-8 -translate-x-1/2 items-center justify-center rounded-full border-2 border-gray-50 bg-amber-300 text-sm font-medium text-amber-900 transition-opacity ${activeId && !isSortingContainer ? "opacity-0" : ""}`}
                    aria-label={`Saved place ${index + 1}`}
                  >
                    {index + 1}
                  </div>
                  <SortableItem
                    data={place}
                    disabled={isSortingContainer}
                    id={place.placeInfo.placeId!}
                    elementId={getElementId("saved", index)}
                    onRemove={onRemove}
                    handleMove={handleMove}
                    handleNoteChange={handleNoteChange}
                    handleDurationChange={handleDurationChange}
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
                  disabled={isGenerating}
                  onClick={handleGenerateItinerary}
                >
                  {isGenerating ? <Spinner /> : <IconWand />}
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
              index={dayIndex}
              handleMove={handleMove}
              setLoadingState={setLoadingState}
              startTimeChange={setChangingDayFromIndex}
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
                        className={`absolute -left-px top-0 flex size-8 -translate-x-1/2 items-center justify-center rounded-full border-2 border-gray-50 text-sm font-medium transition-opacity ${activeId && !isSortingContainer ? "opacity-0" : ""} ${markerColorLookup[dayIndex % markerColorLookup.length].bg} ${markerColorLookup[dayIndex % markerColorLookup.length].text}`}
                        aria-label={`Saved place on day ${dayIndex + 1} ${index + 1}`}
                      >
                        {index + 1}
                      </div>
                      <TravelTimeIndicator
                        isInDay={day.dayId}
                        index={index}
                        startTime={day.dayStartTime}
                        shouldHide={Boolean(activeId && !isSortingContainer)}
                        startTimeClick={setChangingDayFromIndex}
                      />
                      <SortableItem
                        data={place}
                        isInDay={day.dayId}
                        disabled={isSortingContainer}
                        id={place.placeInfo.placeId!}
                        dayIndex={dayIndex}
                        elementId={getElementId("day", index, dayIndex)}
                        onRemove={onRemove}
                        handleMove={handleMove}
                        handleNoteChange={handleNoteChange}
                        handleDurationChange={handleDurationChange}
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
                            isDragging={Boolean(
                              activeId && !isSortingContainer,
                            )}
                          />
                        )}
                      </SortableItem>
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
          {activeId ? (
            days.some((day) => day.dayId === activeId.id) ? (
              <DayFolderSortWrapper
                index={days.findIndex((day) => day.dayId === activeId.id)}
                isDragOverlay
                isOpen={false}
              />
            ) : (
              <PlaceDetailsSortWrapper
                isDragOverlay
                data={activeId.data.current?.data}
              />
            )
          ) : null}
        </DragOverlay>
      </Portal>
      <DrawerDialog
        open={!!toBeRemoved}
        loading={isRemovingPlace}
        onOpenChange={(open) => !open && setToBeRemoved(undefined)}
        header="Remove from saved places?"
        description="To undo this action, you can go to the “View Skipped Places” page."
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
      <DrawerDialog
        open={regenerateDialogOpen}
        loading={isGenerating}
        onOpenChange={setRegenerateDialogOpen}
        header="Regenerate Itinerary?"
        description="This action will override your existing itinerary and all days will be reset to the trip's default day start time."
        mainActionLabel="Regenerate"
        onMainAction={handleGenerateItinerary}
        destructive
      />
      <TimePicker
        open={!!changingDayTime}
        onOpenChange={(open) => !open && setChangingDayTime(undefined)}
        header="Change start time"
        description="Change the time your day will start at."
        startHours={Math.floor(
          digitStringToMins(
            changingDayTime ? changingDayTime.dayStartTime : "0900",
          ) / 60,
        )}
        startMinutes={
          digitStringToMins(
            changingDayTime ? changingDayTime.dayStartTime : "0000",
          ) % 60
        }
        onConfirm={(close, hours, mins) => {
          if (!changingDayTime) return;
          if (
            minsTo24HourFormat(hours * 60 + mins).value !==
            changingDayTime.dayStartTime
          ) {
            onChangeDayTimeConfirm(
              changingDayTime.dayId,
              minsTo24HourFormat(hours * 60 + mins).value,
            );
          }
          close();
        }}
      />
    </DndContext>
  );
}
