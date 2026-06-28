const base = import.meta.env.BASE_URL;

export default function Slide02Problem() {
  return (
    <div className="relative w-full h-full overflow-hidden" style={{ background: "#fff7f0" }}>
      <div
        className="absolute left-0 top-0 bottom-0"
        style={{ width: "7.68px", background: "#03989e" }}
      />
      <div
        className="absolute"
        style={{
          right: 0,
          top: 0,
          width: "537.6px",
          height: "100%",
          background: "linear-gradient(135deg, #193b83 0%, #0d2558 100%)",
        }}
      />
      <div
        className="absolute"
        style={{
          top: "36px",
          right: "7.68px",
          width: "5.12px",
          height: "648px",
          background: "#03989e",
        }}
      />

      <div className="relative h-full flex" style={{ paddingLeft: "89.6px" }}>
        <div className="flex flex-col justify-center" style={{ width: "665.6px", paddingRight: "51.2px" }}>
          <div
            style={{
              fontFamily: "Inter, sans-serif",
              fontWeight: 700,
              fontSize: "28.16px",
              color: "#03989e",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              marginBottom: "18px",
            }}
          >
            The Problem
          </div>
          <h2
            style={{
              fontFamily: "Inter, sans-serif",
              fontWeight: 900,
              fontSize: "53.76px",
              color: "#193b83",
              lineHeight: 1.05,
              letterSpacing: "-0.025em",
              margin: "0 0 14.4px 0",
              textWrap: "balance",
            }}
          >
            Young people are struggling — and most apps aren't built for them.
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "10.8px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "15.36px" }}>
              <div
                style={{
                  width: "6.4px",
                  height: "25.2px",
                  background: "#03989e",
                  flexShrink: 0,
                  marginTop: "2.16px",
                }}
              />
              <p style={{ fontFamily: "Inter, sans-serif", fontWeight: 400, fontSize: "28.16px", color: "#1a2535", lineHeight: 1.4, margin: 0 }}>
                1 in 7 young people live with a mental health condition
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "15.36px" }}>
              <div
                style={{
                  width: "6.4px",
                  height: "25.2px",
                  background: "#03989e",
                  flexShrink: 0,
                  marginTop: "2.16px",
                }}
              />
              <p style={{ fontFamily: "Inter, sans-serif", fontWeight: 400, fontSize: "28.16px", color: "#1a2535", lineHeight: 1.4, margin: 0 }}>
                Most support tools are hard to find, expensive, or built for adults
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "15.36px" }}>
              <div
                style={{
                  width: "6.4px",
                  height: "25.2px",
                  background: "#03989e",
                  flexShrink: 0,
                  marginTop: "2.16px",
                }}
              />
              <p style={{ fontFamily: "Inter, sans-serif", fontWeight: 400, fontSize: "28.16px", color: "#1a2535", lineHeight: 1.4, margin: 0 }}>
                Schools need practical, safe tools they can trust
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-center items-center" style={{ width: "537.6px" }}>
          <div
            style={{
              fontFamily: "Inter, sans-serif",
              fontWeight: 900,
              fontSize: "140.8px",
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
              fontSize: "33.28px",
              color: "rgba(255,247,240,0.7)",
              textAlign: "center",
              lineHeight: 1.4,
              padding: "0 38.4px",
            }}
          >
            young people experience a mental health condition
          </div>
        </div>
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
