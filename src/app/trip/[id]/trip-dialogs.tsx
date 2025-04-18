"use client";

import DrawerDialog from "@/components/ui/drawer-dialog";
import { Input } from "@/components/ui/input";
import useCopyToClipboard from "@/lib/use-copy-to-clipboard";
import {
  deleteTrip,
  updateTripName,
  updateTripPrivacy,
} from "@/server/actions";
import { useAtom, useSetAtom } from "jotai";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  changeTripNameDialogOpenAtom,
  deleteTripDialogOpenAtom,
  setToPublicDialogOpenAtom,
  tripDetailsAtom,
} from "../atoms";

const SetToPublicDialog = ({
  onSetToPublicSuccess,
}: {
  onSetToPublicSuccess?: () => void;
}) => {
  const [setToPublicDialogOpen, setSetToPublicDialogOpen] = useAtom(
    setToPublicDialogOpenAtom,
  );
  const basePath = `/trip/${setToPublicDialogOpen?.tripId}`;
  const [isLoading, startLoading] = useTransition();
  const [, copyToClipboard] = useCopyToClipboard();
  const onCopy = useCallback(
    (link: string, message: string) => {
      copyToClipboard(link);
      toast.success(message, {
        id: link,
      });
    },
    [copyToClipboard],
  );

  return (
    <DrawerDialog
      open={!!setToPublicDialogOpen}
      onOpenChange={(open) => {
        if (!open) setSetToPublicDialogOpen(undefined);
      }}
      header="Set trip to public?"
      description={
        "In order to share this trip, you have to make it public, meaning that anyone will be able to view your trip details from the link. \n\nYou can change this setting anytime in trip settings."
      }
      mainActionLabel="Set trip to public"
      loading={isLoading}
      onMainAction={async (close) => {
        startLoading(async () => {
          if (!setToPublicDialogOpen) return;
          const res = await updateTripPrivacy(
            setToPublicDialogOpen.tripId,
            false,
          );
          if (res.status === "error") toast.error(res.message);
          else {
            if (onSetToPublicSuccess) onSetToPublicSuccess();
            onCopy(
              process.env.NEXT_PUBLIC_URL + basePath,
              "Trip link copied to clipboard!",
            );
          }
          close();
        });
      }}
    />
  );
};

const EditTripNameDialog = ({
  onEditNameSuccess,
}: {
  onEditNameSuccess?: (value: string) => void;
}) => {
  const [changeTripNameDialogOpen, setChangeTripNameDialogOpen] = useAtom(
    changeTripNameDialogOpenAtom,
  );
  const [isLoading, startLoading] = useTransition();
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  return (
    <DrawerDialog
      open={!!changeTripNameDialogOpen}
      onOpenChange={(open) => {
        if (!open) {
          setChangeTripNameDialogOpen(undefined);
          setError("");
        }
      }}
      header="Edit trip name"
      description="Rename this trip to something else."
      mainActionLabel="Rename"
      loading={isLoading}
      content={
        <>
          <Input
            ref={inputRef}
            defaultValue={changeTripNameDialogOpen?.currentName}
            onChange={(e) => {
              if (e.currentTarget.value.trim().length < 3)
                setError("Trip name must be at least 3 characters!");
              else setError("");
            }}
            disabled={isLoading}
          />
          <span className="mt-2 block text-center text-sm font-medium text-red-500">
            {error}
          </span>
        </>
      }
      onMainAction={async (close) => {
        startLoading(async () => {
          if (!changeTripNameDialogOpen) return;
          const value = inputRef.current?.value;
          if (!value || error) return;
          const trimmed = value.trim();
          if (trimmed === changeTripNameDialogOpen.currentName) {
            close();
            return;
          }
          const res = await updateTripName(
            changeTripNameDialogOpen.tripId,
            trimmed,
          );
          if (res.status === "error") toast.error(res.message);
          else if (onEditNameSuccess) {
            onEditNameSuccess(trimmed);
          }
          close();
        });
      }}
    />
  );
};

const DeleteTripDialog = () => {
  const [deleteTripDialogOpen, setDeleteTripDialogOpen] = useAtom(
    deleteTripDialogOpenAtom,
  );
  const [isLoading, startLoading] = useTransition();
  const router = useRouter();

  return (
    <DrawerDialog
      open={!!deleteTripDialogOpen}
      onOpenChange={(open) => {
        if (!open) setDeleteTripDialogOpen(undefined);
      }}
      header={`Delete ${deleteTripDialogOpen?.name}?`}
      description="This action cannot be undone!"
      mainActionLabel="Delete"
      loading={isLoading}
      destructive
      onMainAction={async (close) => {
        startLoading(async () => {
          if (!deleteTripDialogOpen) return;
          const res = await deleteTrip(deleteTripDialogOpen.tripId);
          if (res.status === "error") {
            toast.error(res.message);
          } else {
            close();
            router.replace("/");
          }
        });
      }}
    />
  );
};

export function TripDialogs({
  onSetToPublicSuccess,
  onEditNameSuccess,
}: {
  onSetToPublicSuccess?: () => void;
  onEditNameSuccess?: (value: string) => void;
}) {
  return (
    <>
      <SetToPublicDialog onSetToPublicSuccess={onSetToPublicSuccess} />
      <EditTripNameDialog onEditNameSuccess={onEditNameSuccess} />
      <DeleteTripDialog />
    </>
  );
}

export function TripPageDialogs() {
  const setTripDetails = useSetAtom(tripDetailsAtom);
  const onSetToPublicSuccess = () => {
    setTripDetails((prev) => ({ ...prev, private: false }));
  };
  const onEditNameSuccess = (value: string) => {
    setTripDetails((prev) => ({ ...prev, name: value }));
  };

  return (
    <TripDialogs
      onSetToPublicSuccess={onSetToPublicSuccess}
      onEditNameSuccess={onEditNameSuccess}
    />
  );
}
