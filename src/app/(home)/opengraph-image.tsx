import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

// The link preview Instagram, iMessage and Safari show for courtfuel.app.
// Training-first, in the homepage's warm hardwood: the hero's headline and line.
// It lives in the (home) route group so it is the homepage's preview only;
// every other route keeps the root src/app/opengraph-image.tsx.
export const alt =
  "CourtFuel — Train like your position. Position-specific drills every week, built round your game.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const LINE = "Position-specific drills every week, built round your game.";

// Static TTFs for Satori, which can't read the site's variable woff2. They are
// Google Fonts' own static instances (SIL OFL), cut to basic Latin, and live
// in the repo so the build never depends on a network fetch:
//   Archivo Black at extra-condensed (width class 2): the PRINT voice, the
//     same face the site sets at font-stretch 62%
//   Inter Bold and Regular: the wordmark and the line
const font = (file: string) => readFile(join(process.cwd(), "src/app/(home)/_og-fonts", file));

export default async function OpengraphImage() {
  const [print, wordmark, body, icon] = await Promise.all([
    font("Archivo-ExtraCondensed-Black.ttf"),
    font("Inter-Bold.ttf"),
    font("Inter-Regular.ttf"),
    readFile(join(process.cwd(), "public/home/app-icon.png")),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "60px 80px 70px",
          backgroundColor: "#24160d",
          backgroundImage:
            "radial-gradient(circle at 50% -40%, rgba(255, 172, 86, 0.34), rgba(255, 172, 86, 0) 70%), linear-gradient(180deg, #3a2413 0%, #2c1b0f 60%, #24160d 100%)",
          color: "#fff6ea",
          fontFamily: "Inter",
        }}
      >
        {/* The concept's brand mark: icon and an all-paper wordmark. */}
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <img
            src={`data:image/png;base64,${icon.toString("base64")}`}
            width={68}
            height={68}
            style={{ borderRadius: 15 }}
            alt=""
          />
          <div style={{ display: "flex", fontSize: 44, fontWeight: 700, letterSpacing: -0.88 }}>
            CourtFuel
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          {/* .print: uppercase, line-height 0.92, tracking 0.004em */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontFamily: "Archivo",
              fontWeight: 900,
              fontSize: 164,
              lineHeight: 0.92,
              letterSpacing: 0.66,
              textTransform: "uppercase",
              whiteSpace: "nowrap",
            }}
          >
            <span>Train like</span>
            <span>your position.</span>
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 30,
              fontSize: 36,
              lineHeight: 1.35,
              color: "rgba(255, 240, 225, 0.78)",
            }}
          >
            {LINE}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Archivo", data: print, weight: 900, style: "normal" },
        { name: "Inter", data: wordmark, weight: 700, style: "normal" },
        { name: "Inter", data: body, weight: 400, style: "normal" },
      ],
    },
  );
}
