const base = import.meta.env.BASE_URL;

export default function Slide06CostComparison() {
  return (
    <div className="relative w-full h-full overflow-hidden" style={{ background: "#fff7f0" }}>
      <div
        className="absolute left-0 top-0 bottom-0"
        style={{ width: "7.68px", background: "#03989e" }}
      />
      <div
        className="absolute top-0 left-0 right-0"
        style={{ height: "2.88px", background: "linear-gradient(90deg, #03989e 0%, #6dbdf2 100%)", marginLeft: "7.68px" }}
      />

      <div className="relative h-full flex flex-col" style={{ padding: "25.2px 70.4px 25.2px 89.6px" }}>
        <div style={{ marginBottom: "10.8px" }}>
          <div
            style={{
              fontFamily: "Inter, sans-serif",
              fontWeight: 700,
              fontSize: "25.6px",
              color: "#03989e",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              marginBottom: "5.76px",
            }}
          >
            What This Saved You
          </div>
          <h2
            style={{
              fontFamily: "Inter, sans-serif",
              fontWeight: 900,
              fontSize: "48.64px",
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

        <div style={{ display: "flex", gap: "38.4px", flex: 1, alignItems: "stretch" }}>
          <div
            style={{
              flex: 1,
              background: "#193b83",
              borderRadius: "10.24px",
              padding: "15.84px 25.6px",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                fontFamily: "Inter, sans-serif",
                fontWeight: 900,
                fontSize: "30.72px",
                color: "#6dbdf2",
                marginBottom: "10.8px",
                borderBottom: "1px solid rgba(109,189,242,0.25)",
                paddingBottom: "8.64px",
              }}
            >
              Professional team rates
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10.8px", flex: 1, justifyContent: "space-evenly" }}>
              <div>
                <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "30.72px", color: "#fff7f0" }}>
                  App Developer
                </div>
                <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 400, fontSize: "25.6px", color: "rgba(255,247,240,0.65)", marginTop: "2.16px" }}>
                  $120 – $150 per hour
                </div>
              </div>
              <div>
                <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "30.72px", color: "#fff7f0" }}>
                  UX Designer
                </div>
                <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 400, fontSize: "25.6px", color: "rgba(255,247,240,0.65)", marginTop: "2.16px" }}>
                  $80 – $100 per hour
                </div>
              </div>
              <div>
                <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "30.72px", color: "#fff7f0" }}>
                  Project Manager
                </div>
                <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 400, fontSize: "25.6px", color: "rgba(255,247,240,0.65)", marginTop: "2.16px" }}>
                  $80 – $100 per hour
                </div>
              </div>
              <div
                style={{
                  borderTop: "1px solid rgba(109,189,242,0.25)",
                  paddingTop: "8.64px",
                }}
              >
                <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 400, fontSize: "24.32px", color: "rgba(255,247,240,0.5)" }}>
                  At 500+ hrs across a full build:
                </div>
                <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 900, fontSize: "40.96px", color: "#6dbdf2", marginTop: "3.6px" }}>
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
              borderRadius: "10.24px",
              padding: "15.84px 25.6px",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                fontFamily: "Inter, sans-serif",
                fontWeight: 900,
                fontSize: "30.72px",
                color: "#03989e",
                marginBottom: "10.8px",
                borderBottom: "1px solid rgba(3,152,158,0.3)",
                paddingBottom: "8.64px",
              }}
            >
              What Johaan delivered
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10.8px", flex: 1, justifyContent: "space-evenly" }}>
              <div>
                <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "30.72px", color: "#193b83" }}>
                  Full mobile app
                </div>
                <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 400, fontSize: "25.6px", color: "#5a6a7a", marginTop: "2.16px" }}>
                  iOS & Android ready, from scratch
                </div>
              </div>
              <div>
                <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "30.72px", color: "#193b83" }}>
                  Designed end-to-end
                </div>
                <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 400, fontSize: "25.6px", color: "#5a6a7a", marginTop: "2.16px" }}>
                  Dark mode, accessibility, brand system
                </div>
              </div>
              <div>
                <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "30.72px", color: "#193b83" }}>
                  97 tasks managed and shipped
                </div>
                <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 400, fontSize: "25.6px", color: "#5a6a7a", marginTop: "2.16px" }}>
                  Tracked, built, and delivered
                </div>
              </div>
              <div
                style={{
                  borderTop: "1px solid rgba(3,152,158,0.25)",
                  paddingTop: "8.64px",
                }}
              >
                <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 400, fontSize: "24.32px", color: "#5a6a7a" }}>
                  Your cost so far:
                </div>
                <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 900, fontSize: "40.96px", color: "#03989e", marginTop: "3.6px" }}>
                  A fraction of the market rate.
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
            style={{ height: "28.8px", width: "auto", opacity: 0.35 }}
          />
        </div>
      </div>
    </div>
  );
}
