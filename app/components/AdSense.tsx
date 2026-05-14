"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

type Props = {
  slot: string;
  format?: string;
  responsive?: boolean;
  style?: React.CSSProperties;
  className?: string;
};

export function AdSense({
  slot,
  format = "auto",
  responsive = true,
  style,
  className,
}: Props) {
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
  const enabled = Boolean(client && slot);

  useEffect(() => {
    if (!enabled) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // AdSense script may not be loaded yet (e.g. ad blocker). Silently ignore.
    }
  }, [enabled]);

  if (!enabled) {
    return (
      <div
        className={`grid place-items-center text-[10px] text-neutral-500 ${className ?? ""}`}
        style={style}
      >
        広告枠 (未設定)
      </div>
    );
  }

  return (
    <ins
      className={`adsbygoogle ${className ?? ""}`}
      style={{ display: "block", ...style }}
      data-ad-client={client}
      data-ad-slot={slot}
      data-ad-format={format}
      data-full-width-responsive={responsive ? "true" : "false"}
    />
  );
}
