import { ImageResponse } from "next/og";
import { SITE_NAME } from "@/lib/site";

// Delingskort for lenkeforhåndsvisninger (Slack, X, meldinger). Rendres som
// et bilde med samme off-black palett og dempet grønn aksent som resten.
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Robothjelp – anonyme KI-søk";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0e0f12",
          padding: "80px",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            color: "#e7e8ea",
            fontSize: 30,
            fontWeight: 600,
          }}
        >
          {SITE_NAME}
          <span style={{ color: "#6e7178", fontSize: 24, fontWeight: 400 }}>
            anonyme KI-søk
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div
            style={{
              color: "#e7e8ea",
              fontSize: 76,
              fontWeight: 600,
              letterSpacing: "-0.03em",
              lineHeight: 1.05,
            }}
          >
            Bruk KI helt anonymt
          </div>
          <div
            style={{
              color: "#a0a3ab",
              fontSize: 32,
              lineHeight: 1.3,
              maxWidth: "900px",
            }}
          >
            Ingen konto, ingen lagring av samtaler, ingen IP-logging.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            color: "#5fbb94",
            fontSize: 26,
          }}
        >
          <div
            style={{
              width: "14px",
              height: "14px",
              borderRadius: "50%",
              background: "#4ca681",
            }}
          />
          Det vi ikke lagrer, kan ikke lekke.
        </div>
      </div>
    ),
    size,
  );
}
