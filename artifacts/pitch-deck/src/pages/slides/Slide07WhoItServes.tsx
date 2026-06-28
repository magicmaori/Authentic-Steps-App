const base = import.meta.env.BASE_URL;

export default function Slide07WhoItServes() {
  return (
    <div
      className="relative w-full h-full overflow-hidden"
      style={{ background: "linear-gradient(135deg, #193b83 0%, #0d2558 100%)" }}
    >
      <div
        className="absolute left-0 top-0 bottom-0"
        style={{ width: "7.68px", background: "#03989e" }}
      />
      <div
        className="absolute"
        style={{
          right: "38.4px",
          top: "21.6px",
          width: "281.6px",
          height: "281.6px",
          borderRadius: "50%",
          border: "1px solid rgba(109,189,242,0.1)",
        }}
      />

      <div className="relative h-full flex flex-col justify-center" style={{ padding: "43.2px 70.4px 43.2px 89.6px" }}>
        <div
          style={{
            fontFamily: "Inter, sans-serif",
            fontWeight: 700,
            fontSize: "28.16px",
            color: "#03989e",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            marginBottom: "14.4px",
          }}
        >
          Who This Serves
        </div>
        <h2
          style={{
            fontFamily: "Inter, sans-serif",
            fontWeight: 900,
            fontSize: "64px",
            color: "#fff7f0",
            lineHeight: 1.05,
            letterSpacing: "-0.025em",
            margin: "0 0 32.4px 0",
            textWrap: "balance",
          }}
        >
          Built for young people. Trusted by the adults around them.
        </h2>

        <div style={{ display: "flex", gap: "32px" }}>
          <div
            style={{
              flex: 1,
              borderLeft: "5.12px solid #6dbdf2",
              paddingLeft: "25.6px",
            }}
          >
            <div
              style={{
                fontFamily: "Inter, sans-serif",
                fontWeight: 900,
                fontSize: "44.8px",
                color: "#6dbdf2",
                marginBottom: "10.8px",
              }}
            >
              Young People
            </div>
            <p style={{ fontFamily: "Inter, sans-serif", fontWeight: 400, fontSize: "35.84px", color: "rgba(255,247,240,0.8)", margin: 0, lineHeight: 1.4 }}>
              Ages 11–25 who need a private, safe space to manage their mental wellbeing
            </p>
          </div>

          <div
            style={{
              flex: 1,
              borderLeft: "5.12px solid #03989e",
              paddingLeft: "25.6px",
            }}
          >
            <div
              style={{
                fontFamily: "Inter, sans-serif",
                fontWeight: 900,
                fontSize: "44.8px",
                color: "#03989e",
                marginBottom: "10.8px",
              }}
            >
              Schools
            </div>
            <p style={{ fontFamily: "Inter, sans-serif", fontWeight: 400, fontSize: "35.84px", color: "rgba(255,247,240,0.8)", margin: 0, lineHeight: 1.4 }}>
              A tool schools can confidently recommend — free, safe, and no account required
            </p>
          </div>

          <div
            style={{
              flex: 1,
              borderLeft: "5.12px solid #fff7f0",
              paddingLeft: "25.6px",
            }}
          >
            <div
              style={{
                fontFamily: "Inter, sans-serif",
                fontWeight: 900,
                fontSize: "44.8px",
                color: "#fff7f0",
                marginBottom: "10.8px",
              }}
            >
              Counsellors
            </div>
            <p style={{ fontFamily: "Inter, sans-serif", fontWeight: 400, fontSize: "35.84px", color: "rgba(255,247,240,0.8)", margin: 0, lineHeight: 1.4 }}>
              A bridge between sessions — something tangible to put in a young person's hands
            </p>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 right-0" style={{ padding: "21.6px 51.2px" }}>
        <img
          src={`${base}logo.png`}
          crossOrigin="anonymous"
          alt="Authentic Steps logo"
          style={{ height: "28.8px", width: "auto", filter: "brightness(0) invert(1)", opacity: 0.4 }}
        />
      </div>
    </div>
  );
}
