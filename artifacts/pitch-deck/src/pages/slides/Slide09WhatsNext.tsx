const base = import.meta.env.BASE_URL;

export default function Slide09WhatsNext() {
  return (
    <div
      className="relative w-full h-full overflow-hidden"
      style={{ background: "linear-gradient(135deg, #193b83 0%, #0d2558 100%)" }}
    >
      <div
        className="absolute left-0 top-0 bottom-0"
        style={{ width: "7.68px", background: "#03989e" }}
      />
      <div
        className="absolute"
        style={{
          right: 0,
          bottom: 0,
          width: "384px",
          height: "384px",
          borderRadius: "50% 0 0 0",
          background: "rgba(3,152,158,0.07)",
        }}
      />

      <div className="relative h-full flex flex-col justify-center" style={{ padding: "43.2px 70.4px 43.2px 89.6px" }}>
        <div
          style={{
            fontFamily: "Inter, sans-serif",
            fontWeight: 700,
            fontSize: "28.16px",
            color: "#03989e",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            marginBottom: "14.4px",
          }}
        >
          The Road Ahead
        </div>
        <h2
          style={{
            fontFamily: "Inter, sans-serif",
            fontWeight: 900,
            fontSize: "64px",
            color: "#fff7f0",
            lineHeight: 1.05,
            letterSpacing: "-0.025em",
            margin: "0 0 32.4px 0",
          }}
        >
          Foundation built. Now we build the future.
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "32px" }}>
            <div
              style={{
                fontFamily: "Inter, sans-serif",
                fontWeight: 900,
                fontSize: "51.2px",
                color: "#6dbdf2",
                width: "64px",
                flexShrink: 0,
                textAlign: "right",
              }}
            >
              Now
            </div>
            <div style={{ height: "1px", width: "25.6px", background: "#03989e", flexShrink: 0 }} />
            <div>
              <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "40.96px", color: "#fff7f0" }}>
                Structuring and connecting
              </div>
              <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 400, fontSize: "33.28px", color: "rgba(255,247,240,0.6)", marginTop: "2.16px" }}>
                Plugging all the pieces together, polishing the experience
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "32px" }}>
            <div
              style={{
                fontFamily: "Inter, sans-serif",
                fontWeight: 900,
                fontSize: "51.2px",
                color: "#6dbdf2",
                width: "64px",
                flexShrink: 0,
                textAlign: "right",
              }}
            >
              Next
            </div>
            <div style={{ height: "1px", width: "25.6px", background: "#03989e", flexShrink: 0 }} />
            <div>
              <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "40.96px", color: "#fff7f0" }}>
                Backend development
              </div>
              <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 400, fontSize: "33.28px", color: "rgba(255,247,240,0.6)", marginTop: "2.16px" }}>
                Server, accounts, and data — making the app ready to scale
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "32px" }}>
            <div
              style={{
                fontFamily: "Inter, sans-serif",
                fontWeight: 900,
                fontSize: "51.2px",
                color: "#03989e",
                width: "64px",
                flexShrink: 0,
                textAlign: "right",
              }}
            >
              Then
            </div>
            <div style={{ height: "1px", width: "25.6px", background: "#03989e", flexShrink: 0 }} />
            <div>
              <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "40.96px", color: "#fff7f0" }}>
                Revenue and growth
              </div>
              <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 400, fontSize: "33.28px", color: "rgba(255,247,240,0.6)", marginTop: "2.16px" }}>
                School licensing, App Store launch, and a sustainable income stream
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 right-0" style={{ padding: "21.6px 51.2px" }}>
        <img
          src={`${base}logo.png`}
          crossOrigin="anonymous"
          alt="Authentic Steps logo"
          style={{ height: "28.8px", width: "auto", filter: "brightness(0) invert(1)", opacity: 0.4 }}
        />
      </div>
    </div>
  );
}
