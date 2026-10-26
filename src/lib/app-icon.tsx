import { ImageResponse } from "next/og";

/** Square app icon (open book on a dark tile), rendered at any size. */
export function renderAppIcon(size: number, { rounded = false } = {}) {
  const s = size / 512;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#1c1917",
          borderRadius: rounded ? 112 * s : 0,
        }}
      >
        <svg
          width={300 * s}
          height={300 * s}
          viewBox="0 0 24 24"
          fill="none"
          stroke="#fafaf9"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 7v14" />
          <path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" />
        </svg>
      </div>
    ),
    { width: size, height: size },
  );
}
