export default function Slide02Problem() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#fff7f0" }}>
      <div
        className="absolute left-0 top-0 bottom-0"
        style={{ width: "0.6vw", background: "#03989e" }}
      />
      <div
        className="absolute"
        style={{
          right: 0,
          top: 0,
          width: "42vw",
          height: "100%",
          background: "linear-gradient(135deg, #193b83 0%, #0d2558 100%)",
        }}
      />
      <div
        className="absolute"
        style={{
          top: "5vh",
          right: "0.6vw",
          width: "0.4vw",
          height: "90vh",
          background: "#03989e",
        }}
      />

      <div className="relative h-full flex" style={{ paddingLeft: "7vw" }}>
        <div className="flex flex-col justify-center" style={{ width: "52vw", paddingRight: "4vw" }}>
          <div
            style={{
              fontFamily: "Inter, sans-serif",
              fontWeight: 700,
              fontSize: "2.2vw",
              color: "#03989e",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              marginBottom: "2.5vh",
            }}
          >
            The Problem
          </div>
          <h2
            style={{
              fontFamily: "Inter, sans-serif",
              fontWeight: 900,
              fontSize: "5.5vw",
              color: "#193b83",
              lineHeight: 1.05,
              letterSpacing: "-0.025em",
              margin: "0 0 3.5vh 0",
              textWrap: "balance",
            }}
          >
            Young people are struggling — and most apps aren't built for them.
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "2vh" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "1.2vw" }}>
              <div
                style={{
                  width: "0.5vw",
                  height: "3.5vh",
                  background: "#03989e",
                  flexShrink: 0,
                  marginTop: "0.3vh",
                }}
              />
              <p style={{ fontFamily: "Inter, sans-serif", fontWeight: 400, fontSize: "3vw", color: "#1a2535", lineHeight: 1.4, margin: 0 }}>
                1 in 7 young people live with a mental health condition
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "1.2vw" }}>
              <div
                style={{
                  width: "0.5vw",
                  height: "3.5vh",
                  background: "#03989e",
                  flexShrink: 0,
                  marginTop: "0.3vh",
                }}
              />
              <p style={{ fontFamily: "Inter, sans-serif", fontWeight: 400, fontSize: "3vw", color: "#1a2535", lineHeight: 1.4, margin: 0 }}>
                Most support tools are hard to find, expensive, or built for adults
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "1.2vw" }}>
              <div
                style={{
                  width: "0.5vw",
                  height: "3.5vh",
                  background: "#03989e",
                  flexShrink: 0,
                  marginTop: "0.3vh",
                }}
              />
              <p style={{ fontFamily: "Inter, sans-serif", fontWeight: 400, fontSize: "3vw", color: "#1a2535", lineHeight: 1.4, margin: 0 }}>
                Schools need practical, safe tools they can trust
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-center items-center" style={{ width: "42vw" }}>
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
            1 in 7
          </div>
          <div
            style={{
              fontFamily: "Inter, sans-serif",
              fontWeight: 400,
              fontSize: "2.6vw",
              color: "rgba(255,247,240,0.7)",
              textAlign: "center",
              lineHeight: 1.4,
              padding: "0 3vw",
            }}
          >
            young people experience a mental health condition
          </div>
        </div>
      </div>
    </div>
  );
}
