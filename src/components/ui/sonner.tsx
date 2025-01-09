"use client";

import {
  IconAlertTriangle,
  IconCircleCheck,
  IconExclamationCircle,
  IconInfoCircle,
} from "@tabler/icons-react";
import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme={"light"}
      className="toaster group"
      gap={8}
      duration={5000}
      expand
      toastOptions={{
        classNames: {
          title: "font-sans text-sm leading-none",
          description:
            "font-sans text-sm text-slate-500 group-data-[type='success']:text-green-600 group-data-[type='error']:text-red-600 group-data-[type='warning']:text-orange-600 group-data-[type='info']:text-blue-600",
          toast:
            "border-slate-200 text-slate-700 bg-white shadow-lg rounded-lg p-4 group",
          actionButton:
            "bg-slate-700 text-zinc-50 hover:bg-slate-700/90 font-sans text-xs",
          cancelButton: "hover:bg-slate-100 text-slate-700 font-sans text-xs",
          error: "!bg-rose-50 !border-rose-200 !text-red-700",
          success: "!bg-emerald-50 !border-emerald-200 !text-green-700",
          warning: "!bg-amber-50 !border-amber-200 !text-orange-700",
          info: "!bg-sky-50 !border-sky-200 !text-blue-700",
          icon: "size-5 [&_svg]:size-5 mr-0",
        },
      }}
      icons={{
        error: <IconExclamationCircle />,
        success: <IconCircleCheck />,
        warning: <IconAlertTriangle />,
        info: <IconInfoCircle />,
      }}
      {...props}
    />
  );
};

export { Toaster };
