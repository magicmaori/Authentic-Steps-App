const base = import.meta.env.BASE_URL;

export default function Slide09WhatsNext() {
  return (
    <div
      className="relative w-screen h-screen overflow-hidden"
      style={{ background: "linear-gradient(135deg, #193b83 0%, #0d2558 100%)" }}
    >
      <div
        className="absolute left-0 top-0 bottom-0"
        style={{ width: "0.6vw", background: "#03989e" }}
      />
      <div
        className="absolute"
        style={{
          right: 0,
          bottom: 0,
          width: "30vw",
          height: "30vw",
          borderRadius: "50% 0 0 0",
          background: "rgba(3,152,158,0.07)",
        }}
      />

      <div className="relative h-full flex flex-col justify-center" style={{ padding: "6vh 5.5vw 6vh 7vw" }}>
        <div
          style={{
            fontFamily: "Inter, sans-serif",
            fontWeight: 700,
            fontSize: "2.2vw",
            color: "#03989e",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            marginBottom: "2vh",
          }}
        >
          The Road Ahead
        </div>
        <h2
          style={{
            fontFamily: "Inter, sans-serif",
            fontWeight: 900,
            fontSize: "5vw",
            color: "#fff7f0",
            lineHeight: 1.05,
            letterSpacing: "-0.025em",
            margin: "0 0 4.5vh 0",
          }}
        >
          Foundation built. Now we build the future.
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: "2.5vh" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "2.5vw" }}>
            <div
              style={{
                fontFamily: "Inter, sans-serif",
                fontWeight: 900,
                fontSize: "4vw",
                color: "#6dbdf2",
                width: "5vw",
                flexShrink: 0,
                textAlign: "right",
              }}
            >
              Now
            </div>
            <div style={{ height: "1px", width: "2vw", background: "#03989e", flexShrink: 0 }} />
            <div>
              <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "3.2vw", color: "#fff7f0" }}>
                Structuring and connecting
              </div>
              <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 400, fontSize: "2.6vw", color: "rgba(255,247,240,0.6)", marginTop: "0.3vh" }}>
                Plugging all the pieces together, polishing the experience
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "2.5vw" }}>
            <div
              style={{
                fontFamily: "Inter, sans-serif",
                fontWeight: 900,
                fontSize: "4vw",
                color: "#6dbdf2",
                width: "5vw",
                flexShrink: 0,
                textAlign: "right",
              }}
            >
              Next
            </div>
            <div style={{ height: "1px", width: "2vw", background: "#03989e", flexShrink: 0 }} />
            <div>
              <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "3.2vw", color: "#fff7f0" }}>
                Backend development
              </div>
              <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 400, fontSize: "2.6vw", color: "rgba(255,247,240,0.6)", marginTop: "0.3vh" }}>
                Server, accounts, and data — making the app ready to scale
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "2.5vw" }}>
            <div
              style={{
                fontFamily: "Inter, sans-serif",
                fontWeight: 900,
                fontSize: "4vw",
                color: "#03989e",
                width: "5vw",
                flexShrink: 0,
                textAlign: "right",
              }}
            >
              Then
            </div>
            <div style={{ height: "1px", width: "2vw", background: "#03989e", flexShrink: 0 }} />
            <div>
              <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "3.2vw", color: "#fff7f0" }}>
                Revenue and growth
              </div>
              <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 400, fontSize: "2.6vw", color: "rgba(255,247,240,0.6)", marginTop: "0.3vh" }}>
                School licensing, App Store launch, and a sustainable income stream
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 right-0" style={{ padding: "3vh 4vw" }}>
        <img
          src={`${base}logo.png`}
          crossOrigin="anonymous"
          alt="Authentic Steps logo"
          style={{ height: "4vh", width: "auto", filter: "brightness(0) invert(1)", opacity: 0.4 }}
        />
      </div>
    </div>
  );
}
