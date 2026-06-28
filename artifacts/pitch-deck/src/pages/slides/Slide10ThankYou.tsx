const base = import.meta.env.BASE_URL;

export default function Slide10ThankYou() {
  return (
    <div
      className="relative w-screen h-screen overflow-hidden"
      style={{ background: "linear-gradient(135deg, #193b83 0%, #0a1e45 100%)" }}
    >
      <div
        className="absolute left-0 top-0 bottom-0"
        style={{ width: "0.6vw", background: "#03989e" }}
      />
      <div
        className="absolute"
        style={{
          right: 0,
          top: 0,
          width: "50vw",
          height: "100%",
          background: "linear-gradient(135deg, transparent 0%, rgba(3,152,158,0.06) 100%)",
        }}
      />
      <div
        className="absolute"
        style={{
          right: "5vw",
          top: "5vh",
          width: "25vw",
          height: "25vw",
          borderRadius: "50%",
          border: "1px solid rgba(109,189,242,0.1)",
        }}
      />
      <div
        className="absolute"
        style={{
          right: "7vw",
          top: "7vh",
          width: "17vw",
          height: "17vw",
          borderRadius: "50%",
          border: "1px solid rgba(109,189,242,0.07)",
        }}
      />
      <div
        className="absolute"
        style={{
          left: "4vw",
          bottom: "4vh",
          width: "12vw",
          height: "12vw",
          borderRadius: "50%",
          background: "rgba(3,152,158,0.07)",
        }}
      />

      <div className="relative h-full flex flex-col justify-between" style={{ padding: "5vh 6vw 4vh 7vw" }}>
        <div>
          <img
            src={`${base}logo.png`}
            crossOrigin="anonymous"
            alt="Authentic Steps logo"
            style={{ height: "6vh", width: "auto", filter: "brightness(0) invert(1)" }}
          />
        </div>

        <div>
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
            The Next Step, John
          </div>
          <h2
            style={{
              fontFamily: "Inter, sans-serif",
              fontWeight: 900,
              fontSize: "5.2vw",
              color: "#fff7f0",
              lineHeight: 1.0,
              letterSpacing: "-0.03em",
              margin: "0 0 2vh 0",
              textWrap: "balance",
            }}
          >
            Let's keep building — and make this profitable.
          </h2>
          <div
            style={{
              height: "0.4vh",
              width: "8vw",
              background: "#03989e",
              marginBottom: "2.5vh",
            }}
          />
          <p
            style={{
              fontFamily: "Inter, sans-serif",
              fontWeight: 400,
              fontSize: "2.4vw",
              color: "rgba(255,247,240,0.7)",
              margin: "0 0 2.5vh 0",
              lineHeight: 1.5,
              maxWidth: "58vw",
            }}
          >
            The foundation is there. We complete the structure, build the backend together, launch — and build something that pays for itself.
          </p>
          <div
            style={{
              display: "inline-block",
              background: "#03989e",
              color: "#fff7f0",
              fontFamily: "Inter, sans-serif",
              fontWeight: 700,
              fontSize: "2.4vw",
              letterSpacing: "0.02em",
              padding: "1.5vh 3vw",
            }}
          >
            Johaan Kaa — your development partner
          </div>
        </div>

        <div
          style={{
            fontFamily: "Inter, sans-serif",
            fontWeight: 400,
            fontSize: "2.2vw",
            color: "rgba(255,247,240,0.4)",
          }}
        >
          Presented to John Rutter · Authentic Steps For Youth · 2026
        </div>
      </div>
    </div>
  );
}
