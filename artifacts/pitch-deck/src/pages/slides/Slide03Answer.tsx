const base = import.meta.env.BASE_URL;

export default function Slide03Answer() {
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
          left: "76.8px",
          top: "43.2px",
          width: "256px",
          height: "256px",
          borderRadius: "50%",
          border: "1px solid rgba(109,189,242,0.1)",
        }}
      />
      <div
        className="absolute"
        style={{
          right: "102.4px",
          bottom: "57.6px",
          width: "179.2px",
          height: "179.2px",
          borderRadius: "50%",
          background: "rgba(3,152,158,0.08)",
        }}
      />

      <div className="relative h-full flex flex-col justify-center items-center" style={{ padding: "57.6px 128px" }}>
        <div
          style={{
            fontFamily: "Inter, sans-serif",
            fontWeight: 700,
            fontSize: "28.16px",
            color: "#03989e",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            marginBottom: "28.8px",
          }}
        >
          What I Built For You
        </div>

        <p
          style={{
            fontFamily: "Inter, sans-serif",
            fontWeight: 900,
            fontSize: "66.56px",
            color: "#fff7f0",
            lineHeight: 1.15,
            letterSpacing: "-0.02em",
            textAlign: "center",
            textWrap: "balance",
            margin: "0 0 36px 0",
          }}
        >
          A free, private mobile app that gives young people real tools for their mental health — right in their pocket.
        </p>

        <div
          style={{
            height: "2.88px",
            width: "102.4px",
            background: "#03989e",
            marginBottom: "36px",
          }}
        />

        <div
          style={{
            display: "flex",
            gap: "51.2px",
            alignItems: "center",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontFamily: "Inter, sans-serif",
                fontWeight: 900,
                fontSize: "57.6px",
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
                fontSize: "33.28px",
                color: "rgba(255,247,240,0.6)",
                marginTop: "3.6px",
              }}
            >
              Always
            </div>
          </div>
          <div
            style={{ width: "2.56px", height: "57.6px", background: "rgba(255,247,240,0.2)" }}
          />
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontFamily: "Inter, sans-serif",
                fontWeight: 900,
                fontSize: "57.6px",
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
                fontSize: "33.28px",
                color: "rgba(255,247,240,0.6)",
                marginTop: "3.6px",
              }}
            >
              By design
            </div>
          </div>
          <div
            style={{ width: "2.56px", height: "57.6px", background: "rgba(255,247,240,0.2)" }}
          />
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontFamily: "Inter, sans-serif",
                fontWeight: 900,
                fontSize: "57.6px",
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
                fontSize: "33.28px",
                color: "rgba(255,247,240,0.6)",
                marginTop: "3.6px",
              }}
            >
              Built for them
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
    </div>
  );
}
