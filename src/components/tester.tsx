"use client";

import { toast } from "sonner";
import { Button } from "./ui/button";

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
    </>
  );
};

export default Tester;
