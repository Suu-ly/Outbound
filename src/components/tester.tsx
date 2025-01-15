"use client";

import { toast } from "sonner";
import { Button } from "./ui/button";
import DrawerDialog from "./ui/drawer-dialog";

const Tester = () => {
  return (
    <>
      <Button
        onClick={() =>
          toast("Hello world", {
            description: "This is a test",
            action: {
              label: "Undo",
              onClick: () => console.log("Undo"),
            },
          })
        }
      >
        Toast Normal
      </Button>
      <Button onClick={() => toast.error("This is an error")}>
        Toast error
      </Button>
      <Button
        onClick={() =>
          toast.success("This is an success", { description: "Event created" })
        }
      >
        Toast success
      </Button>
      <Button
        onClick={() =>
          toast.warning("This is an warning", { description: "Event created" })
        }
      >
        Toast warning
      </Button>
      <DrawerDialog
        header="Responsive Dialog"
        content={
          "This is to tell you that there is a certain action that will happen and is asking you to confirm."
        }
        mainActionLabel="Confirm"
        onMainAction={(close) => close()}
        destructive
      >
        <Button size="large">Open Drawer Dialog</Button>
      </DrawerDialog>
    </>
  );
};

export default Tester;
