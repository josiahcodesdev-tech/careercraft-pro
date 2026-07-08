import { ImageResponse } from "next/og";

export const ogImageSize = { width: 1200, height: 630 };
export const ogImageContentType = "image/png";

// The site's nav/login icon: three stacked chevrons (see admin-sidebar.tsx /
// admin login page for the same paths) — kept in sync manually since satori
// can't import the lucide component directly.
function LogoMark() {
  return (
    <svg
      viewBox="0 0 24 24"
      width={40}
      height={40}
      fill="none"
      stroke="white"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </svg>
  );
}

export function createOgImage(title: string, subtitle: string) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #134A2E 0%, #1A5C3A 55%, #2E7D52 100%)",
          fontFamily: "sans-serif",
          padding: "0 80px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 48 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: "rgba(255,255,255,0.14)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <LogoMark />
          </div>
          <div style={{ display: "flex", fontSize: 34, fontWeight: 800, color: "white", letterSpacing: -0.5 }}>
            MyCareerCraft
          </div>
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 62,
            fontWeight: 900,
            color: "white",
            textAlign: "center",
            lineHeight: 1.15,
            maxWidth: 960,
          }}
        >
          {title}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 28,
            color: "#F0C955",
            marginTop: 28,
            textAlign: "center",
            maxWidth: 820,
            lineHeight: 1.4,
          }}
        >
          {subtitle}
        </div>
      </div>
    ),
    { ...ogImageSize }
  );
}
