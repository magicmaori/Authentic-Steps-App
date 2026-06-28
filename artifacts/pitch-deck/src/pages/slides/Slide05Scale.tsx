export default function Slide05Scale() {
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
        className="absolute top-0"
        style={{
          right: 0,
          width: "40vw",
          height: "100%",
          background: "linear-gradient(135deg, transparent 0%, rgba(3,152,158,0.07) 100%)",
        }}
      />

      <div className="relative h-full flex flex-col justify-center" style={{ padding: "6vh 6vw 6vh 7vw" }}>
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
          What's Been Delivered
        </div>
        <h2
          style={{
            fontFamily: "Inter, sans-serif",
            fontWeight: 900,
            fontSize: "4.5vw",
            color: "#fff7f0",
            lineHeight: 1.05,
            letterSpacing: "-0.025em",
            margin: "0 0 5vh 0",
            textWrap: "balance",
          }}
        >
          Real work. Tracked and shipped.
        </h2>

        <div style={{ display: "flex", gap: "3vw", alignItems: "stretch" }}>
          <div
            style={{
              flex: 1,
              background: "rgba(255,247,240,0.05)",
              border: "1px solid rgba(255,247,240,0.12)",
              borderTop: "0.4vh solid #03989e",
              borderRadius: "0.6vw",
              padding: "3.5vh 2.5vw",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontFamily: "Inter, sans-serif",
                fontWeight: 900,
                fontSize: "11vw",
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
                fontSize: "3vw",
                color: "#fff7f0",
                marginTop: "1vh",
              }}
            >
              Tasks Completed
            </div>
            <div
              style={{
                fontFamily: "Inter, sans-serif",
                fontWeight: 400,
                fontSize: "2.4vw",
                color: "rgba(255,247,240,0.55)",
                marginTop: "0.8vh",
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
              borderTop: "0.4vh solid #6dbdf2",
              borderRadius: "0.6vw",
              padding: "3.5vh 2.5vw",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontFamily: "Inter, sans-serif",
                fontWeight: 900,
                fontSize: "11vw",
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
                fontSize: "3vw",
                color: "#fff7f0",
                marginTop: "1vh",
              }}
            >
              Features Shipped
            </div>
            <div
              style={{
                fontFamily: "Inter, sans-serif",
                fontWeight: 400,
                fontSize: "2.4vw",
                color: "rgba(255,247,240,0.55)",
                marginTop: "0.8vh",
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
              borderTop: "0.4vh solid #fff7f0",
              borderRadius: "0.6vw",
              padding: "3.5vh 2.5vw",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontFamily: "Inter, sans-serif",
                fontWeight: 900,
                fontSize: "11vw",
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
                fontSize: "3vw",
                color: "#fff7f0",
                marginTop: "1vh",
              }}
            >
              Core Pillars
            </div>
            <div
              style={{
                fontFamily: "Inter, sans-serif",
                fontWeight: 400,
                fontSize: "2.4vw",
                color: "rgba(255,247,240,0.55)",
                marginTop: "0.8vh",
              }}
            >
              Designed end to end
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
