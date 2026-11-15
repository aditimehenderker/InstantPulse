import { useEffect, useRef, useState } from "react";
import { supabase } from "./lib/supabaseClient";

// InstantPulse: educational astronaut health prototype.
// Use fictional demonstration data only.

const STORAGE = "instantpulse_mission_suite_v2";

const today = () =>
  new Date().toLocaleDateString("en-CA");

const empty = () => ({
  goal: 2200,
  hydration: [],
  wellness: [],
  cognition: [],
  cabin: [],
  gravity: [],
  eva: [],
});

function load() {
  try {
    const raw = JSON.parse(
      localStorage.getItem(STORAGE) || "null"
    );
    const base = empty();

    if (!raw || typeof raw !== "object") {
      return base;
    }

    for (const key of Object.keys(base)) {
      base[key] = Array.isArray(base[key])
        ? Array.isArray(raw[key])
          ? raw[key]
          : []
        : Number(raw[key]) || 2200;
    }

    return base;
  } catch {
    return empty();
  }
}

const median = (numbers) => {
  const values = [...numbers].sort((a, b) => a - b);

  if (!values.length) return null;

  const middle = Math.floor(values.length / 2);

  return values.length % 2
    ? values[middle]
    : (values[middle - 1] + values[middle]) / 2;
};

const valid = (value, min, max) =>
  value !== "" &&
  Number.isFinite(Number(value)) &&
  Number(value) >= min &&
  Number(value) <= max;

const forms = {
  wellness: {
    title: "🧠 MindPulse — Mental Wellness",
    intro:
      "Voluntary mood, stress, sleep and isolation check-ins during long-duration missions.",
    fields: [
      ["mood", "Mood (1 low – 5 excellent)", 1, 5],
      ["stress", "Stress (1 low – 5 high)", 1, 5],
      ["loneliness", "Loneliness (1–5)", 1, 5],
      ["fatigue", "Fatigue (1–5)", 1, 5],
      ["sleep", "Hours slept", 0, 24],
    ],
  },

  cabin: {
    title: "🌬️ Cabin Health Intelligence",
    intro:
      "Record cabin environmental measurements and review possible connections with reported symptoms.",
    fields: [
      ["co2", "Carbon dioxide (ppm)", 0, 50000],
      ["temperature", "Cabin temperature (°C)", -20, 70],
      ["humidity", "Relative humidity (%)", 0, 100],
    ],
  },

  gravity: {
    title: "🦴 Microgravity Adaptation",
    intro:
      "Monitor exercise, muscle fatigue, coordination and vision concerns while in space.",
    fields: [
      ["exercise", "Exercise minutes", 0, 1440],
      ["fatigue", "Muscle fatigue (1–5)", 1, 5],
      ["balance", "Balance concerns (1–5)", 1, 5],
      ["vision", "Vision changes (0 no, 1 yes)", 0, 1],
    ],
  },

  eva: {
    title: "👩‍🚀 Post-Spacewalk Recovery",
    intro:
      "Track fatigue and physical discomfort following an extravehicular activity.",
    fields: [
      ["minutes", "EVA duration (minutes)", 1, 1440],
      ["fatigue", "Fatigue (1–5)", 1, 5],
      ["discomfort", "Physical discomfort (1–5)", 1, 5],
    ],
  },
};

const hazards = [
  {
    name: "Space Radiation",
    icon: "☀️",
    what:
      "Beyond Earth's protective magnetic field, astronauts can encounter galactic cosmic rays and solar particle events.",
    impact:
      "Radiation can increase long-term cancer and other health risks. Major solar particle events can also cause acute exposure hazards.",
    monitor:
      "Qualified radiation dosimeters, spacecraft radiation sensors and mission-approved exposure records.",
    response:
      "Follow approved radiation shielding, monitoring and emergency shelter procedures.",
    limit:
      "Ordinary vital signs cannot measure radiation exposure.",
  },
  {
    name: "Isolation and Confinement",
    icon: "🧠",
    what:
      "Astronauts spend long periods in small living spaces, separated from family and exposed to demanding workloads.",
    impact:
      "Stress, sleep disruption, cognitive fatigue, mood changes and interpersonal difficulties can occur.",
    monitor:
      "Voluntary mood check-ins, sleep logs, fatigue tracking and professionally validated assessments.",
    response:
      "Use approved behavioral-health and crew-support resources.",
    limit:
      "Mood questionnaires cannot diagnose mental illness.",
  },
  {
    name: "Distance from Earth",
    icon: "📡",
    what:
      "Communication delays and interruptions can prevent immediate assistance from mission control.",
    impact:
      "Crew members need reliable onboard records, medical references and independent operational capabilities.",
    monitor:
      "Locally available health records, communication status and onboard medical resources.",
    response:
      "Follow approved onboard medical procedures and consult qualified crew members.",
    limit:
      "This prototype is not a certified onboard medical system.",
  },
  {
    name: "Altered Gravity",
    icon: "🦴",
    what:
      "Microgravity changes fluid distribution and reduces normal loading on the skeleton and muscles.",
    impact:
      "Possible effects include muscle atrophy, bone loss, balance changes, cardiovascular deconditioning and vision concerns.",
    monitor:
      "Exercise records, symptom reports, cardiovascular measurements and qualified medical examinations.",
    response:
      "Follow mission-specific exercise and medical countermeasure procedures.",
    limit:
      "Self-reports cannot directly measure bone loss or diagnose SANS.",
  },
  {
    name: "Hostile Closed Environments",
    icon: "🌬️",
    what:
      "Spacecraft depend on controlled air composition, water quality, temperature, humidity and life-support equipment.",
    impact:
      "Environmental problems can contribute to headaches, fatigue, respiratory discomfort and other health concerns.",
    monitor:
      "Verified carbon dioxide, temperature, humidity and air-quality readings alongside symptom reports.",
    response:
      "Confirm environmental readings and follow spacecraft environmental and medical procedures.",
    limit:
      "This application cannot certify that spacecraft air is safe.",
  },
];

const css = `
.ms-open {
  position: fixed;
  right: 20px;
  bottom: 20px;
  z-index: 9900;
  border: 0;
  border-radius: 24px;
  background: #267fca;
  color: white;
  padding: 14px 20px;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 8px 22px #2b7aae55;
}

.ms-app,
.ms-app * {
  box-sizing: border-box;
}

.ms-app {
  position: fixed;
  inset: 0;
  z-index: 9901;
  overflow: auto;
  background: linear-gradient(
    125deg,
    #f6fbff,
    #e4f4ff 65%,
    #cdeaff
  );
  font: 14px/1.5 system-ui, Arial;
  color: #173a63;
}

.ms-app button,
.ms-app input {
  font: inherit;
}

.ms-header {
  position: sticky;
  top: 0;
  background: #e0f2ff;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid #b4d8f0;
  padding: 18px 24px;
  z-index: 1;
}

.ms-header h2 {
  margin: 0;
  color: #173a63;
}

.ms-content {
  max-width: 1150px;
  padding: 20px;
  margin: auto;
}

.ms-tabs {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 18px;
}

.ms-tab {
  border: 1px solid #b5d9f3;
  background: white;
  color: #245478;
  padding: 10px 12px;
  border-radius: 10px;
  cursor: pointer;
}

.ms-tab.active {
  background: #a8ddff;
  border-color: #55afea;
}

.ms-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.ms-card {
  background: white;
  border: 1px solid #c4e3f7;
  border-radius: 16px;
  padding: 19px;
  margin-bottom: 16px;
  box-shadow: 0 5px 18px #428ac116;
}

.ms-card h3 {
  margin: 0 0 12px;
  color: #173a63;
}

.ms-card p {
  color: #355a79;
}

.ms-stat {
  font-size: 27px;
  font-weight: 800;
  color: #236ea8;
}

.ms-label {
  display: block;
  color: #204c71;
  font-weight: 600;
  margin: 12px 0;
}

.ms-input {
  display: block;
  width: 100%;
  border: 1px solid #b8d9ec;
  background: #f6fbff;
  border-radius: 9px;
  padding: 10px;
  color: #173a63;
  margin-top: 5px;
}

.ms-btn {
  background: #2f83c8;
  border: 0;
  border-radius: 10px;
  color: white;
  padding: 11px 14px;
  font-weight: 700;
  cursor: pointer;
  margin: 5px 6px 5px 0;
}

.ms-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.ms-quiet {
  background: #dbf0ff;
  color: #214b71;
}

.ms-note {
  border: 1px solid #c6e4f7;
  background: #eaf7ff;
  border-radius: 10px;
  padding: 12px;
  margin-top: 12px;
  color: #2e5677;
}

.ms-warning {
  background: #fff5e6;
  border-color: #efd6ae;
}

.ms-list {
  padding-left: 19px;
}

.ms-list li {
  padding: 7px 0;
  color: #385e7f;
}

.ms-meter {
  height: 13px;
  border-radius: 20px;
  background: #e1f2ff;
  overflow: hidden;
  margin: 12px 0;
}

.ms-meter > div {
  height: 100%;
  background: #3298dc;
}

.ms-signal {
  height: 140px;
  width: 100%;
  border: 0;
  border-radius: 15px;
  background: #d5eafa;
  color: #173a63;
  font-size: 21px;
  font-weight: bold;
  cursor: pointer;
}

.ms-signal.ready {
  background: #b7efd0;
  color: #14633f;
}

.ms-signal.early {
  background: #ffe3e3;
  color: #972a2a;
}

.ms-hazard {
  display: block;
  width: 100%;
  border: 1px solid #c5e2f5;
  background: #f2faff;
  color: #21496f;
  border-radius: 10px;
  padding: 12px;
  margin-bottom: 8px;
  cursor: pointer;
  text-align: left;
}

.ms-hazard.active {
  background: #b8e1fb;
}

.ms-footer {
  text-align: center;
  color: #54718a;
  margin: 25px 0;
  font-size: 12px;
}

.ms-app a {
  color: #135f9c;
}

@media (max-width: 720px) {
  .ms-grid {
    grid-template-columns: 1fr;
  }

  .ms-header {
    padding: 12px;
  }

  .ms-content {
    padding: 12px;
  }
}
`;

function Card({ title, children }) {
  return (
    <section className="ms-card">
      <h3>{title}</h3>
      {children}
    </section>
  );
}

export default function MissionHealthSuite() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState("overview");
  const [data, setData] = useState(load);
  const [cloudReady, setCloudReady] = useState(false);
  const [water, setWater] = useState("250");
  const [goal, setGoal] = useState(String(data.goal));
  const [entry, setEntry] = useState({});
  const [hazard, setHazard] = useState(0);
  const [online, setOnline] = useState(
    () => navigator.onLine
  );
  const [saveError, setSaveError] = useState("");
  const [stage, setStage] = useState("idle");
  const [trials, setTrials] = useState([]);

  const timer = useRef(null);
  const readyAt = useRef(0);
  const stageRef = useRef("idle");

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE, JSON.stringify(data));
      setSaveError("");
    } catch {
      setSaveError("Browser could not save the records.");
    }
  }, [data]);
  useEffect(() => {
  let cancelled = false;

  async function loadCloudOnStart() {
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;

      if (!user) {
        console.warn("Supabase session not ready.");
        return;
      }

      const { data: cloudRow, error } = await supabase
        .from("mission_health_records")
        .select("payload")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      if (cancelled) return;

      const cloud = cloudRow?.payload;

      if (cloud && typeof cloud === "object") {
        setData((current) => {
          const merged = { ...current };

          const categories = [
            "hydration",
            "wellness",
            "cognition",
            "cabin",
            "gravity",
            "eva",
          ];

          categories.forEach((category) => {
            const cloudItems = Array.isArray(cloud[category])
              ? cloud[category]
              : [];

            const localItems = Array.isArray(current[category])
              ? current[category]
              : [];

            const unique = new Map();

            [...cloudItems, ...localItems].forEach((item) => {
              if (!item || typeof item !== "object") return;

              const key = item.id ?? JSON.stringify(item);
              unique.set(key, item);
            });

            merged[category] = [...unique.values()];
          });

          const cloudGoal = Number(cloud.goal);

          if (
            current.goal === 2200 &&
            cloudGoal >= 250 &&
            cloudGoal <= 6000
          ) {
            merged.goal = cloudGoal;
          }

          return merged;
        });
      }

      setCloudReady(true);

      console.log("✅ Supabase startup loading completed.");
    } catch (error) {
      console.error("Cloud loading failed:", error);
    }
  }

  loadCloudOnStart();

  return () => {
    cancelled = true;
  };
}, []);



  useEffect(() => {
    const yes = () => setOnline(true);
    const no = () => setOnline(false);

    window.addEventListener("online", yes);
    window.addEventListener("offline", no);

    return () => {
      window.removeEventListener("online", yes);
      window.removeEventListener("offline", no);
    };
  }, []);

  useEffect(() => {
    return () => clearTimeout(timer.current);
  }, []);
 // Automatically save Mission Health Suite records to Supabase

  useEffect(() => {
    if (!cloudReady || !online) return;

    const timeout = setTimeout(async () => {
      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) throw authError;

        if (!user) {
          console.warn("Supabase user not available.");
          return;
        }

        const { error } = await supabase
          .from("mission_health_records")
          .upsert(
            {
              user_id: user.id,
              payload: data,
              updated_at: new Date().toISOString(),
            },
            {
              onConflict: "user_id",
            }
          );

        if (error) throw error;

        console.log("✅ Mission health data auto-saved!");
      } catch (error) {
        console.error(
          "Automatic Supabase save failed:",
          error
        );
      }
    }, 1200);

    return () => clearTimeout(timeout);
  }, [data, cloudReady, online]);


  function add(type, details) {
    setData((old) => ({
      ...old,
      [type]: [
        ...old[type],
        {
          id: `${Date.now()}-${Math.random()}`,
          day: today(),
          at: new Date().toISOString(),
          ...details,
        },
      ],
    }));
  }

  const logged = data.hydration
    .filter((x) => x.day === today())
    .reduce((sum, x) => sum + Number(x.ml), 0);

  const latest = (type) => data[type].at(-1);

  const wellness = latest("wellness");
  const cabin = latest("cabin");
  const cognition = latest("cognition");

  const baseline =
    data.cognition.length >= 3
      ? median(
          data.cognition.slice(0, 3).map((x) => x.median)
        )
      : null;

  const insights = [];

  if (
    wellness?.day === today() &&
    Number(wellness.stress) >= 4
  ) {
    insights.push(
      "Higher stress recorded. Review workload, rest and crew behavioral-health resources."
    );
  }

  if (
    wellness?.day === today() &&
    Number(wellness.sleep) < 6
  ) {
    insights.push(
      "Short sleep reported. Consider follow-up monitoring of fatigue and attention."
    );
  }

  if (
    data.hydration.some((x) => x.day === today()) &&
    logged < data.goal
  ) {
    insights.push(
      `Fluid logged today (${logged} mL) is below the selected example goal (${data.goal} mL). This does not establish dehydration.`
    );
  }

  if (
    baseline &&
    cognition &&
    data.cognition.length >= 4 &&
    cognition.median > baseline * 1.3
  ) {
    insights.push(
      "Reaction-time practice was slower than the early-session comparison. Practice and device latency can influence results."
    );
  }

  if (
    cabin?.day === today() &&
    wellness?.day === today() &&
    Number(wellness.fatigue) >= 4
  ) {
    insights.push(
      "Cabin measurements and fatigue were recorded today. Their coincidence does not establish causation."
    );
  }

  if (
    latest("gravity")?.day === today() &&
    Number(latest("gravity").vision) === 1
  ) {
    insights.push(
      "New vision changes were reported. Use the crew's approved medical assessment procedures."
    );
  }

  function changeStage(value) {
    stageRef.current = value;
    setStage(value);
  }

  function begin() {
    clearTimeout(timer.current);
    changeStage("waiting");

    timer.current = setTimeout(() => {
      readyAt.current = performance.now();
      changeStage("ready");
    }, 1800 + Math.random() * 1900);
  }

  function react() {
    if (stageRef.current === "waiting") {
      clearTimeout(timer.current);
      changeStage("early");
      return;
    }

    if (stageRef.current === "ready") {
      setTrials((old) => [
        ...old,
        Math.round(performance.now() - readyAt.current),
      ]);
      changeStage("idle");
    }
  }
async function saveToSupabase() {
  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      throw authError;
    }

    if (!user) {
      alert("No Supabase session found. Refresh InstantPulse.");
      return;
    }

    const { error } = await supabase
      .from("mission_health_records")
      .upsert(
        {
          user_id: user.id,
          payload: data,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id",
        }
      );

    if (error) {
      throw error;
    }

    alert("✅ Mission health records saved to Supabase!");
  } catch (error) {
    console.error("Supabase save failed:", error);

    alert(
      "Could not save to Supabase: " +
        (error.message || "Unknown error")
    );
  }
}

async function loadFromSupabase() {
  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) throw authError;

    if (!user) {
      alert("No Supabase session found.");
      return;
    }

    const { data: cloudRecord, error } = await supabase
      .from("mission_health_records")
      .select("payload")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) throw error;

    if (!cloudRecord) {
      alert("No cloud records found yet.");
      return;
    }

    const cloud = cloudRecord.payload;

    if (!cloud || typeof cloud !== "object") {
      throw new Error("Invalid cloud data.");
    }

    const categories = [
      "hydration",
      "wellness",
      "cognition",
      "cabin",
      "gravity",
      "eva",
    ];

    setData((current) => {
      const merged = { ...cloud, ...current };

      categories.forEach((category) => {
        const cloudItems = Array.isArray(cloud[category])
          ? cloud[category]
          : [];

        const localItems = Array.isArray(current[category])
          ? current[category]
          : [];

        const combined = [...cloudItems, ...localItems];

        merged[category] = Array.from(
          new Map(
            combined.map((item) => [
              item.id ?? JSON.stringify(item),
              item,
            ])
          ).values()
        );
      });

      return merged;
    });

    alert("✅ Cloud records loaded and merged!");
  } catch (error) {
    console.error("Cloud loading failed:", error);

    alert(
      "Unable to load records: " +
        (error.message || "Unknown error")
    );
  }
}


  function exportData() {
    const blob = new Blob(
      [
        JSON.stringify(
          {
            app: "InstantPulse",
            fictionalData: true,
            exportedAt: new Date().toISOString(),
            data,
          },
          null,
          2
        ),
      ],
      { type: "application/json" }
    );

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = "instantpulse-mission-demo.json";
    anchor.click();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const tabs = [
    ["overview", "🛰️ Co-Pilot"],
    ["hydration", "💧 Hydration"],
    ["wellness", "🧠 MindPulse"],
    ["cognition", "🎯 Cognition"],
    ["cabin", "🌬️ Cabin"],
    ["gravity", "🦴 Microgravity"],
    ["eva", "👩‍🚀 EVA"],
    ["hazards", "☄️ Hazards"],
    ["offline", "📥 Offline"],
  ];

  return (
    <>
      <style>{css}</style>

      {!open && (
        <button
          type="button"
          className="ms-open"
          onClick={() => setOpen(true)}
        >
          🛰️ Open Mission Health Suite
        </button>
      )}

      {open && (
        <div
          className="ms-app"
          role="dialog"
          aria-modal="true"
          aria-label="InstantPulse Mission Health Suite"
        >
          <header className="ms-header">
            <div>
              <h2>💙 InstantPulse · Mission Health Suite</h2>
              <small>
                In-flight health-monitoring demonstration
              </small>
            </div>

            <button
              type="button"
              className="ms-btn ms-quiet"
              onClick={() => setOpen(false)}
            >
              ✕ Back to dashboard
            </button>
          </header>

          <main className="ms-content">
            <nav className="ms-tabs">
              {tabs.map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  className={`ms-tab ${
                    tab === key ? "active" : ""
                  }`}
                  onClick={() => {
                    setTab(key);
                    setEntry({});
                  }}
                >
                  {label}
                </button>
              ))}
            </nav>

            {saveError && (
              <p className="ms-note ms-warning">
                {saveError}
              </p>
            )}

            {tab === "overview" && (
              <>
                <h2>🛰️ Mission Health Co-Pilot</h2>
                <p>
                  Explainable observations from fictional
                  on-mission monitoring records.
                </p>

                <div className="ms-grid">
                  <Card title="💧 Fluids logged today">
                    <div className="ms-stat">
                      {(logged / 1000).toFixed(2)} L
                    </div>
                    <p>Example target: {data.goal} mL</p>
                  </Card>

                  <Card title="🧠 Latest mood">
                    <div className="ms-stat">
                      {wellness ? `${wellness.mood}/5` : "—"}
                    </div>
                    <p>Voluntary self-report</p>
                  </Card>

                  <Card title="🎯 Reaction time">
                    <div className="ms-stat">
                      {cognition
                        ? `${cognition.median} ms`
                        : "—"}
                    </div>
                    <p>Practice median</p>
                  </Card>

                  <Card title="🌬️ Latest cabin CO₂">
                    <div className="ms-stat">
                      {cabin ? `${cabin.co2} ppm` : "—"}
                    </div>
                    <p>Manual or simulated input</p>
                  </Card>
                </div>

                <Card title="🔎 Explainable observations">
                  {insights.length ? (
                    <ul className="ms-list">
                      {insights.map((text, index) => (
                        <li key={index}>{text}</li>
                      ))}
                    </ul>
                  ) : (
                    <p>
                      Complete check-ins to show monitoring
                      observations here.
                    </p>
                  )}

                  <div className="ms-note">
                    These are illustrative monitoring prompts,
                    not validated diagnoses, treatments or
                    safety clearances.
                  </div>
                </Card>
              </>
            )}

            {tab === "hydration" && (
              <>
                <h2>💧 Hydration Tracker</h2>
                <p>
                  Monitor logged fluid consumption during a
                  mission. Requirements vary by individual
                  and operations.
                </p>

                <div className="ms-grid">
                  <Card title="Daily intake">
                    <div className="ms-stat">
                      {logged} mL / {data.goal} mL
                    </div>

                    <div className="ms-meter">
                      <div
                        style={{
                          width: `${
                            Math.min(
                              100,
                              (100 * logged) / data.goal
                            )
                          }%`,
                        }}
                      />
                    </div>

                    <label className="ms-label">
                      Add fluid (mL)
                      <input
                        className="ms-input"
                        type="number"
                        min="1"
                        max="3000"
                        value={water}
                        onChange={(event) =>
                          setWater(event.target.value)
                        }
                      />
                    </label>

                    <button
                      className="ms-btn"
                      type="button"
                      onClick={() =>
                        valid(water, 1, 3000)
                          ? add("hydration", {
                              ml: Number(water),
                            })
                          : alert("Enter 1–3000 mL.")
                      }
                    >
                      Log fluid
                    </button>

                    <label className="ms-label">
                      Example goal (mL)
                      <input
                        className="ms-input"
                        type="number"
                        min="250"
                        max="6000"
                        value={goal}
                        onChange={(event) =>
                          setGoal(event.target.value)
                        }
                      />
                    </label>

                    <button
                      className="ms-btn ms-quiet"
                      type="button"
                      onClick={() =>
                        valid(goal, 250, 6000)
                          ? setData((old) => ({
                              ...old,
                              goal: Number(goal),
                            }))
                          : alert(
                              "Enter a goal between 250 and 6000 mL."
                            )
                      }
                    >
                      Save goal
                    </button>
                  </Card>

                  <Card title="Recent entries">
                    <ul className="ms-list">
                      {data.hydration
                        .slice(-10)
                        .reverse()
                        .map((record) => (
                          <li key={record.id}>
                            {record.ml} mL ·{" "}
                            {new Date(
                              record.at
                            ).toLocaleString()}
                          </li>
                        ))}
                    </ul>

                    <div className="ms-note">
                      Fluid intake alone cannot establish
                      dehydration or kidney-stone risk.
                    </div>
                  </Card>
                </div>
              </>
            )}

            {Object.hasOwn(forms, tab) && (
              <>
                <h2>{forms[tab].title}</h2>
                <p>{forms[tab].intro}</p>

                <div className="ms-grid">
                  <Card title="New check-in">
                    {forms[tab].fields.map(
                      ([id, label, min, max]) => (
                        <label
                          className="ms-label"
                          key={id}
                        >
                          {label}
                          <input
                            className="ms-input"
                            type="number"
                            min={min}
                            max={max}
                            step="any"
                            placeholder={`${min}–${max}`}
                            value={entry[id] ?? ""}
                            onChange={(event) =>
                              setEntry((old) => ({
                                ...old,
                                [id]: event.target.value,
                              }))
                            }
                          />
                        </label>
                      )
                    )}

                    <button
                      className="ms-btn"
                      type="button"
                      onClick={() => {
                        const fields = forms[tab].fields;

                        if (
                          !fields.every(
                            ([id, , min, max]) =>
                              valid(
                                entry[id] ?? "",
                                min,
                                max
                              )
                          )
                        ) {
                          alert(
                            "Please enter a valid value for every field."
                          );
                          return;
                        }

                        add(
                          tab,
                          Object.fromEntries(
                            fields.map(([id]) => [
                              id,
                              Number(entry[id]),
                            ])
                          )
                        );

                        setEntry({});
                      }}
                    >
                      Save check-in
                    </button>
                  </Card>

                  <Card title="Recent history">
                    {data[tab].length ? (
                      <ul className="ms-list">
                        {data[tab]
                          .slice(-8)
                          .reverse()
                          .map((record) => (
                            <li key={record.id}>
                              <b>{record.day}</b> ·{" "}
                              {forms[tab].fields
                                .map(
                                  ([id]) =>
                                    `${id}: ${record[id]}`
                                )
                                .join(" · ")}
                            </li>
                          ))}
                      </ul>
                    ) : (
                      <p>No entries yet.</p>
                    )}

                    <div className="ms-note">
                      Use fictional information only. These
                      measurements and scales are not
                      validated clinical assessments.
                    </div>
                  </Card>
                </div>
              </>
            )}

            {tab === "cognition" && (
              <>
                <h2>🎯 Cognitive Readiness Practice</h2>
                <p>
                  Complete five reaction-time trials. This
                  is not a validated fitness-for-duty test.
                </p>

                <div className="ms-grid">
                  <Card
                    title={`Reaction-time test · ${trials.length}/5`}
                  >
                    <button
                      type="button"
                      className={`ms-signal ${stage}`}
                      disabled={
                        stage !== "waiting" &&
                        stage !== "ready"
                      }
                      onClick={react}
                    >
                      {stage === "waiting"
                        ? "Wait for green…"
                        : stage === "ready"
                        ? "CLICK NOW!"
                        : stage === "early"
                        ? "Too early — retry"
                        : "Start a trial below"}
                    </button>

                    <p>
                      {trials
                        .map((time) => `${time} ms`)
                        .join(" · ")}
                    </p>

                    <button
                      className="ms-btn"
                      type="button"
                      disabled={
                        stage === "waiting" ||
                        stage === "ready" ||
                        trials.length === 5
                      }
                      onClick={begin}
                    >
                      Start trial
                    </button>

                    <button
                      className="ms-btn ms-quiet"
                      type="button"
                      onClick={() => {
                        clearTimeout(timer.current);
                        setTrials([]);
                        changeStage("idle");
                      }}
                    >
                      Reset
                    </button>

                    <button
                      className="ms-btn"
                      type="button"
                      disabled={trials.length !== 5}
                      onClick={() => {
                        add("cognition", {
                          trials,
                          median: Math.round(
                            median(trials)
                          ),
                        });
                        setTrials([]);
                        changeStage("idle");
                      }}
                    >
                      Save result
                    </button>
                  </Card>

                  <Card title="Performance history">
                    <p>
                      Early-session comparison:{" "}
                      {baseline
                        ? `${Math.round(baseline)} ms`
                        : "Not established"}
                    </p>

                    <ul className="ms-list">
                      {data.cognition
                        .slice(-8)
                        .reverse()
                        .map((record) => (
                          <li key={record.id}>
                            {record.day} ·{" "}
                            {record.median} ms
                          </li>
                        ))}
                    </ul>

                    <div className="ms-note">
                      Device latency, distractions and
                      practice effects can change results.
                    </div>
                  </Card>
                </div>
              </>
            )}

            {tab === "hazards" && (
              <>
                <h2>☄️ NASA's Five Spaceflight Hazards</h2>
                <p>
                  Scientific context, affected systems,
                  monitoring and limitations.
                </p>

                <div className="ms-grid">
                  <Card title="Choose a hazard">
                    {hazards.map((item, index) => (
                      <button
                        key={item.name}
                        type="button"
                        className={`ms-hazard ${
                          index === hazard ? "active" : ""
                        }`}
                        onClick={() => setHazard(index)}
                      >
                        {item.icon} {item.name}
                      </button>
                    ))}
                  </Card>

                  <Card
                    title={`${hazards[hazard].icon} ${hazards[hazard].name}`}
                  >
                    <b>What happens</b>
                    <p>{hazards[hazard].what}</p>

                    <b>Health impact</b>
                    <p>{hazards[hazard].impact}</p>

                    <b>How to monitor</b>
                    <p>{hazards[hazard].monitor}</p>

                    <b>Appropriate response</b>
                    <p>{hazards[hazard].response}</p>

                    <div className="ms-note ms-warning">
                      <b>Limitation:</b>{" "}
                      {hazards[hazard].limit}
                    </div>
                  </Card>
                </div>

                <Card title="Official NASA research">
                  <p>
                    <a
                      href="https://www.nasa.gov/hrp/hazards/"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Five Hazards of Human Spaceflight
                    </a>
                  </p>

                  <p>
                    <a
                      href="https://osdr.nasa.gov/"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      NASA Open Science Data Repository
                    </a>
                  </p>

                  <p>
                    These are research references, not
                    integrated live NASA datasets.
                  </p>
                </Card>
              </>
            )}

            {tab === "offline" && (
              <>
                <h2>📥 Offline Recording & Export</h2>

                <div className="ms-grid">
                  <Card title="Browser storage">
                    <p>
                      Connection reported by browser:{" "}
                      <b>
                        {online ? "Online" : "Offline"}
                      </b>
                    </p>

                    <ul className="ms-list">
                      {Object.keys(empty())
                        .filter((key) =>
                          Array.isArray(data[key])
                        )
                        .map((key) => (
                          <li key={key}>
                            {key}: {data[key].length} records
                          </li>
                        ))}
                    </ul>

                    <button
                      className="ms-btn"
                      type="button"
                      onClick={exportData}
                    >
                      Export demo JSON
                    </button>
                    <button
  type="button"
  className="ms-btn"
  onClick={saveToSupabase}
>
  ☁️ Save to Supabase
</button><button
  type="button"
  className="ms-btn ms-quiet"
  onClick={loadFromSupabase}
>
  ☁️ Load from Supabase
</button>

                  </Card>

                  <Card title="Important limitations">
                    <p>
                      Records in this module persist in
                      this browser's localStorage.
                    </p>

                    <div className="ms-note ms-warning">
                      Automatic Supabase synchronization,
                      encrypted clinical storage and
                      guaranteed offline application loading
                      are not yet implemented.
                    </div>

                    <p>Use fictional data only.</p>
                  </Card>
                </div>
              </>
            )}

            <footer className="ms-footer">
              InstantPulse · Educational spaceflight
              prototype · Fictional data · Not affiliated
              with NASA · Not for medical decisions
            </footer>
          </main>
        </div>
      )}
    </>
  );
}

