import { ImageResponse } from "next/og";

// TODO: replace with a designed OG image (1200x630) when available
export const runtime = "edge";
export const alt = "CourtFuel — AI nutrition for basketball players";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#0A0A0A",
          color: "#FFFFFF",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          fontFamily: "sans-serif",
          padding: 80,
        }}
      >
        <div style={{ fontSize: 96, fontWeight: 700, letterSpacing: -2 }}>
          Court<span style={{ color: "#FF6B1A" }}>Fuel</span>
        </div>
        <div
          style={{
            marginTop: 32,
            fontSize: 36,
            color: "rgba(255,255,255,0.75)",
            textAlign: "center",
            maxWidth: 900,
            lineHeight: 1.25,
          }}
        >
          Eat like the player you want to become.
        </div>
        <div
          style={{
            marginTop: 24,
            fontSize: 24,
            color: "rgba(255,255,255,0.5)",
          }}
        >
          AI nutrition for basketball players · iOS beta
        </div>
      </div>
    ),
    { ...size }
  );
}
