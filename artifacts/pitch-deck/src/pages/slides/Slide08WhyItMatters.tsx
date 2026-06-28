const base = import.meta.env.BASE_URL;

export default function Slide08WhyItMatters() {
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
      <div
        className="absolute"
        style={{
          left: "5vw",
          bottom: "5vh",
          width: "18vw",
          height: "18vw",
          borderRadius: "50%",
          background: "rgba(3,152,158,0.07)",
        }}
      />

      <div className="relative h-full flex flex-col justify-center" style={{ padding: "8vh 8vw 8vh 7vw" }}>
        <div
          style={{
            fontFamily: "Inter, sans-serif",
            fontWeight: 700,
            fontSize: "2.2vw",
            color: "#03989e",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            marginBottom: "3vh",
          }}
        >
          Why It Matters
        </div>

        <blockquote
          style={{
            fontFamily: "Inter, sans-serif",
            fontWeight: 900,
            fontSize: "6.5vw",
            color: "#193b83",
            lineHeight: 1.1,
            letterSpacing: "-0.03em",
            margin: "0 0 4vh 0",
            textWrap: "balance",
          }}
        >
          Every young person deserves a tool in their pocket.
        </blockquote>

        <div
          style={{
            height: "0.4vh",
            width: "6vw",
            background: "#03989e",
            marginBottom: "4vh",
          }}
        />

        <p
          style={{
            fontFamily: "Inter, sans-serif",
            fontWeight: 400,
            fontSize: "3vw",
            color: "#5a6a7a",
            lineHeight: 1.5,
            margin: 0,
            maxWidth: "70vw",
            textWrap: "pretty",
          }}
        >
          Not a product. Not a platform. A genuine act of care — built so no young person has to face a hard moment with nothing to reach for.
        </p>
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
  );
}
