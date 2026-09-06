import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function CopyButton({
  value,
  className,
  size = "icon",
  variant = "secondary",
  label,
}: {
  value: string;
  className?: string;
  size?: ButtonProps["size"];
  variant?: ButtonProps["variant"];
  label?: string;
}) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  const copyLabel = label ?? t("copy");

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const el = document.createElement("textarea");
      el.value = value;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={onCopy}
      className={cn(className)}
      aria-label={copied ? t("copied") : copyLabel}
    >
      {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
      {size !== "icon" ? <span>{copied ? t("copied") : copyLabel}</span> : null}
    </Button>
  );
}
