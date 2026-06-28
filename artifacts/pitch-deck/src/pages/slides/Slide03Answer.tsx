const base = import.meta.env.BASE_URL;

export default function Slide03Answer() {
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
          left: "6vw",
          top: "6vh",
          width: "20vw",
          height: "20vw",
          borderRadius: "50%",
          border: "1px solid rgba(109,189,242,0.1)",
        }}
      />
      <div
        className="absolute"
        style={{
          right: "8vw",
          bottom: "8vh",
          width: "14vw",
          height: "14vw",
          borderRadius: "50%",
          background: "rgba(3,152,158,0.08)",
        }}
      />

      <div className="relative h-full flex flex-col justify-center items-center" style={{ padding: "8vh 10vw" }}>
        <div
          style={{
            fontFamily: "Inter, sans-serif",
            fontWeight: 700,
            fontSize: "2.2vw",
            color: "#03989e",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            marginBottom: "4vh",
          }}
        >
          What I Built For You
        </div>

        <p
          style={{
            fontFamily: "Inter, sans-serif",
            fontWeight: 900,
            fontSize: "5.2vw",
            color: "#fff7f0",
            lineHeight: 1.15,
            letterSpacing: "-0.02em",
            textAlign: "center",
            textWrap: "balance",
            margin: "0 0 5vh 0",
          }}
        >
          A free, private mobile app that gives young people real tools for their mental health — right in their pocket.
        </p>

        <div
          style={{
            height: "0.4vh",
            width: "8vw",
            background: "#03989e",
            marginBottom: "5vh",
          }}
        />

        <div
          style={{
            display: "flex",
            gap: "4vw",
            alignItems: "center",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontFamily: "Inter, sans-serif",
                fontWeight: 900,
                fontSize: "4.5vw",
                color: "#6dbdf2",
                lineHeight: 1,
              }}
            >
              Free
            </div>
            <div
              style={{
                fontFamily: "Inter, sans-serif",
                fontWeight: 400,
                fontSize: "2.6vw",
                color: "rgba(255,247,240,0.6)",
                marginTop: "0.5vh",
              }}
            >
              Always
            </div>
          </div>
          <div
            style={{ width: "0.2vw", height: "8vh", background: "rgba(255,247,240,0.2)" }}
          />
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontFamily: "Inter, sans-serif",
                fontWeight: 900,
                fontSize: "4.5vw",
                color: "#6dbdf2",
                lineHeight: 1,
              }}
            >
              Private
            </div>
            <div
              style={{
                fontFamily: "Inter, sans-serif",
                fontWeight: 400,
                fontSize: "2.6vw",
                color: "rgba(255,247,240,0.6)",
                marginTop: "0.5vh",
              }}
            >
              By design
            </div>
          </div>
          <div
            style={{ width: "0.2vw", height: "8vh", background: "rgba(255,247,240,0.2)" }}
          />
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontFamily: "Inter, sans-serif",
                fontWeight: 900,
                fontSize: "4.5vw",
                color: "#6dbdf2",
                lineHeight: 1,
              }}
            >
              Youth-first
            </div>
            <div
              style={{
                fontFamily: "Inter, sans-serif",
                fontWeight: 400,
                fontSize: "2.6vw",
                color: "rgba(255,247,240,0.6)",
                marginTop: "0.5vh",
              }}
            >
              Built for them
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
    </div>
  );
}
