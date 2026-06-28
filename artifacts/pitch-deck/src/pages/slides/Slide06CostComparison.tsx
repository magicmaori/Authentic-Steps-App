const base = import.meta.env.BASE_URL;

export default function Slide06CostComparison() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#fff7f0" }}>
      <div
        className="absolute left-0 top-0 bottom-0"
        style={{ width: "0.6vw", background: "#03989e" }}
      />
      <div
        className="absolute top-0 left-0 right-0"
        style={{ height: "0.4vh", background: "linear-gradient(90deg, #03989e 0%, #6dbdf2 100%)", marginLeft: "0.6vw" }}
      />

      <div className="relative h-full flex flex-col" style={{ padding: "3.5vh 5.5vw 3.5vh 7vw" }}>
        <div style={{ marginBottom: "1.5vh" }}>
          <div
            style={{
              fontFamily: "Inter, sans-serif",
              fontWeight: 700,
              fontSize: "2vw",
              color: "#03989e",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              marginBottom: "0.8vh",
            }}
          >
            What This Saved You
          </div>
          <h2
            style={{
              fontFamily: "Inter, sans-serif",
              fontWeight: 900,
              fontSize: "3.8vw",
              color: "#193b83",
              lineHeight: 1.05,
              letterSpacing: "-0.025em",
              margin: 0,
              textWrap: "balance",
            }}
          >
            The cost of hiring a professional team to do this.
          </h2>
        </div>

        <div style={{ display: "flex", gap: "3vw", flex: 1, alignItems: "stretch" }}>
          <div
            style={{
              flex: 1,
              background: "#193b83",
              borderRadius: "0.8vw",
              padding: "2.2vh 2vw",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                fontFamily: "Inter, sans-serif",
                fontWeight: 900,
                fontSize: "2.4vw",
                color: "#6dbdf2",
                marginBottom: "1.5vh",
                borderBottom: "1px solid rgba(109,189,242,0.25)",
                paddingBottom: "1.2vh",
              }}
            >
              Professional team rates
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5vh", flex: 1, justifyContent: "space-evenly" }}>
              <div>
                <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "2.4vw", color: "#fff7f0" }}>
                  App Developer
                </div>
                <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 400, fontSize: "2vw", color: "rgba(255,247,240,0.65)", marginTop: "0.3vh" }}>
                  $120 – $150 per hour
                </div>
              </div>
              <div>
                <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "2.4vw", color: "#fff7f0" }}>
                  UX Designer
                </div>
                <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 400, fontSize: "2vw", color: "rgba(255,247,240,0.65)", marginTop: "0.3vh" }}>
                  $80 – $100 per hour
                </div>
              </div>
              <div>
                <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "2.4vw", color: "#fff7f0" }}>
                  Project Manager
                </div>
                <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 400, fontSize: "2vw", color: "rgba(255,247,240,0.65)", marginTop: "0.3vh" }}>
                  $80 – $100 per hour
                </div>
              </div>
              <div
                style={{
                  borderTop: "1px solid rgba(109,189,242,0.25)",
                  paddingTop: "1.2vh",
                }}
              >
                <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 400, fontSize: "1.9vw", color: "rgba(255,247,240,0.5)" }}>
                  At 500+ hrs across a full build:
                </div>
                <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 900, fontSize: "3.2vw", color: "#6dbdf2", marginTop: "0.5vh" }}>
                  $50,000 – $175,000+
                </div>
              </div>
            </div>
          </div>

          <div
            style={{
              flex: 1,
              background: "rgba(3,152,158,0.08)",
              border: "2px solid #03989e",
              borderRadius: "0.8vw",
              padding: "2.2vh 2vw",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                fontFamily: "Inter, sans-serif",
                fontWeight: 900,
                fontSize: "2.4vw",
                color: "#03989e",
                marginBottom: "1.5vh",
                borderBottom: "1px solid rgba(3,152,158,0.3)",
                paddingBottom: "1.2vh",
              }}
            >
              What Johaan delivered
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5vh", flex: 1, justifyContent: "space-evenly" }}>
              <div>
                <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "2.4vw", color: "#193b83" }}>
                  Full mobile app
                </div>
                <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 400, fontSize: "2vw", color: "#5a6a7a", marginTop: "0.3vh" }}>
                  iOS & Android ready, from scratch
                </div>
              </div>
              <div>
                <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "2.4vw", color: "#193b83" }}>
                  Designed end-to-end
                </div>
                <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 400, fontSize: "2vw", color: "#5a6a7a", marginTop: "0.3vh" }}>
                  Dark mode, accessibility, brand system
                </div>
              </div>
              <div>
                <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "2.4vw", color: "#193b83" }}>
                  97 tasks managed and shipped
                </div>
                <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 400, fontSize: "2vw", color: "#5a6a7a", marginTop: "0.3vh" }}>
                  Tracked, built, and delivered
                </div>
              </div>
              <div
                style={{
                  borderTop: "1px solid rgba(3,152,158,0.25)",
                  paddingTop: "1.2vh",
                }}
              >
                <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 400, fontSize: "1.9vw", color: "#5a6a7a" }}>
                  Your cost so far:
                </div>
                <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 900, fontSize: "3.2vw", color: "#03989e", marginTop: "0.5vh" }}>
                  A fraction of the market rate.
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
            style={{ height: "4vh", width: "auto", opacity: 0.35 }}
          />
        </div>
      </div>
    </div>
  );
}
