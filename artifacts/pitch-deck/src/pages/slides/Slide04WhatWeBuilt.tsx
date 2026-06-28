const base = import.meta.env.BASE_URL;

export default function Slide04WhatWeBuilt() {
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

      <div className="relative h-full flex flex-col" style={{ padding: "36px 70.4px 36px 89.6px" }}>
        <div style={{ marginBottom: "21.6px" }}>
          <div
            style={{
              fontFamily: "Inter, sans-serif",
              fontWeight: 700,
              fontSize: "28.16px",
              color: "#03989e",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              marginBottom: "8.64px",
            }}
          >
            What We Built
          </div>
          <h2
            style={{
              fontFamily: "Inter, sans-serif",
              fontWeight: 900,
              fontSize: "64px",
              color: "#193b83",
              lineHeight: 1.0,
              letterSpacing: "-0.025em",
              margin: 0,
            }}
          >
            Six pillars. One app.
          </h2>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gridTemplateRows: "1fr 1fr",
            gap: "12.96px 25.6px",
            flex: 1,
          }}
        >
          <div style={{ background: "#193b83", borderRadius: "10.24px", padding: "12.96px 20.48px" }}>
            <div
              style={{
                fontFamily: "Inter, sans-serif",
                fontWeight: 900,
                fontSize: "28.16px",
                color: "#6dbdf2",
                lineHeight: 1,
                marginBottom: "5.76px",
              }}
            >
              Resilience Toolbox
            </div>
            <p style={{ fontFamily: "Inter, sans-serif", fontWeight: 400, fontSize: "24.32px", color: "rgba(255,247,240,0.8)", margin: 0, lineHeight: 1.35 }}>
              Breathing exercises and guided techniques to calm down and reset
            </p>
          </div>

          <div style={{ background: "#193b83", borderRadius: "10.24px", padding: "12.96px 20.48px" }}>
            <div
              style={{
                fontFamily: "Inter, sans-serif",
                fontWeight: 900,
                fontSize: "28.16px",
                color: "#6dbdf2",
                lineHeight: 1,
                marginBottom: "5.76px",
              }}
            >
              Journaling
            </div>
            <p style={{ fontFamily: "Inter, sans-serif", fontWeight: 400, fontSize: "24.32px", color: "rgba(255,247,240,0.8)", margin: 0, lineHeight: 1.35 }}>
              A safe, private space to write thoughts and track moods over time
            </p>
          </div>

          <div style={{ background: "#193b83", borderRadius: "10.24px", padding: "12.96px 20.48px" }}>
            <div
              style={{
                fontFamily: "Inter, sans-serif",
                fontWeight: 900,
                fontSize: "28.16px",
                color: "#6dbdf2",
                lineHeight: 1,
                marginBottom: "5.76px",
              }}
            >
              Grounding
            </div>
            <p style={{ fontFamily: "Inter, sans-serif", fontWeight: 400, fontSize: "24.32px", color: "rgba(255,247,240,0.8)", margin: 0, lineHeight: 1.35 }}>
              Guided exercises to bring young people back to the present moment
            </p>
          </div>

          <div style={{ background: "rgba(3,152,158,0.08)", border: "1px solid rgba(3,152,158,0.25)", borderRadius: "10.24px", padding: "12.96px 20.48px" }}>
            <div
              style={{
                fontFamily: "Inter, sans-serif",
                fontWeight: 900,
                fontSize: "28.16px",
                color: "#193b83",
                lineHeight: 1,
                marginBottom: "5.76px",
              }}
            >
              Notifications
            </div>
            <p style={{ fontFamily: "Inter, sans-serif", fontWeight: 400, fontSize: "24.32px", color: "#1a2535", margin: 0, lineHeight: 1.35 }}>
              Gentle daily check-ins and reminders to build healthy habits
            </p>
          </div>

          <div style={{ background: "rgba(3,152,158,0.08)", border: "1px solid rgba(3,152,158,0.25)", borderRadius: "10.24px", padding: "12.96px 20.48px" }}>
            <div
              style={{
                fontFamily: "Inter, sans-serif",
                fontWeight: 900,
                fontSize: "28.16px",
                color: "#193b83",
                lineHeight: 1,
                marginBottom: "5.76px",
              }}
            >
              Privacy & Safety
            </div>
            <p style={{ fontFamily: "Inter, sans-serif", fontWeight: 400, fontSize: "24.32px", color: "#1a2535", margin: 0, lineHeight: 1.35 }}>
              Helpline cards, safe design, and data that stays on the device
            </p>
          </div>

          <div style={{ background: "rgba(3,152,158,0.08)", border: "1px solid rgba(3,152,158,0.25)", borderRadius: "10.24px", padding: "12.96px 20.48px" }}>
            <div
              style={{
                fontFamily: "Inter, sans-serif",
                fontWeight: 900,
                fontSize: "28.16px",
                color: "#193b83",
                lineHeight: 1,
                marginBottom: "5.76px",
              }}
            >
              Dark Mode & Access
            </div>
            <p style={{ fontFamily: "Inter, sans-serif", fontWeight: 400, fontSize: "24.32px", color: "#1a2535", margin: 0, lineHeight: 1.35 }}>
              Full dark mode and accessible design so anyone can use it
            </p>
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
