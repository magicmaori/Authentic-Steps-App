const base = import.meta.env.BASE_URL;

const scenarios = [
  {
    label: "100 Schools",
    schools: 100,
    math: "$5,000 × 12 × 100",
    value: 6_000_000,
    display: "$6M",
    color: "#03989e",
    highlight: true,
  },
  {
    label: "33 Schools  (⅓ scale)",
    schools: 33,
    math: "$5,000 × 12 × 33",
    value: 1_980_000,
    display: "≈ $2M",
    color: "#6dbdf2",
    highlight: false,
  },
  {
    label: "25 Schools  (¼ scale)",
    schools: 25,
    math: "$5,000 × 12 × 25",
    value: 1_500_000,
    display: "≈ $1.5M",
    color: "#6dbdf2",
    highlight: false,
  },
];

const MAX_VALUE = 6_000_000;
const MAX_BAR_PCT = 72;

export default function Slide11InvestmentBreakdown() {
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
          right: 0,
          bottom: 0,
          width: "28vw",
          height: "28vw",
          borderRadius: "50% 0 0 0",
          background: "rgba(3,152,158,0.07)",
        }}
      />

      <div
        className="relative h-full flex flex-col"
        style={{ padding: "4.5vh 5.5vw 0 7vw" }}
      >
        <div
          style={{
            fontFamily: "Inter, sans-serif",
            fontWeight: 700,
            fontSize: "2vw",
            color: "#03989e",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            marginBottom: "1vh",
          }}
        >
          Investment Breakdown
        </div>
        <h2
          style={{
            fontFamily: "Inter, sans-serif",
            fontWeight: 900,
            fontSize: "4.2vw",
            color: "#fff7f0",
            lineHeight: 1.05,
            letterSpacing: "-0.025em",
            margin: "0 0 0.8vh 0",
          }}
        >
          $5,000 / month per school
        </h2>

        <div
          style={{
            display: "flex",
            gap: "2.5vw",
            alignItems: "center",
            marginBottom: "3.5vh",
          }}
        >
          {[
            { label: "Monthly subscription", value: "$5,000" },
            { label: "Contract term", value: "12 months" },
            { label: "Renewal", value: "Auto-renewing" },
          ].map((pill) => (
            <div
              key={pill.label}
              style={{
                border: "1px solid rgba(3,152,158,0.5)",
                borderRadius: "4px",
                padding: "0.6vh 1.2vw",
                display: "flex",
                flexDirection: "column",
                gap: "0.15vh",
              }}
            >
              <div
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontWeight: 700,
                  fontSize: "2.6vw",
                  color: "#fff7f0",
                  lineHeight: 1,
                }}
              >
                {pill.value}
              </div>
              <div
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontWeight: 400,
                  fontSize: "1.5vw",
                  color: "rgba(255,247,240,0.55)",
                }}
              >
                {pill.label}
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            fontFamily: "Inter, sans-serif",
            fontWeight: 700,
            fontSize: "1.6vw",
            color: "rgba(255,247,240,0.5)",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            marginBottom: "1.8vh",
          }}
        >
          Annual gross revenue — scenarios
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "2.2vh", flex: 1 }}>
          {scenarios.map((s) => {
            const pct = (s.value / MAX_VALUE) * MAX_BAR_PCT;
            return (
              <div key={s.label} style={{ display: "flex", alignItems: "center", gap: "1.8vw" }}>
                <div
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontWeight: 600,
                    fontSize: "1.8vw",
                    color: "rgba(255,247,240,0.7)",
                    width: "16vw",
                    flexShrink: 0,
                    lineHeight: 1.25,
                  }}
                >
                  {s.label}
                </div>

                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.4vh" }}>
                  <div
                    style={{
                      fontFamily: "Inter, sans-serif",
                      fontWeight: 400,
                      fontSize: "1.4vw",
                      color: "rgba(255,247,240,0.4)",
                    }}
                  >
                    {s.math} =
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "1vw" }}>
                    <div
                      style={{
                        height: "3.8vh",
                        width: `${pct}%`,
                        background: s.highlight
                          ? "linear-gradient(90deg, #03989e 0%, #05b5bc 100%)"
                          : `linear-gradient(90deg, ${s.color}55 0%, ${s.color}88 100%)`,
                        borderRadius: "2px",
                        flexShrink: 0,
                        transition: "width 0.3s ease",
                      }}
                    />
                    <div
                      style={{
                        fontFamily: "Inter, sans-serif",
                        fontWeight: 900,
                        fontSize: s.highlight ? "3.2vw" : "2.6vw",
                        color: s.highlight ? "#03989e" : s.color,
                        letterSpacing: "-0.02em",
                        flexShrink: 0,
                      }}
                    >
                      {s.display}
                    </div>
                    {s.highlight && (
                      <div
                        style={{
                          fontFamily: "Inter, sans-serif",
                          fontWeight: 700,
                          fontSize: "1.5vw",
                          color: "#fff7f0",
                          background: "#03989e",
                          padding: "0.3vh 0.8vw",
                          borderRadius: "3px",
                          flexShrink: 0,
                        }}
                      >
                        Annual gross
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div
          style={{
            borderTop: "1px solid rgba(3,152,158,0.3)",
            marginTop: "2.5vh",
            paddingTop: "2vh",
            paddingBottom: "2.8vh",
            display: "flex",
            alignItems: "center",
            gap: "1.5vw",
          }}
        >
          <div
            style={{
              width: "0.4vw",
              height: "5vh",
              background: "#03989e",
              flexShrink: 0,
              borderRadius: "2px",
            }}
          />
          <div
            style={{
              fontFamily: "Inter, sans-serif",
              fontWeight: 400,
              fontSize: "1.9vw",
              color: "rgba(255,247,240,0.65)",
              lineHeight: 1.45,
              maxWidth: "70vw",
            }}
          >
            <span style={{ fontWeight: 700, color: "#fff7f0" }}>Community giving-back model: </span>
            larger schools subsidise smaller schools that need support — keeping the app accessible for every young person, regardless of school size or budget.
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
