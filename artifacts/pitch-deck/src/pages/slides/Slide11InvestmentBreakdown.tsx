const base = import.meta.env.BASE_URL;

export default function Slide11InvestmentBreakdown() {
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
          right: 0,
          bottom: 0,
          width: "358.4px",
          height: "358.4px",
          borderRadius: "50% 0 0 0",
          background: "rgba(3,152,158,0.07)",
        }}
      />

      <div
        className="relative h-full flex flex-col justify-center"
        style={{ padding: "43.2px 70.4px 43.2px 89.6px" }}
      >
        <div
          style={{
            fontFamily: "Inter, sans-serif",
            fontWeight: 700,
            fontSize: "25.6px",
            color: "#03989e",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            marginBottom: "10.8px",
          }}
        >
          The Access Model
        </div>
        <h2
          style={{
            fontFamily: "Inter, sans-serif",
            fontWeight: 900,
            fontSize: "57.6px",
            color: "#fff7f0",
            lineHeight: 1.05,
            letterSpacing: "-0.025em",
            margin: "0 0 32.4px 0",
            textWrap: "balance",
          }}
        >
          Open sign-up. Lower barrier. More young people helped.
        </h2>

        <div style={{ display: "flex", gap: "28.8px", alignItems: "stretch", marginBottom: "28.8px" }}>
          <div
            style={{
              flex: 1,
              background: "rgba(255,247,240,0.05)",
              border: "1px solid rgba(255,247,240,0.15)",
              borderRadius: "10.24px",
              padding: "20.48px 25.6px",
            }}
          >
            <div
              style={{
                fontFamily: "Inter, sans-serif",
                fontWeight: 700,
                fontSize: "20.48px",
                color: "rgba(255,247,240,0.5)",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                marginBottom: "8.64px",
              }}
            >
              What changed
            </div>
            <div
              style={{
                fontFamily: "Inter, sans-serif",
                fontWeight: 900,
                fontSize: "33.28px",
                color: "#6dbdf2",
                marginBottom: "10.8px",
              }}
            >
              Invite-only → Open sign-up
            </div>
            <p
              style={{
                fontFamily: "Inter, sans-serif",
                fontWeight: 400,
                fontSize: "26.24px",
                color: "rgba(255,247,240,0.75)",
                margin: 0,
                lineHeight: 1.45,
              }}
            >
              We removed the agency dashboard and invite system. Any young person can now create an account and access the full app — no middleman, no waiting, no cost.
            </p>
          </div>

          <div
            style={{
              flex: 1,
              background: "rgba(3,152,158,0.1)",
              border: "1.5px solid rgba(3,152,158,0.4)",
              borderRadius: "10.24px",
              padding: "20.48px 25.6px",
            }}
          >
            <div
              style={{
                fontFamily: "Inter, sans-serif",
                fontWeight: 700,
                fontSize: "20.48px",
                color: "rgba(255,247,240,0.5)",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                marginBottom: "8.64px",
              }}
            >
              Why it's better
            </div>
            <div
              style={{
                fontFamily: "Inter, sans-serif",
                fontWeight: 900,
                fontSize: "33.28px",
                color: "#03989e",
                marginBottom: "10.8px",
              }}
            >
              Mission alignment
            </div>
            <p
              style={{
                fontFamily: "Inter, sans-serif",
                fontWeight: 400,
                fontSize: "26.24px",
                color: "rgba(255,247,240,0.75)",
                margin: 0,
                lineHeight: 1.45,
              }}
            >
              Every young person deserves access — not just those whose school or counsellor happens to have an account. Open sign-up is the honest, youth-first approach.
            </p>
          </div>
        </div>

        <div
          style={{
            borderTop: "1px solid rgba(3,152,158,0.3)",
            paddingTop: "20.48px",
            display: "flex",
            gap: "51.2px",
            alignItems: "flex-start",
          }}
        >
          {[
            { icon: "🎓", label: "Grant funding", detail: "Youth mental health grants from govt. &amp; philanthropy" },
            { icon: "🤝", label: "Partnerships", detail: "Counsellors, school wellbeing teams, youth orgs" },
            { icon: "⭐", label: "Future premium", detail: "Optional paid features for organisations &amp; clinicians" },
          ].map((item) => (
            <div key={item.label} style={{ flex: 1 }}>
              <div
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontWeight: 900,
                  fontSize: "35.84px",
                  color: "#fff7f0",
                  marginBottom: "5.76px",
                }}
              >
                {item.label}
              </div>
              <div
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontWeight: 400,
                  fontSize: "24.32px",
                  color: "rgba(255,247,240,0.55)",
                  lineHeight: 1.4,
                }}
                dangerouslySetInnerHTML={{ __html: item.detail }}
              />
            </div>
          ))}
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
