"use client";

import DrawerDialog from "@/components/ui/drawer-dialog";
import { Input } from "@/components/ui/input";
import useCopyToClipboard from "@/lib/use-copy-to-clipboard";
import {
  deleteTrip,
  updateTripName,
  updateTripPrivacy,
} from "@/server/actions";
import { useAtom, useAtomValue } from "jotai";
import { redirect, useParams } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import {
  changeTripNameDialogOpenAtom,
  deleteTripDialogOpenAtom,
  setToPublicDialogOpenAtom,
  tripDetailsAtom,
} from "../atoms";

const SetToPublicDialog = () => {
  const id = useParams<{ id: string }>().id;
  const basePath = `/trip/${id}`;
  const [setToPublicDialogOpen, setSetToPublicDialogOpen] = useAtom(
    setToPublicDialogOpenAtom,
  );
  const [tripDetails, setTripDetails] = useAtom(tripDetailsAtom);
  const [isLoading, setIsLoading] = useState(false);
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
      open={setToPublicDialogOpen}
      onOpenChange={setSetToPublicDialogOpen}
      header="Set trip to public?"
      description={
        "In order to share this trip, you have to make it public, meaning that anyone will be able to view your trip details from the link. \n\nYou can change this setting anytime in trip settings."
      }
      mainActionLabel="Set trip to public"
      loading={isLoading}
      onMainAction={async (close) => {
        setIsLoading(true);
        const res = await updateTripPrivacy(tripDetails.id, false);
        setIsLoading(false);
        if (res.status === "error") toast.error(res.message);
        else {
          setTripDetails((prev) => ({ ...prev, private: false }));
          onCopy(
            process.env.NEXT_PUBLIC_URL + basePath,
            "Trip link copied to clipboard!",
          );
        }
        close();
      }}
    />
  );
};

const EditTripNameDialog = () => {
  const [changeTripNameDialogOpen, setChangeTripNameDialogOpen] = useAtom(
    changeTripNameDialogOpenAtom,
  );
  const [tripDetails, setTripDetails] = useAtom(tripDetailsAtom);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  return (
    <DrawerDialog
      open={changeTripNameDialogOpen}
      onOpenChange={setChangeTripNameDialogOpen}
      header="Edit trip name"
      description="Rename this trip to something else."
      mainActionLabel="Rename"
      loading={isLoading}
      content={
        <Input
          ref={inputRef}
          defaultValue={tripDetails.name}
          disabled={isLoading}
          autoFocus
        />
      }
      onMainAction={async (close) => {
        const value = inputRef.current?.value;
        if (!value) return;
        setIsLoading(true);
        const res = await updateTripName(tripDetails.id, value);
        setIsLoading(false);
        if (res.status === "error") toast.error(res.message);
        else {
          setTripDetails((prev) => ({ ...prev, name: value }));
        }
        close();
      }}
    />
  );
};

const DeleteTripDialog = () => {
  const [deleteTripDialogOpen, setDeleteTripDialogOpen] = useAtom(
    deleteTripDialogOpenAtom,
  );
  const tripDetails = useAtomValue(tripDetailsAtom);
  const [isLoading, setIsLoading] = useState(false);

  return (
    <DrawerDialog
      open={deleteTripDialogOpen}
      onOpenChange={setDeleteTripDialogOpen}
      header={`Delete ${tripDetails.name}?`}
      description="This action cannot be undone!"
      mainActionLabel="Delete"
      loading={isLoading}
      destructive
      onMainAction={async () => {
        setIsLoading(true);
        const res = await deleteTrip(tripDetails.id);
        if (res.status === "error") {
          toast.error(res.message);
          setIsLoading(false);
        } else {
          redirect("/");
        }
      }}
    />
  );
};

export default function TripDialogs() {
  return (
    <>
      <SetToPublicDialog />
      <EditTripNameDialog />
      <DeleteTripDialog />
    </>
  );
}
