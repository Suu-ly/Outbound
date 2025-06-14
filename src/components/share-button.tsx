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
  message?: string;
  onAction?: () => void;
};

function isMobile() {
  return /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(
    navigator.userAgent,
  );
}

export default function ShareButton({
  link,
  label = "Share",
  isDropdown,
  message = "Link copied to clipboard!",
  className,
  onAction,
  ...rest
}: ShareButtonProps & ButtonProps) {
  const [copied, copyToClipboard] = useCopyToClipboard();
  const onCopy = useCallback(async () => {
    if (isMobile() && navigator.canShare && navigator.canShare({ url: link })) {
      try {
        await navigator.share({ url: link });
        return;
      } catch {
        console.log("Share API error, copying to clipboard instead.");
      }
    }
    copyToClipboard(link);
    toast.success(message, {
      id: link,
    });
  }, [copyToClipboard, link, message]);

  if (isDropdown)
    return (
      <DropdownMenuItem
        onSelect={onAction ? onAction : onCopy}
        className={className}
      >
        <IconShare />
        Share
      </DropdownMenuItem>
    );

  return (
    <Button
      size="small"
      variant="ghost"
      onClick={onAction ? onAction : onCopy}
      iconOnly
      aria-label={label}
      className={className}
      {...rest}
    >
      {copied ? <IconCheck /> : <IconShare />}
    </Button>
  );
}
