const base = import.meta.env.BASE_URL;

export default function Slide04WhatWeBuilt() {
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

      <div className="relative h-full flex flex-col" style={{ padding: "5vh 5.5vw 5vh 7vw" }}>
        <div style={{ marginBottom: "3vh" }}>
          <div
            style={{
              fontFamily: "Inter, sans-serif",
              fontWeight: 700,
              fontSize: "2.2vw",
              color: "#03989e",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              marginBottom: "1.2vh",
            }}
          >
            What We Built
          </div>
          <h2
            style={{
              fontFamily: "Inter, sans-serif",
              fontWeight: 900,
              fontSize: "5vw",
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
            gap: "1.8vh 2vw",
            flex: 1,
          }}
        >
          <div style={{ background: "#193b83", borderRadius: "0.8vw", padding: "2.5vh 2vw" }}>
            <div
              style={{
                fontFamily: "Inter, sans-serif",
                fontWeight: 900,
                fontSize: "3.2vw",
                color: "#6dbdf2",
                lineHeight: 1,
                marginBottom: "1.2vh",
              }}
            >
              Resilience Toolbox
            </div>
            <p style={{ fontFamily: "Inter, sans-serif", fontWeight: 400, fontSize: "2.6vw", color: "rgba(255,247,240,0.8)", margin: 0, lineHeight: 1.35 }}>
              Breathing exercises and guided techniques to calm down and reset
            </p>
          </div>

          <div style={{ background: "#193b83", borderRadius: "0.8vw", padding: "2.5vh 2vw" }}>
            <div
              style={{
                fontFamily: "Inter, sans-serif",
                fontWeight: 900,
                fontSize: "3.2vw",
                color: "#6dbdf2",
                lineHeight: 1,
                marginBottom: "1.2vh",
              }}
            >
              Journaling
            </div>
            <p style={{ fontFamily: "Inter, sans-serif", fontWeight: 400, fontSize: "2.6vw", color: "rgba(255,247,240,0.8)", margin: 0, lineHeight: 1.35 }}>
              A safe, private space to write thoughts and track moods over time
            </p>
          </div>

          <div style={{ background: "#193b83", borderRadius: "0.8vw", padding: "2.5vh 2vw" }}>
            <div
              style={{
                fontFamily: "Inter, sans-serif",
                fontWeight: 900,
                fontSize: "3.2vw",
                color: "#6dbdf2",
                lineHeight: 1,
                marginBottom: "1.2vh",
              }}
            >
              Grounding
            </div>
            <p style={{ fontFamily: "Inter, sans-serif", fontWeight: 400, fontSize: "2.6vw", color: "rgba(255,247,240,0.8)", margin: 0, lineHeight: 1.35 }}>
              Guided exercises to bring young people back to the present moment
            </p>
          </div>

          <div style={{ background: "rgba(3,152,158,0.08)", border: "1px solid rgba(3,152,158,0.25)", borderRadius: "0.8vw", padding: "2.5vh 2vw" }}>
            <div
              style={{
                fontFamily: "Inter, sans-serif",
                fontWeight: 900,
                fontSize: "3.2vw",
                color: "#193b83",
                lineHeight: 1,
                marginBottom: "1.2vh",
              }}
            >
              Notifications
            </div>
            <p style={{ fontFamily: "Inter, sans-serif", fontWeight: 400, fontSize: "2.6vw", color: "#1a2535", margin: 0, lineHeight: 1.35 }}>
              Gentle daily check-ins and reminders to build healthy habits
            </p>
          </div>

          <div style={{ background: "rgba(3,152,158,0.08)", border: "1px solid rgba(3,152,158,0.25)", borderRadius: "0.8vw", padding: "2.5vh 2vw" }}>
            <div
              style={{
                fontFamily: "Inter, sans-serif",
                fontWeight: 900,
                fontSize: "3.2vw",
                color: "#193b83",
                lineHeight: 1,
                marginBottom: "1.2vh",
              }}
            >
              Privacy & Safety
            </div>
            <p style={{ fontFamily: "Inter, sans-serif", fontWeight: 400, fontSize: "2.6vw", color: "#1a2535", margin: 0, lineHeight: 1.35 }}>
              Helpline cards, safe design, and data that stays on the device
            </p>
          </div>

          <div style={{ background: "rgba(3,152,158,0.08)", border: "1px solid rgba(3,152,158,0.25)", borderRadius: "0.8vw", padding: "2.5vh 2vw" }}>
            <div
              style={{
                fontFamily: "Inter, sans-serif",
                fontWeight: 900,
                fontSize: "3.2vw",
                color: "#193b83",
                lineHeight: 1,
                marginBottom: "1.2vh",
              }}
            >
              Dark Mode & Access
            </div>
            <p style={{ fontFamily: "Inter, sans-serif", fontWeight: 400, fontSize: "2.6vw", color: "#1a2535", margin: 0, lineHeight: 1.35 }}>
              Full dark mode and accessible design so anyone can use it
            </p>
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
