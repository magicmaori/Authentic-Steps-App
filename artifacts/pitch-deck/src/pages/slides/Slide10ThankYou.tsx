const base = import.meta.env.BASE_URL;

export default function Slide10ThankYou() {
  return (
    <div
      className="relative w-full h-full overflow-hidden"
      style={{ background: "linear-gradient(135deg, #193b83 0%, #0a1e45 100%)" }}
    >
      <div
        className="absolute left-0 top-0 bottom-0"
        style={{ width: "7.68px", background: "#03989e" }}
      />
      <div
        className="absolute"
        style={{
          right: 0,
          top: 0,
          width: "640px",
          height: "100%",
          background: "linear-gradient(135deg, transparent 0%, rgba(3,152,158,0.06) 100%)",
        }}
      />
      <div
        className="absolute"
        style={{
          right: "64px",
          top: "36px",
          width: "320px",
          height: "320px",
          borderRadius: "50%",
          border: "1px solid rgba(109,189,242,0.1)",
        }}
      />
      <div
        className="absolute"
        style={{
          right: "89.6px",
          top: "50.4px",
          width: "217.6px",
          height: "217.6px",
          borderRadius: "50%",
          border: "1px solid rgba(109,189,242,0.07)",
        }}
      />
      <div
        className="absolute"
        style={{
          left: "51.2px",
          bottom: "28.8px",
          width: "153.6px",
          height: "153.6px",
          borderRadius: "50%",
          background: "rgba(3,152,158,0.07)",
        }}
      />

      <div className="relative h-full flex flex-col justify-between" style={{ padding: "36px 76.8px 28.8px 89.6px" }}>
        <div>
          <img
            src={`${base}logo.png`}
            crossOrigin="anonymous"
            alt="Authentic Steps logo"
            style={{ height: "43.2px", width: "auto", filter: "brightness(0) invert(1)" }}
          />
        </div>

        <div>
          <div
            style={{
              fontFamily: "Inter, sans-serif",
              fontWeight: 700,
              fontSize: "28.16px",
              color: "#03989e",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              marginBottom: "18px",
            }}
          >
            The Next Step, John
          </div>
          <h2
            style={{
              fontFamily: "Inter, sans-serif",
              fontWeight: 900,
              fontSize: "66.56px",
              color: "#fff7f0",
              lineHeight: 1.0,
              letterSpacing: "-0.03em",
              margin: "0 0 14.4px 0",
              textWrap: "balance",
            }}
          >
            Let's get this into young people's hands.
          </h2>
          <div
            style={{
              height: "2.88px",
              width: "102.4px",
              background: "#03989e",
              marginBottom: "18px",
            }}
          />
          <p
            style={{
              fontFamily: "Inter, sans-serif",
              fontWeight: 400,
              fontSize: "30.72px",
              color: "rgba(255,247,240,0.7)",
              margin: "0 0 18px 0",
              lineHeight: 1.5,
              maxWidth: "742.4px",
            }}
          >
            The app is built and open for sign-up. Now we launch on the App Store, reach young people directly, and build something that lasts — backed by grants, partnerships, and a mission that matters.
          </p>
          <div
            style={{
              display: "inline-block",
              background: "#03989e",
              color: "#fff7f0",
              fontFamily: "Inter, sans-serif",
              fontWeight: 700,
              fontSize: "30.72px",
              letterSpacing: "0.02em",
              padding: "10.8px 38.4px",
            }}
          >
            Johaan Kaa — your development partner
          </div>
        </div>

        <div
          style={{
            fontFamily: "Inter, sans-serif",
            fontWeight: 400,
            fontSize: "28.16px",
            color: "rgba(255,247,240,0.4)",
          }}
        >
          Presented to John Rutter · Authentic Steps For Youth · 2026
        </div>
      </div>
    </div>
  );
}
