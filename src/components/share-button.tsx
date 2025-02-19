import useCopyToClipboard from "@/lib/use-copy-to-clipboard";
import { IconCheck, IconShare } from "@tabler/icons-react";
import { useCallback } from "react";
import { toast } from "sonner";
import { Button, ButtonProps } from "./ui/button";
import { DropdownMenuItem } from "./ui/dropdown-menu";

type ShareButtonProps = {
  link: string;
  label?: string;
  isDropdown?: boolean;
};

export default function ShareButton({
  link,
  label = "Share",
  isDropdown,
  ...rest
}: ShareButtonProps & ButtonProps) {
  const [copied, copyToClipboard] = useCopyToClipboard();
  const onCopy = useCallback(() => {
    copyToClipboard(link);
    toast.success("Google place link copied to clipboard!", {
      id: "CopyToClipboard",
    });
  }, [copyToClipboard, link]);

  if (isDropdown)
    return (
      <DropdownMenuItem onClick={onCopy}>
        <IconShare />
        Share
      </DropdownMenuItem>
    );

  return (
    <Button
      size="small"
      variant="ghost"
      onClick={onCopy}
      iconOnly
      aria-label={label}
      {...rest}
    >
      {copied ? <IconCheck /> : <IconShare />}
    </Button>
  );
}
