const base = import.meta.env.BASE_URL;

export default function Slide01Title() {
  return (
    <div className="relative w-full h-full overflow-hidden" style={{ background: "#193b83" }}>
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(135deg, #193b83 0%, #0d2558 60%, #0a1e45 100%)",
        }}
      />
      <div
        className="absolute left-0 top-0 bottom-0"
        style={{ width: "7.68px", background: "#03989e" }}
      />
      <div
        className="absolute"
        style={{
          right: "0",
          top: "0",
          width: "448px",
          height: "100%",
          background: "linear-gradient(135deg, transparent 0%, rgba(3,152,158,0.08) 100%)",
        }}
      />
      <div
        className="absolute"
        style={{
          right: "51.2px",
          bottom: "28.8px",
          width: "358.4px",
          height: "358.4px",
          borderRadius: "50%",
          border: "1px solid rgba(109,189,242,0.12)",
        }}
      />
      <div
        className="absolute"
        style={{
          right: "76.8px",
          bottom: "43.2px",
          width: "256px",
          height: "256px",
          borderRadius: "50%",
          border: "1px solid rgba(109,189,242,0.08)",
        }}
      />

      <div className="relative h-full flex flex-col justify-between" style={{ padding: "50.4px 76.8px 43.2px 89.6px" }}>
        <div className="flex items-center" style={{ gap: "15.36px" }}>
          <img
            src={`${base}logo.png`}
            crossOrigin="anonymous"
            alt="Authentic Steps logo"
            style={{ height: "36px", width: "auto", filter: "brightness(0) invert(1)" }}
          />
        </div>

        <div>
          <div
            style={{
              display: "inline-block",
              background: "#03989e",
              color: "#fff7f0",
              fontFamily: "Inter, sans-serif",
              fontWeight: 700,
              fontSize: "28.16px",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              padding: "2.88px 15.36px",
              marginBottom: "21.6px",
            }}
          >
            Presented by Johaan Kaa
          </div>
          <h1
            style={{
              fontFamily: "Inter, sans-serif",
              fontWeight: 900,
              fontSize: "96px",
              color: "#fff7f0",
              lineHeight: 1.0,
              letterSpacing: "-0.03em",
              margin: 0,
              textWrap: "balance",
            }}
          >
            Authentic Steps
          </h1>
          <h2
            style={{
              fontFamily: "Inter, sans-serif",
              fontWeight: 700,
              fontSize: "57.6px",
              color: "#6dbdf2",
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              margin: "3.6px 0 0 0",
              textWrap: "balance",
            }}
          >
            For Youth
          </h2>
          <p
            style={{
              fontFamily: "Inter, sans-serif",
              fontWeight: 400,
              fontSize: "35.84px",
              color: "rgba(255,247,240,0.7)",
              margin: "21.6px 0 0 0",
              lineHeight: 1.4,
            }}
          >
            What's been built, what it saved you, and where we go from here.
          </p>
        </div>

        <div
          style={{
            fontFamily: "Inter, sans-serif",
            fontWeight: 400,
            fontSize: "28.16px",
            color: "rgba(255,247,240,0.45)",
            letterSpacing: "0.05em",
          }}
        >
          Johaan Kaa · For John Rutter, Authentic Steps · 2026
        </div>
      </div>
    </div>
  );
}
