const base = import.meta.env.BASE_URL;

export default function Slide08WhyItMatters() {
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
      <div
        className="absolute"
        style={{
          left: "64px",
          bottom: "36px",
          width: "230.4px",
          height: "230.4px",
          borderRadius: "50%",
          background: "rgba(3,152,158,0.07)",
        }}
      />

      <div className="relative h-full flex flex-col justify-center" style={{ padding: "57.6px 102.4px 57.6px 89.6px" }}>
        <div
          style={{
            fontFamily: "Inter, sans-serif",
            fontWeight: 700,
            fontSize: "28.16px",
            color: "#03989e",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            marginBottom: "21.6px",
          }}
        >
          Why It Matters
        </div>

        <blockquote
          style={{
            fontFamily: "Inter, sans-serif",
            fontWeight: 900,
            fontSize: "83.2px",
            color: "#193b83",
            lineHeight: 1.1,
            letterSpacing: "-0.03em",
            margin: "0 0 28.8px 0",
            textWrap: "balance",
          }}
        >
          Every young person deserves a tool in their pocket.
        </blockquote>

        <div
          style={{
            height: "2.88px",
            width: "76.8px",
            background: "#03989e",
            marginBottom: "28.8px",
          }}
        />

        <p
          style={{
            fontFamily: "Inter, sans-serif",
            fontWeight: 400,
            fontSize: "38.4px",
            color: "#5a6a7a",
            lineHeight: 1.5,
            margin: 0,
            maxWidth: "896px",
            textWrap: "pretty",
          }}
        >
          Not a product. Not a platform. A genuine act of care — built so no young person has to face a hard moment with nothing to reach for.
        </p>
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
  );
}
