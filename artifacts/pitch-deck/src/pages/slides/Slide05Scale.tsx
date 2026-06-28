const base = import.meta.env.BASE_URL;

export default function Slide05Scale() {
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
        className="absolute top-0"
        style={{
          right: 0,
          width: "512px",
          height: "100%",
          background: "linear-gradient(135deg, transparent 0%, rgba(3,152,158,0.07) 100%)",
        }}
      />

      <div className="relative h-full flex flex-col justify-center" style={{ padding: "43.2px 76.8px 43.2px 89.6px" }}>
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
          What's Been Delivered
        </div>
        <h2
          style={{
            fontFamily: "Inter, sans-serif",
            fontWeight: 900,
            fontSize: "57.6px",
            color: "#fff7f0",
            lineHeight: 1.05,
            letterSpacing: "-0.025em",
            margin: "0 0 36px 0",
            textWrap: "balance",
          }}
        >
          Real work. Tracked and shipped.
        </h2>

        <div style={{ display: "flex", gap: "38.4px", alignItems: "stretch" }}>
          <div
            style={{
              flex: 1,
              background: "rgba(255,247,240,0.05)",
              border: "1px solid rgba(255,247,240,0.12)",
              borderTop: "2.88px solid #03989e",
              borderRadius: "7.68px",
              padding: "25.2px 32px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontFamily: "Inter, sans-serif",
                fontWeight: 900,
                fontSize: "140.8px",
                color: "#6dbdf2",
                lineHeight: 1,
                letterSpacing: "-0.04em",
              }}
            >
              97
            </div>
            <div
              style={{
                fontFamily: "Inter, sans-serif",
                fontWeight: 700,
                fontSize: "38.4px",
                color: "#fff7f0",
                marginTop: "7.2px",
              }}
            >
              Tasks Completed
            </div>
            <div
              style={{
                fontFamily: "Inter, sans-serif",
                fontWeight: 400,
                fontSize: "30.72px",
                color: "rgba(255,247,240,0.55)",
                marginTop: "5.76px",
              }}
            >
              Every piece of work logged
            </div>
          </div>

          <div
            style={{
              flex: 1,
              background: "rgba(255,247,240,0.05)",
              border: "1px solid rgba(255,247,240,0.12)",
              borderTop: "2.88px solid #6dbdf2",
              borderRadius: "7.68px",
              padding: "25.2px 32px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontFamily: "Inter, sans-serif",
                fontWeight: 900,
                fontSize: "140.8px",
                color: "#03989e",
                lineHeight: 1,
                letterSpacing: "-0.04em",
              }}
            >
              50+
            </div>
            <div
              style={{
                fontFamily: "Inter, sans-serif",
                fontWeight: 700,
                fontSize: "38.4px",
                color: "#fff7f0",
                marginTop: "7.2px",
              }}
            >
              Features Shipped
            </div>
            <div
              style={{
                fontFamily: "Inter, sans-serif",
                fontWeight: 400,
                fontSize: "30.72px",
                color: "rgba(255,247,240,0.55)",
                marginTop: "5.76px",
              }}
            >
              Real, working, tested
            </div>
          </div>

          <div
            style={{
              flex: 1,
              background: "rgba(255,247,240,0.05)",
              border: "1px solid rgba(255,247,240,0.12)",
              borderTop: "2.88px solid #fff7f0",
              borderRadius: "7.68px",
              padding: "25.2px 32px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontFamily: "Inter, sans-serif",
                fontWeight: 900,
                fontSize: "140.8px",
                color: "#fff7f0",
                lineHeight: 1,
                letterSpacing: "-0.04em",
              }}
            >
              6
            </div>
            <div
              style={{
                fontFamily: "Inter, sans-serif",
                fontWeight: 700,
                fontSize: "38.4px",
                color: "#fff7f0",
                marginTop: "7.2px",
              }}
            >
              Core Pillars
            </div>
            <div
              style={{
                fontFamily: "Inter, sans-serif",
                fontWeight: 400,
                fontSize: "30.72px",
                color: "rgba(255,247,240,0.55)",
                marginTop: "5.76px",
              }}
            >
              Designed end to end
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
