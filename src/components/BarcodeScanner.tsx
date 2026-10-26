"use client";

import { useEffect, useRef, useState } from "react";
import type { IScannerControls } from "@zxing/browser";
import { isBookBarcode, cleanIsbn } from "@/lib/isbn";

async function createReader() {
  const [{ BrowserMultiFormatReader }, { BarcodeFormat, DecodeHintType }] = await Promise.all([
    import("@zxing/browser"),
    import("@zxing/library"),
  ]);
  const hints = new Map();
  hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.EAN_13]);
  hints.set(DecodeHintType.TRY_HARDER, true);
  return new BrowserMultiFormatReader(hints);
}

type Props = { onDetected: (isbn: string) => void };

/** Live camera scanner for the EAN-13 barcode on the back of a book. */
export function CameraBarcodeScanner({ onDetected }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);

  useEffect(() => {
    let controls: IScannerControls | undefined;
    let cancelled = false;
    (async () => {
      try {
        const reader = await createReader();
        if (cancelled || !videoRef.current) return;
        controls = await reader.decodeFromConstraints(
          { video: { facingMode: "environment" } },
          videoRef.current,
          (result) => {
            if (!result) return;
            const code = result.getText();
            if (isBookBarcode(code)) {
              controls?.stop();
              onDetected(cleanIsbn(code));
            } else {
              setHint("That barcode isn't an ISBN — try the one with 978/979.");
            }
          },
        );
        if (cancelled) controls.stop();
      } catch (e) {
        setError(
          e instanceof Error && e.name === "NotAllowedError"
            ? "Camera permission was denied."
            : "Couldn't start the camera. Camera access needs HTTPS (or localhost).",
        );
      }
    })();
    return () => {
      cancelled = true;
      controls?.stop();
    };
  }, [onDetected]);

  if (error) return <p className="text-sm text-destructive">{error}</p>;
  return (
    <div className="flex flex-col gap-2">
      <div className="relative overflow-hidden rounded-lg bg-black">
        <video ref={videoRef} className="aspect-video w-full object-cover" muted playsInline />
        <div className="pointer-events-none absolute inset-x-8 top-1/2 h-0.5 -translate-y-1/2 bg-red-500/80" />
      </div>
      <p className="text-sm text-muted-foreground">
        {hint ?? "Point the camera at the barcode on the back cover."}
      </p>
    </div>
  );
}

/** Decodes the ISBN barcode from a photo (taken now or picked from the gallery). */
export function PhotoBarcodeReader({ onDetected }: Props) {
  const [status, setStatus] = useState<"idle" | "reading" | "failed">("idle");

  async function handleFile(file: File) {
    setStatus("reading");
    const url = URL.createObjectURL(file);
    try {
      const reader = await createReader();
      const result = await reader.decodeFromImageUrl(url);
      const code = result.getText();
      if (isBookBarcode(code)) {
        setStatus("idle");
        onDetected(cleanIsbn(code));
      } else {
        setStatus("failed");
      }
    } catch {
      setStatus("failed");
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <input
        type="file"
        accept="image/*"
        capture="environment"
        aria-label="Barcode photo"
        className="text-sm file:mr-3 file:rounded-md file:border file:bg-muted file:px-3 file:py-1.5 file:text-sm"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
        }}
      />
      {status === "reading" && <p className="text-sm text-muted-foreground">Reading barcode…</p>}
      {status === "failed" && (
        <p className="text-sm text-destructive">
          No ISBN barcode found. Try a sharper, closer photo, or type the ISBN instead.
        </p>
      )}
    </div>
  );
}
