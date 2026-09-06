import { useEffect, useState } from "react";
import QRCode from "qrcode";

export function WalletQr({ value }: { value: string }) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(value, {
      margin: 1,
      width: 320,
      errorCorrectionLevel: "M",
      color: { dark: "#0c1210", light: "#f4f7f4" },
    })
      .then((url) => {
        if (!cancelled) setSrc(url);
      })
      .catch(() => {
        if (!cancelled) setSrc(null);
      });
    return () => {
      cancelled = true;
    };
  }, [value]);

  if (!src) {
    return <div className="size-full rounded-md bg-paper" aria-hidden />;
  }

  return (
    <img
      src={src}
      alt="House wallet QR code"
      className="size-full"
      width={280}
      height={280}
    />
  );
}
