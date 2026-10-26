"use client";

import { useEffect, useRef, useState } from "react";
import { FlashlightIcon, FlashlightOffIcon } from "lucide-react";
import type { IScannerControls } from "@zxing/browser";
import { Button } from "@/components/ui/button";
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

/** A short buzz on phones that support it, so you know the scan worked without looking. */
function buzz() {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(60);
}

/** Live camera scanner for the EAN-13 barcode on the back of a book. */
export function CameraBarcodeScanner({ onDetected }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const [torch, setTorch] = useState<"unsupported" | "off" | "on">("unsupported");

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
              buzz();
              onDetected(cleanIsbn(code));
            } else {
              setHint("That barcode isn't an ISBN — try the one with 978/979.");
            }
          },
        );
        if (cancelled) controls.stop();
        controlsRef.current = controls;
        // zxing only exposes switchTorch when the camera supports a flashlight
        if (controls.switchTorch) setTorch("off");
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
      {/* Tall viewfinder on phones (fills most of the screen), wide on larger screens */}
      <div className="relative -mx-4 overflow-hidden bg-black sm:mx-0 sm:rounded-lg">
        <video
          ref={videoRef}
          className="h-[60svh] w-full object-cover sm:aspect-video sm:h-auto"
          muted
          playsInline
        />
        <div className="pointer-events-none absolute inset-x-[12%] top-1/2 h-24 -translate-y-1/2 rounded-lg border-2 border-white/80 shadow-[0_0_0_100vmax_rgba(0,0,0,0.35)]" />
        <div className="pointer-events-none absolute inset-x-[15%] top-1/2 h-0.5 -translate-y-1/2 bg-red-500/80" />
        {torch !== "unsupported" && (
          <Button
            type="button"
            size="icon"
            variant="secondary"
            aria-label={torch === "on" ? "Turn flashlight off" : "Turn flashlight on"}
            aria-pressed={torch === "on"}
            className="absolute right-3 bottom-3 rounded-full"
            onClick={async () => {
              const next = torch === "on" ? "off" : "on";
              try {
                await controlsRef.current?.switchTorch?.(next === "on");
                setTorch(next);
              } catch {
                setTorch("unsupported");
              }
            }}
          >
            {torch === "on" ? <FlashlightOffIcon /> : <FlashlightIcon />}
          </Button>
        )}
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
        buzz();
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
        className="text-sm file:mr-3 file:rounded-md file:border file:bg-muted file:px-3 file:py-1.5 file:text-sm max-sm:file:min-h-11 max-sm:file:px-4"
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
