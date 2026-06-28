const base = import.meta.env.BASE_URL;

export default function Slide07WhoItServes() {
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
          right: "3vw",
          top: "3vh",
          width: "22vw",
          height: "22vw",
          borderRadius: "50%",
          border: "1px solid rgba(109,189,242,0.1)",
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
          Who This Serves
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
            textWrap: "balance",
          }}
        >
          Built for young people. Trusted by the adults around them.
        </h2>

        <div style={{ display: "flex", gap: "2.5vw" }}>
          <div
            style={{
              flex: 1,
              borderLeft: "0.4vw solid #6dbdf2",
              paddingLeft: "2vw",
            }}
          >
            <div
              style={{
                fontFamily: "Inter, sans-serif",
                fontWeight: 900,
                fontSize: "3.5vw",
                color: "#6dbdf2",
                marginBottom: "1.5vh",
              }}
            >
              Young People
            </div>
            <p style={{ fontFamily: "Inter, sans-serif", fontWeight: 400, fontSize: "2.8vw", color: "rgba(255,247,240,0.8)", margin: 0, lineHeight: 1.4 }}>
              Ages 11–25 who need a private, safe space to manage their mental wellbeing
            </p>
          </div>

          <div
            style={{
              flex: 1,
              borderLeft: "0.4vw solid #03989e",
              paddingLeft: "2vw",
            }}
          >
            <div
              style={{
                fontFamily: "Inter, sans-serif",
                fontWeight: 900,
                fontSize: "3.5vw",
                color: "#03989e",
                marginBottom: "1.5vh",
              }}
            >
              Schools
            </div>
            <p style={{ fontFamily: "Inter, sans-serif", fontWeight: 400, fontSize: "2.8vw", color: "rgba(255,247,240,0.8)", margin: 0, lineHeight: 1.4 }}>
              A tool schools can confidently recommend — free, safe, and no account required
            </p>
          </div>

          <div
            style={{
              flex: 1,
              borderLeft: "0.4vw solid #fff7f0",
              paddingLeft: "2vw",
            }}
          >
            <div
              style={{
                fontFamily: "Inter, sans-serif",
                fontWeight: 900,
                fontSize: "3.5vw",
                color: "#fff7f0",
                marginBottom: "1.5vh",
              }}
            >
              Counsellors
            </div>
            <p style={{ fontFamily: "Inter, sans-serif", fontWeight: 400, fontSize: "2.8vw", color: "rgba(255,247,240,0.8)", margin: 0, lineHeight: 1.4 }}>
              A bridge between sessions — something tangible to put in a young person's hands
            </p>
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
