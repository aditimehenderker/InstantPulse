import { useEffect, useState } from "react";
import { ensureAnonymousSession, supabase } from "./lib/supabaseClient";
import BodyExplorer3D from "./BodyExplorer3D";
import MissionHealthSuite from "./MissionHealthSuite";
import {
  Activity,
  Apple,
  BookOpen,
  Download,
  Dumbbell,
  HeartPulse,
  Home,
  Package,
  Plus,
  Rocket,
  ShieldAlert,
  Stethoscope,
  Trash2,
} from "lucide-react";

// InstantPulse: NASA Space Apps educational prototype.
// All health readings are entered by the user.
// This is not medical software or a NASA-approved system.

const MISSIONS = [
  { id: "orbit", name: "Earth Orbit", emoji: "🌍" },
  { id: "moon", name: "Moon", emoji: "🌙" },
  { id: "mars", name: "Mars", emoji: "🔴" },
  { id: "deep", name: "Deep Space", emoji: "🪐" },
];

const METRICS = [
  { id: "heart", name: "Heart Rate", unit: "bpm", emoji: "❤️", area: "Chest" },
  { id: "oxygen", name: "Blood Oxygen", unit: "%", emoji: "🫁", area: "Chest" },
  { id: "breathing", name: "Respiratory Rate", unit: "/min", emoji: "🌬️", area: "Chest" },
  { id: "systolic", name: "Systolic Blood Pressure", unit: "mmHg", emoji: "🩺", area: "Chest" },
  { id: "diastolic", name: "Diastolic Blood Pressure", unit: "mmHg", emoji: "🩺", area: "Chest" },
  { id: "glucose", name: "Blood Glucose", unit: "mg/dL", emoji: "🩸", area: "Abdomen" },
  { id: "temperature", name: "Body Temperature", unit: "°C", emoji: "🌡️", area: "Head" },
  { id: "sleep", name: "Sleep Duration", unit: "hours", emoji: "🌙", area: "Head" },
  { id: "water", name: "Fluid Intake", unit: "L", emoji: "💧", area: "Abdomen" },
  { id: "mood", name: "Mood", unit: "1–5", emoji: "🧠", area: "Head" },
  { id: "stress", name: "Stress", unit: "1–5", emoji: "🫧", area: "Head" },
  { id: "fatigue", name: "Fatigue", unit: "1–5", emoji: "🔋", area: "Muscles" },
];

const HAZARDS = [
  {
    name: "Space Radiation",
    emoji: "☀️",
    description: "Radiation exposure can affect human health during spaceflight.",
    monitor: "Radiation dosimeter measurements and verified mission records.",
    action: "Follow approved radiation-protection procedures.",
  },
  {
    name: "Isolation & Confinement",
    emoji: "🧠",
    description: "Isolation can affect sleep, mood, stress and performance.",
    monitor: "Sleep, fatigue, mood and stress trends.",
    action: "Review rest, workload and behavioral-health support.",
  },
  {
    name: "Distance from Earth",
    emoji: "📡",
    description: "Communication delays make onboard medical readiness important.",
    monitor: "Health records, symptoms and communication readiness.",
    action: "Follow approved onboard assessment and escalation procedures.",
  },
  {
    name: "Gravity Fields",
    emoji: "🦴",
    description: "Altered gravity can affect muscles, bones and cardiovascular health.",
    monitor: "Exercise, mobility, fatigue and cardiovascular measurements.",
    action: "Follow individualized mission-approved exercise countermeasures.",
  },
  {
    name: "Hostile & Closed Environments",
    emoji: "🌬️",
    description: "Cabin conditions and air quality can influence astronaut health.",
    monitor: "Verified environmental sensors, including cabin CO₂.",
    action: "Review habitat instruments and environmental safety procedures.",
  },
];

const FOODS = [
  { id: 1, name: "Spaceflight Tortillas", emoji: "🫓", category: "Bread alternative" },
  { id: 2, name: "Peanut Butter", emoji: "🥜", category: "Spread" },
  { id: 3, name: "Shrimp Cocktail", emoji: "🍤", category: "Spaceflight dish" },
  { id: 4, name: "Rehydratable Vegetables", emoji: "🥦", category: "Rehydratable" },
  { id: 5, name: "Thermostabilized Foods", emoji: "🥘", category: "Preserved food" },
  { id: 6, name: "Freeze-Dried Foods", emoji: "🍓", category: "Preserved food" },
];

const CONDITIONS = [
  {
    name: "Space Motion Sickness",
    symptoms: ["Nausea", "Dizziness", "Vomiting", "Headache"],
    guidance: "Report symptoms and follow approved onboard medical procedures.",
  },
  {
    name: "Sleep Disruption",
    symptoms: ["Poor sleep", "Fatigue", "Poor concentration"],
    guidance: "Review sleep patterns, workload and environmental conditions.",
  },
  {
    name: "Fluid Balance Concern",
    symptoms: ["Dry mouth", "Dizziness", "Fatigue"],
    guidance: "Review fluid records and consult the medical team.",
  },
  {
    name: "Visual Changes",
    symptoms: ["Blurred vision", "Vision changes", "Headache"],
    guidance: "Report visual changes promptly for medical assessment.",
  },
  {
    name: "Respiratory Irritation",
    symptoms: ["Cough", "Sore throat", "Eye irritation"],
    guidance: "Report symptoms and review verified cabin conditions.",
  },
];

const EXERCISES = [
  { id: "cardio", name: "Cardiovascular Training", emoji: "🏃" },
  { id: "strength", name: "Resistance Training", emoji: "🏋️" },
  { id: "mobility", name: "Mobility & Stretching", emoji: "🧘" },
  { id: "recovery", name: "Recovery", emoji: "🌿" },
];

const NAVIGATION = [
  { id: "overview", label: "Overview", icon: Home },
  { id: "health", label: "Daily Health", icon: HeartPulse },
  { id: "trends", label: "Health Trends", icon: Activity },
  { id: "body", label: "Body Explorer", icon: Activity },
  { id: "hazards", label: "Space Hazards", icon: ShieldAlert },
  { id: "nutrition", label: "Nutrition", icon: Apple },
  { id: "pantry", label: "Space Pantry", icon: Package },
  { id: "symptoms", label: "Symptom Explorer", icon: Stethoscope },
  { id: "exercise", label: "Exercise", icon: Dumbbell },
  { id: "research", label: "NASA Research", icon: BookOpen },
];

const STORAGE_KEY = "instantpulse-complete-demo-v1";

function todayString() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function emptyData() {
  return {
    profile: null,
    baselines: {},
    history: [],
    pantry: [],
    meals: [],
    exercises: [],
  };
}

function loadData() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return emptyData();

    const parsed = JSON.parse(stored);

    return {
      ...emptyData(),
      ...parsed,
      baselines: parsed.baselines || {},
      history: parsed.history || [],
      pantry: parsed.pantry || [],
      meals: parsed.meals || [],
      exercises: parsed.exercises || [],
    };
  } catch {
    return emptyData();
  }
}

function Heading({ title, subtitle, emoji }) {
  return (
    <div className="ip-heading">
      <div>
        <span className="ip-eyebrow">INSTANTPULSE / MISSION CONTROL</span>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      <span className="ip-heading-emoji">{emoji}</span>
    </div>
  );
}

function Stat({ label, value, detail, emoji }) {
  return (
    <div className="ip-stat">
      <span>{emoji} {label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </div>
  );
}

function Panel({ title, children }) {
  return (
    <section className="ip-panel">
      {title && <h3>{title}</h3>}
      {children}
    </section>
  );
}

function App() {
  const [data, setData] = useState(loadData);
  const [databaseUser, setDatabaseUser] = useState(null);
const [databaseError, setDatabaseError] = useState("");

useEffect(() => {
  let active = true;

  async function connectDatabase() {
    try {
      const user = await ensureAnonymousSession();

      if (active) {
        setDatabaseUser(user);
        console.log("Supabase session connected:", user.id);
      }
    } catch (error) {
      if (active) {
        setDatabaseError(error.message);
        console.error("Supabase connection failed:", error);
      }
    }
  }

  connectDatabase();

  return () => {
    active = false;
  };
}, []);
  const [page, setPage] = useState("overview");

  const [profileForm, setProfileForm] = useState({
    name: "",
    role: "Mission Specialist",
    mission: "moon",
    environment: "Spacecraft",
    duration: "180",
  });

  const [readings, setReadings] = useState({});
  const [baselineInputs, setBaselineInputs] = useState({});
  const [activityContext, setActivityContext] = useState("Resting");
  const [glucoseContext, setGlucoseContext] = useState("Not specified");
  const [healthNotes, setHealthNotes] = useState("");

  const [selectedMetric, setSelectedMetric] = useState("heart");
  const [selectedBodyPart, setSelectedBodyPart] = useState("Chest");
  const [selectedHazard, setSelectedHazard] = useState(0);

  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [foodSearch, setFoodSearch] = useState("");

  const [pantryFood, setPantryFood] = useState("1");
  const [pantryQuantity, setPantryQuantity] = useState("5");
  const [pantryExpiry, setPantryExpiry] = useState(todayString());

  const [exerciseInputs, setExerciseInputs] = useState({});
  const [message, setMessage] = useState("");

  const today = todayString();
  const profile = data.profile;

  const mission = MISSIONS.find(
    (item) => item.id === profile?.mission
  );

  const latest = data.history[0];

  function save(nextData) {
    setData(nextData);

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(nextData)
      );
    } catch {
      setMessage("Unable to save to browser storage.");
    }
  }

  function navigate(destination) {
    setPage(destination);
    setMessage("");
    window.scrollTo(0, 0);
  }
// Automatically save astronaut profile to Supabase
  useEffect(() => {
    if (!data.profile?.name) return;

    let cancelled = false;

    async function syncCrewProfile() {
      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (cancelled) return;
        if (authError) throw authError;

        if (!user) {
          console.warn("Supabase session not available.");
          return;
        }

        const profile = data.profile;

        const { error } = await supabase
          .from("crew_profiles")
          .upsert(
            {
              user_id: user.id,
              name: profile.name.trim(),
              role: profile.role || null,
              mission: profile.mission || null,
              environment: profile.environment || null,
              duration: Number(profile.duration) || null,
            },
            {
              onConflict: "user_id",
            }
          );

        if (error) throw error;

        console.log("✅ Crew profile saved to Supabase!");
      } catch (error) {
        console.error("Crew profile sync failed:", error);
      }
    }

    syncCrewProfile();

    return () => {
      cancelled = true;
    };
  }, [data.profile]);
  function createProfile() {
    const duration = Number(profileForm.duration);

    if (!profileForm.name.trim()) {
      setMessage("Please enter a crew member name.");
      return;
    }

    if (!Number.isInteger(duration) || duration < 1) {
      setMessage("Enter a valid mission duration.");
      return;
    }

    save({
      ...emptyData(),
      profile: {
        ...profileForm,
        name: profileForm.name.trim(),
        duration,
      },
    });

    setPage("overview");
    setMessage("");
  }
async function syncBaselinesToSupabase(updated) {
  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) throw authError;

    if (!user) {
      setMessage("Baselines saved locally. No cloud session.");
      return;
    }

    const rows = Object.entries(updated).map(
      ([metric_id, value]) => ({
        user_id: user.id,
        metric_id,
        value: Number(value),
      })
    );

    if (rows.length === 0) {
      setMessage("No baseline values to upload.");
      return;
    }

    const { error } = await supabase
      .from("health_baselines")
      .upsert(rows, {
        onConflict: "user_id,metric_id",
      });

    if (error) throw error;

    setMessage("✅ Baselines saved locally and to Supabase!");
    console.log("Baselines synchronized successfully.");
  } catch (error) {
    console.error("Baseline synchronization failed:", error);

    setMessage(
      "Saved locally, but cloud sync failed: " +
      (error.message || "Unknown error")
    );
  }
}


  function saveBaseline() {
    const updated = { ...data.baselines };

    for (const metric of METRICS) {
      const raw = baselineInputs[metric.id];

      if (raw === undefined) continue;

      if (raw === "") {
        delete updated[metric.id];
        continue;
      }

      const value = Number(raw);

      if (!Number.isFinite(value) || value <= 0) {
        setMessage("Baseline values must be positive numbers.");
        return;
      }

      if (metric.id === "oxygen" && value > 100) {
        setMessage("Blood oxygen cannot exceed 100%.");
        return;
      }

      if (
        ["mood", "stress", "fatigue"].includes(metric.id) &&
        (!Number.isInteger(value) || value > 5)
      ) {
        setMessage("Wellness scores must be whole numbers from 1 to 5.");
        return;
      }

      updated[metric.id] = value;
    }

    save({ ...data, baselines: updated });
setMessage("Personal baselines saved locally.");
syncBaselinesToSupabase(updated);
  }

  function saveHealth() {
    const values = {};

    for (const metric of METRICS) {
      const raw = readings[metric.id];

      if (raw === undefined || raw === "") continue;

      const value = Number(raw);

      if (!Number.isFinite(value) || value < 0) {
        setMessage("Please enter valid non-negative measurements.");
        return;
      }

      if (metric.id === "oxygen" && value > 100) {
        setMessage("Blood oxygen cannot exceed 100%.");
        return;
      }

      if (
        ["mood", "stress", "fatigue"].includes(metric.id) &&
        (!Number.isInteger(value) || value < 1 || value > 5)
      ) {
        setMessage("Mood, stress and fatigue must be from 1 to 5.");
        return;
      }

      values[metric.id] = value;
    }

    if (Object.keys(values).length === 0) {
      setMessage("Enter at least one health measurement.");
      return;
    }

    const record = {
      id: Date.now(),
      date: today,
      timestamp: new Date().toISOString(),
      values,
      activityContext,
      glucoseContext,
      notes: healthNotes,
    };

    save({
      ...data,
      history: [record, ...data.history],
    });

    setReadings({});
    setHealthNotes("");
    setMessage("Health assessment saved successfully.");
    // Save daily health assessment to Supabase
    (async () => {
      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) throw authError;

        if (!user) {
          setMessage(
            "Health assessment saved locally. Cloud session unavailable."
          );
          return;
        }

        const { error } = await supabase
          .from("health_assessments")
          .insert({
            user_id: user.id,
            assessment_date: record.date,
            readings: record.values,
            activity_context: record.activityContext || null,
            glucose_context: record.glucoseContext || null,
            notes: record.notes || null,
          });

        if (error) throw error;

        setMessage(
          "✅ Health assessment saved locally and to Supabase!"
        );
        console.log("Daily health assessment saved to Supabase.");
      } catch (error) {
        console.error("Health assessment sync failed:", error);
        setMessage(
          "Saved locally, but cloud sync failed: " +
          (error.message || "Unknown error")
        );
      }
    })();

  }

  function baselineDifference(metricId, rawValue) {
    const baseline = Number(data.baselines[metricId]);
    const current = Number(rawValue);

    if (
      rawValue === "" ||
      rawValue === undefined ||
      !Number.isFinite(baseline) ||
      baseline <= 0 ||
      !Number.isFinite(current)
    ) {
      return null;
    }

    return ((current - baseline) / baseline) * 100;
  }

  function addPantryItem() {
    const quantity = Number(pantryQuantity);

    if (!Number.isInteger(quantity) || quantity < 1) {
      setMessage("Enter a valid whole-number quantity.");
      return;
    }

    if (!pantryExpiry) {
      setMessage("Select an expiry date.");
      return;
    }

    save({
      ...data,
      pantry: [
        ...data.pantry,
        {
          id: Date.now(),
          foodId: Number(pantryFood),
          quantity,
          expiry: pantryExpiry,
        },
      ],
    });
    // Save pantry item to Supabase
    (async () => {
      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) throw authError;

        if (!user) {
          setMessage("Pantry saved locally. Cloud session unavailable.");
          return;
        }

        const { error } = await supabase
          .from("pantry_items")
          .insert({
            user_id: user.id,
            food_id: Number(pantryFood),
            quantity: quantity,
            expiry_date: pantryExpiry || null,
          });

        if (error) throw error;

        setMessage("✅ Pantry item saved locally and to Supabase!");
        console.log("Pantry item saved to Supabase.");
      } catch (error) {
        console.error("Pantry sync failed:", error);
        setMessage(
          "Saved locally, but cloud sync failed: " +
          (error.message || "Unknown error")
        );
      }
    })();



    setMessage("Food supplies added to the pantry.");
  }

  function updatePantryItem(id, change) {
    save({
      ...data,
      pantry: data.pantry.map((item) =>
        item.id === id
          ? {
              ...item,
              quantity: Math.max(0, item.quantity + change),
            }
          : item
      ),
    });
  }

  function removePantryItem(id) {
    save({
      ...data,
      pantry: data.pantry.filter((item) => item.id !== id),
    });
  }

  function logFood(food) {
    const batch = data.pantry
      .filter(
        (item) =>
          item.foodId === food.id &&
          item.quantity > 0 &&
          item.expiry >= today
      )
      .sort((a, b) => a.expiry.localeCompare(b.expiry))[0];

    if (!batch) {
      setMessage(
        "Add an available, non-expired batch to your pantry first."
      );
      return;
    }

    save({
      ...data,
      meals: [
        {
          id: Date.now(),
          foodId: food.id,
          date: today,
        },
        ...data.meals,
      ],
      pantry: data.pantry.map((item) =>
        item.id === batch.id
          ? { ...item, quantity: item.quantity - 1 }
          : item
      ),
    });

    setMessage(`${food.name} added to today's food log.`);
    // Save meal to Supabase
    (async () => {
      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) throw authError;

        if (!user) {
          setMessage("Meal saved locally. Cloud session unavailable.");
          return;
        }

        const { error } = await supabase
          .from("meal_logs")
          .insert({
            user_id: user.id,
            food_id: Number(food.id),
            meal_date: today,
          });

        if (error) throw error;

        setMessage("✅ Meal saved locally and to Supabase!");
        console.log("Meal log saved to Supabase.");
      } catch (error) {
        console.error("Meal sync failed:", error);
        setMessage(
          "Meal saved locally, but cloud sync failed: " +
          (error.message || "Unknown error")
        );
      }
    })();


  }

  function logExercise(exercise) {
    const minutes = Number(exerciseInputs[exercise.id]);

    if (
      !Number.isFinite(minutes) ||
      minutes <= 0 ||
      minutes > 1440
    ) {
      setMessage("Enter an exercise duration between 1 and 1440 minutes.");
      return;
    }

    save({
      ...data,
      exercises: [
        {
          id: Date.now(),
          date: today,
          name: exercise.name,
          minutes,
        },
        ...data.exercises,
      ],
    });
    // Save exercise session to Supabase
    (async () => {
      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) throw authError;

        if (!user) {
          setMessage("Exercise saved locally. Cloud session unavailable.");
          return;
        }

        const { error } = await supabase
          .from("exercise_logs")
          .insert({
            user_id: user.id,
            exercise_name: exercise.name,
            minutes: minutes,
            exercise_date: today,
          });

        if (error) throw error;

        setMessage("✅ Exercise saved locally and to Supabase!");
        console.log("Exercise log saved to Supabase.");
      } catch (error) {
        console.error("Exercise sync failed:", error);
        setMessage(
          "Exercise saved locally, but cloud sync failed: " +
          (error.message || "Unknown error")
        );
      }
    })();



    setExerciseInputs({
      ...exerciseInputs,
      [exercise.id]: "",
    });

    setMessage("Exercise session saved.");
  }

  function exportData() {
    const blob = new Blob(
      [JSON.stringify(data, null, 2)],
      { type: "application/json" }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "instantpulse-data.json";
    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const todayMeals = data.meals.filter(
    (item) => item.date === today
  );

  const todayExercises = data.exercises.filter(
    (item) => item.date === today
  );

  const exerciseMinutes = todayExercises.reduce(
    (sum, item) => sum + item.minutes,
    0
  );

  const totalStock = data.pantry.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  const pantryAlerts = data.pantry.filter((item) => {
    const difference =
      (
        new Date(item.expiry + "T00:00:00") -
        new Date(today + "T00:00:00")
      ) / 86400000;

    return item.quantity === 0 || difference <= 14;
  });

  const symptomOptions = [
    ...new Set(
      CONDITIONS.flatMap((condition) => condition.symptoms)
    ),
  ].sort();

  const matchingConditions = CONDITIONS.map((condition) => ({
    ...condition,
    matches: condition.symptoms.filter((symptom) =>
      selectedSymptoms.includes(symptom)
    ),
  })).filter((condition) => condition.matches.length > 0);

  const trendMetric = METRICS.find(
    (metric) => metric.id === selectedMetric
  );

  const trendRecords = data.history
    .filter(
      (record) =>
        record.values[selectedMetric] !== undefined
    )
    .slice(0, 12)
    .reverse();

  const trendMaximum = Math.max(
    1,
    ...trendRecords.map(
      (record) => Number(record.values[selectedMetric])
    )
  );

  return (
    <div className="instantpulse">
      <style>{`
        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          background: #F4FAFF;
        }

        button,
        input,
        select,
        textarea {
          font: inherit;
        }

        button {
          cursor: pointer;
        }

        .instantpulse {
          min-height: 100vh;
          color: #173A63;
background: linear-gradient(135deg, #F5FBFF 0%, #E5F4FF 55%, #CDEBFF 100%) !important;

          font-family: Inter, system-ui, Arial, sans-serif;
          background:
            radial-gradient(
              ellipse at 85% 0%,
              rgba(105, 63, 181, 0.35),
              transparent 40%
            ),
            radial-gradient(
              ellipse at 0% 100%,
              rgba(23, 101, 151, 0.22),
              transparent 40%
            ),
            #080c1e;
        }

        .instantpulse h1 {
          font-size: clamp(29px, 4vw, 44px);
          margin: 12px 0;
          line-height: 1.15;
        }

        .instantpulse h2 {
          margin: 12px 0;
        }

        .instantpulse h3 {
          font-size: 17px;
          margin: 0 0 16px;
        }

        .instantpulse p {
          color: #b8c4df;
          line-height: 1.65;
        }

        .instantpulse a {
          color: #c6b1ff;
        }

        .ip-brand {
          font-size: 25px;
          font-weight: 900;
          letter-spacing: -1px;
        }

        .ip-brand span {
          color: #bba0ff;
        }

        .ip-eyebrow {
          color: #c3a8ff;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 2px;
        }

        .ip-panel,
        .ip-stat,
        .ip-card {
          background: #FFFFFF;
          border: 1px solid C5E4FA;
          color: #173A63;
          box-shadow: 0 6px 20px rgba(48, 157, 224, 0.08);
          border-radius: 18px;
          padding: 21px;
        }

        .ip-panel {
          margin-bottom: 18px;
        }

        .ip-primary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border: none;
          border-radius: 11px;
          padding: 12px 17px;
          color: #0d1229;
          background: linear-gradient(110deg, #b99aff, #79bdff);
          font-weight: 800;
          transition: transform 0.2s;
        }

        .ip-primary:hover {
          transform: translateY(-2px);
        }

        .ip-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .ip-secondary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: #30375b;
          border: 1px solid #59658c;
          border-radius: 11px;
          color: white;
          padding: 11px 15px;
        }

        .ip-input {
          width: 100%;
          min-width: 0;
          padding: 12px;
          border: 1px solid #53618a;
          border-radius: 10px;
          background: #101730;
          color: white;
          outline: none;
        }

        .ip-input:focus {
          border-color: #bba0ff;
        }

        .ip-label {
          display: block;
          margin: 15px 0 7px;
          font-size: 13px;
          font-weight: 700;
        }

        .ip-small,
        .instantpulse small {
          color: #aebbd9;
          font-size: 12px;
        }

        .ip-notice {
          padding: 16px;
          background: rgba(75, 55, 111, 0.5);
          border: 1px solid #756393;
          border-radius: 12px;
          margin-bottom: 18px;
          color: #e8ddff;
          font-size: 13px;
          line-height: 1.65;
        }

        .ip-login {
          max-width: 1160px;
          min-height: 100vh;
          margin: auto;
          padding: 35px 22px;
          display: grid;
          grid-template-columns: 1fr 440px;
          gap: 45px;
          align-items: center;
        }

        .ip-login h1 {
          font-size: clamp(42px, 6vw, 70px);
        }

        .ip-login h1 span {
          color: #bba0ff;
        }

        .ip-options {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 9px;
        }

        .ip-option {
          background: #272f51;
          border: 1px solid #56628b;
          border-radius: 12px;
          color: white;
          padding: 13px;
          text-align: left;
        }

        .ip-option.active {
          background: #543d87;
          border-color: #c5adff;
        }

        .ip-workspace {
          display: flex;
          min-height: 100vh;
        }

        .ip-sidebar {
          width: 245px;
          flex-shrink: 0;
          background: linear-gradient(180deg,#E7F5FF 0%, #D3EBFF 100%);
          border-right: 1px solid #B8DCFA;
          padding: 24px 14px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .ip-nav {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .ip-nav button {
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 12px;
          background: transparent;
          border: none;
          border-radius: 10px;
          color: #173A63 !important;
          text-align: left;
        }

        .ip-nav button:hover {
          background: #C7E7FF;
        }

        .ip-nav button.active {
          background: #9DD9FF;
          color: 173A63 !important;
        }

        .ip-sidefoot {
          margin-top: auto;
          padding: 15px;
          border-radius: 13px;
          background: #252d4d;
        }

        .ip-main {
          flex: 1;
          min-width: 0;
          padding: 28px clamp(16px, 4vw, 45px) 55px;
        }

        .ip-topbar {
          display: flex;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 10px;
          margin-bottom: 28px;
          color: #b8c5df;
          font-size: 12px;
        }

        .ip-online {
          color: #80e5bf;
        }

        .ip-heading {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 15px;
          margin-bottom: 24px;
        }

        .ip-heading-emoji {
          font-size: 48px;
        }

        .ip-hero {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          padding: 29px;
          border: 1px solid #A8D7F5;
          border-radius: 20px;
          background: linear-gradient(115deg, #DDF3FF 0%, #B9E3FF 55%, #91CCF5 100%);
        }

        .ip-stats {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 14px;
          margin: 20px 0;
        }

        .ip-stat strong {
          display: block;
          font-size: 28px;
          margin: 10px 0;
          overflow-wrap: anywhere;
        }

        .ip-grid2 {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
        }

        .ip-grid3 {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 15px;
        }

        .ip-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
          padding: 13px 0;
          border-bottom: 1px solid #ffffff20;
        }

        .ip-row:last-child {
          border-bottom: none;
        }

        .ip-pill {
          display: inline-block;
          padding: 6px 11px;
          background: #392e5b;
          border-radius: 30px;
          color: #e4d6ff;
          font-size: 12px;
        }

        .ip-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 9px;
        }

        .ip-chip {
          padding: 10px 14px;
          border-radius: 30px;
          border: 1px solid #58648c;
          background: #292f52;
          color: white;
        }

        .ip-chip.active {
          background: #7552b5;
          border-color: #c6afff;
        }

        .ip-body {
          width: 100%;
          max-width: 300px;
        }

        .ip-region {
          fill: #8d75d5;
          fill-opacity: 0.55;
          stroke: #c7b6ff;
          stroke-width: 2;
          cursor: pointer;
        }

        .ip-region.active {
          fill: #75c8ef;
          stroke: #d1f3ff;
          stroke-width: 3;
        }

        .ip-chart {
          height: 180px;
          display: flex;
          align-items: flex-end;
          gap: 9px;
          border-bottom: 1px solid #59648c;
          padding-top: 20px;
        }

        .ip-bar {
          flex: 1;
          min-width: 12px;
          background: linear-gradient(#b48fff, #65afe9);
          border-radius: 6px 6px 0 0;
        }

        .ip-footer {
          margin-top: 30px;
          color: #9da9c7;
          font-size: 12px;
          line-height: 1.6;
        }

        @media (max-width: 1050px) {
          .ip-stats {
            grid-template-columns: repeat(2, 1fr);
          }

          .ip-grid3 {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 720px) {
          .ip-login {
            grid-template-columns: 1fr;
          }

          .ip-workspace {
            display: block;
          }

          .ip-sidebar {
            width: 100%;
          }

          .ip-nav {
            flex-direction: row;
            overflow-x: auto;
          }

          .ip-nav button {
            white-space: nowrap;
          }

          .ip-main {
            padding: 20px 15px 45px;
          }

          .ip-grid2,
          .ip-grid3,
          .ip-stats {
            grid-template-columns: 1fr;
          }

          .ip-hero {
            align-items: flex-start;
          }
        }
      `}</style>

      {!profile ? (
        <div className="ip-login">
          <div>
            <div className="ip-brand">
              💜 instant<span>pulse</span>
            </div>

            <p className="ip-eyebrow">
              SPACEFLIGHT HEALTH INTELLIGENCE
            </p>

            <h1>
              Beyond Earth.
              <br />
              <span>Within your care.</span>
            </h1>

            <p>
              A mission-focused astronaut health monitoring and
              decision-support prototype inspired by NASA research.
            </p>

            <p>
              ✦ Personalized health tracking
              <br />
              ✦ Long-duration health trends
              <br />
              ✦ Five NASA spaceflight hazards
              <br />
              ✦ Space nutrition and exercise
            </p>

            <div style={{ fontSize: 110 }}>🪐</div>
          </div>

          <div className="ip-panel">
            <span className="ip-eyebrow">
              CREATE YOUR DEMO CREW PROFILE
            </span>

            <h2>Welcome aboard!</h2>

            <label className="ip-label">
              Crew member name
            </label>

            <input
              className="ip-input"
              placeholder="Enter your name"
              value={profileForm.name}
              onChange={(event) =>
                setProfileForm({
                  ...profileForm,
                  name: event.target.value,
                })
              }
            />

            <label className="ip-label">Crew role</label>

            <select
              className="ip-input"
              value={profileForm.role}
              onChange={(event) =>
                setProfileForm({
                  ...profileForm,
                  role: event.target.value,
                })
              }
            >
              {[
                "Commander",
                "Pilot",
                "Mission Specialist",
                "Flight Engineer",
                "Medical Officer",
                "Research Scientist",
              ].map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>

            <label className="ip-label">
              Mission destination
            </label>

            <div className="ip-options">
              {MISSIONS.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  className={
                    "ip-option " +
                    (profileForm.mission === item.id ? "active" : "")
                  }
                  onClick={() =>
                    setProfileForm({
                      ...profileForm,
                      mission: item.id,
                    })
                  }
                >
                  {item.emoji} {item.name}
                </button>
              ))}
            </div>

            <label className="ip-label">
              Mission environment
            </label>

            <select
              className="ip-input"
              value={profileForm.environment}
              onChange={(event) =>
                setProfileForm({
                  ...profileForm,
                  environment: event.target.value,
                })
              }
            >
              {[
                "Spacecraft",
                "Space Station",
                "Rover",
                "Planetary Base",
              ].map((environment) => (
                <option key={environment} value={environment}>
                  {environment}
                </option>
              ))}
            </select>

            <label className="ip-label">
              Mission duration (days)
            </label>

            <input
              className="ip-input"
              type="number"
              min="1"
              value={profileForm.duration}
              onChange={(event) =>
                setProfileForm({
                  ...profileForm,
                  duration: event.target.value,
                })
              }
            />

            {message && (
              <div className="ip-notice" style={{ marginTop: 15 }}>
                {message}
              </div>
            )}

            <button
              type="button"
              className="ip-primary"
              style={{ width: "100%", marginTop: 20 }}
              onClick={createProfile}
            >
              <Rocket size={18} />
              Launch mission dashboard
            </button>

            <p className="ip-small">
              Educational demonstration · Not NASA-certified
            </p>
          </div>
        </div>
      ) : (
        <div className="ip-workspace">
          <aside className="ip-sidebar">
            <div className="ip-brand">
              💜 instant<span>pulse</span>
            </div>

            <span className="ip-eyebrow">
              MISSION CONTROL
            </span>

            <nav className="ip-nav">
              {NAVIGATION.map((item) => {
                const Icon = item.icon;

                return (
                  <button
                    type="button"
                    key={item.id}
                    className={page === item.id ? "active" : ""}
                    onClick={() => navigate(item.id)}
                  >
                    <Icon size={18} />
                    {item.label}
                  </button>
                );
              })}
            </nav>

            <div className="ip-sidefoot">
              <strong>
                {mission?.emoji} {mission?.name}
              </strong>

              <p className="ip-small">
                {profile.role}
                <br />
                {profile.environment}
              </p>

              <button
                type="button"
                className="ip-secondary"
                onClick={() => {
                  if (
                    window.confirm(
                      "Start a new crew profile? Export your existing data first."
                    )
                  ) {
                    save(emptyData());
                    setPage("overview");
                  }
                }}
              >
                New crew profile
              </button>
            </div>
          </aside>

          <main className="ip-main">
            <div className="ip-topbar">
              <span className="ip-online">
                ● MISSION DASHBOARD ONLINE — DEMO
              </span>

              <span>
                👩‍🚀 {profile.name} · {today}
              </span>
            </div>

            {message && (
              <div className="ip-notice">
                {message}
              </div>
            )}

            {page === "overview" && (
              <>
                <Heading
                  title={`Welcome aboard, ${profile.name} 👋`}
                  subtitle="Your personalized mission wellness command center."
                  emoji="✨"
                />

                <div className="ip-hero">
                  <div>
                    <span className="ip-eyebrow">
                      MISSION HEALTH MONITORING
                    </span>

                    <h2>
                      Every healthy day is a giant leap forward.
                    </h2>

                    <p>
                      {profile.role} · {profile.environment} ·{" "}
                      {profile.duration}-day {mission?.name} mission
                    </p>

                    <button
                      className="ip-primary"
                      onClick={() => navigate("health")}
                    >
                      Start daily assessment →
                    </button>
                  </div>

                  <span style={{ fontSize: 75 }}>
                    {mission?.emoji}
                  </span>
                </div>

                <div className="ip-stats">
                  <Stat
                    label="Health checks"
                    value={data.history.length}
                    detail="Saved assessments"
                    emoji="❤️"
                  />

                  <Stat
                    label="Personal baselines"
                    value={Object.keys(data.baselines).length}
                    detail="Configured indicators"
                    emoji="📊"
                  />

                  <Stat
                    label="Exercise today"
                    value={`${exerciseMinutes} min`}
                    detail="Recorded activity"
                    emoji="💪"
                  />

                  <Stat
                    label="Pantry alerts"
                    value={pantryAlerts.length}
                    detail="Stock or expiry"
                    emoji="📦"
                  />
                </div>

                <div className="ip-grid2">
                  <Panel title="📋 Daily mission checklist">
                    {[
                      {
                        text: "Record health measurements",
                        page: "health",
                      },
                      {
                        text: "Review mood and sleep",
                        page: "health",
                      },
                      {
                        text: "Check nutrition and hydration",
                        page: "nutrition",
                      },
                      {
                        text: "Record exercise",
                        page: "exercise",
                      },
                      {
                        text: "Review mission hazards",
                        page: "hazards",
                      },
                    ].map((item) => (
                      <div className="ip-row" key={item.text}>
                        <span>{item.text}</span>

                        <button
                          className="ip-secondary"
                          onClick={() => navigate(item.page)}
                        >
                          Review →
                        </button>
                      </div>
                    ))}
                  </Panel>

                  <Panel title="🛰️ Mission insights">
                    <p>
                      <strong>Behavioral health:</strong> Track
                      mood, stress and sleep during long missions.
                    </p>

                    <p>
                      <strong>Physical health:</strong> Exercise
                      countermeasures help address altered gravity.
                    </p>

                    <p>
                      <strong>Medical autonomy:</strong> Communication
                      delays increase reliance on onboard procedures.
                    </p>

                    <button
                      className="ip-secondary"
                      onClick={() => navigate("hazards")}
                    >
                      Explore NASA hazards →
                    </button>
                  </Panel>
                </div>

                <Panel title="📈 Latest recorded measurements">
                  {!latest ? (
                    <p>
                      No health assessments recorded yet.
                      Start your first daily check-in.
                    </p>
                  ) : (
                    METRICS.filter(
                      (metric) =>
                        latest.values[metric.id] !== undefined
                    )
                      .slice(0, 8)
                      .map((metric) => (
                        <div className="ip-row" key={metric.id}>
                          <span>
                            {metric.emoji} {metric.name}
                          </span>

                          <strong>
                            {latest.values[metric.id]} {metric.unit}
                          </strong>
                        </div>
                      ))
                  )}
                </Panel>
              </>
            )}

            {page === "health" && (
              <>
                <Heading
                  title="Daily Health Assessment"
                  subtitle="Record health indicators and compare them with personal baselines."
                  emoji="❤️"
                />

                <div className="ip-notice">
                  This prototype does not use NASA-approved medical
                  thresholds. Baseline comparisons describe
                  differences, not medical risk.
                </div>

                <Panel title="🩺 Personal baseline settings">
                  <p className="ip-small">
                    Use fictional demonstration values while
                    testing. Real medical applications require
                    verified baseline measurements.
                  </p>

                  <div className="ip-grid2">
                    {METRICS.map((metric) => (
                      <div key={metric.id}>
                        <label className="ip-label">
                          {metric.name} baseline ({metric.unit})
                        </label>

                        <input
                          className="ip-input"
                          type="number"
                          min="0"
                          step="any"
                          placeholder={
                            data.baselines[metric.id] !== undefined
                              ? String(data.baselines[metric.id])
                              : "Not set"
                          }
                          value={baselineInputs[metric.id] ?? ""}
                          onChange={(event) =>
                            setBaselineInputs({
                              ...baselineInputs,
                              [metric.id]: event.target.value,
                            })
                          }
                        />
                      </div>
                    ))}
                  </div>

                  <button
                    className="ip-primary"
                    style={{ marginTop: 20 }}
                    onClick={saveBaseline}
                  >
                    Save personal baselines
                  </button>
                </Panel>

                <Panel title="📋 Measurement context">
                  <div className="ip-grid2">
                    <div>
                      <label className="ip-label">
                        Activity state
                      </label>

                      <select
                        className="ip-input"
                        value={activityContext}
                        onChange={(event) =>
                          setActivityContext(event.target.value)
                        }
                      >
                        <option>Resting</option>
                        <option>After exercise</option>
                        <option>During activity</option>
                        <option>Not specified</option>
                      </select>
                    </div>

                    <div>
                      <label className="ip-label">
                        Blood glucose context
                      </label>

                      <select
                        className="ip-input"
                        value={glucoseContext}
                        onChange={(event) =>
                          setGlucoseContext(event.target.value)
                        }
                      >
                        <option>Not specified</option>
                        <option>Fasting</option>
                        <option>Before meal</option>
                        <option>After meal</option>
                      </select>
                    </div>
                  </div>
                </Panel>

                <Panel title="❤️ Vital signs & wellness">
                  <div className="ip-grid2">
                    {METRICS.map((metric) => {
                      const value = readings[metric.id] ?? "";

                      const difference = baselineDifference(
                        metric.id,
                        value
                      );

                      return (
                        <div className="ip-card" key={metric.id}>
                          <h3>
                            {metric.emoji} {metric.name}
                          </h3>

                          <input
                            className="ip-input"
                            type="number"
                            min="0"
                            step={
                              ["mood", "stress", "fatigue"].includes(
                                metric.id
                              )
                                ? "1"
                                : "any"
                            }
                            placeholder={`Enter value (${metric.unit})`}
                            value={value}
                            onChange={(event) =>
                              setReadings({
                                ...readings,
                                [metric.id]: event.target.value,
                              })
                            }
                          />

                          <p className="ip-small">
                            Baseline:{" "}
                            {data.baselines[metric.id] ?? "Not set"}{" "}
                            {metric.unit}
                          </p>

                          <p className="ip-small">
                            {difference === null
                              ? "No baseline comparison available"
                              : `${
                                  difference > 0 ? "+" : ""
                                }${difference.toFixed(
                                  1
                                )}% compared with baseline`}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  <label className="ip-label">
                    Symptoms or measurement notes
                  </label>

                  <textarea
                    className="ip-input"
                    rows={3}
                    value={healthNotes}
                    onChange={(event) =>
                      setHealthNotes(event.target.value)
                    }
                    placeholder="Add observations..."
                  />

                  <button
                    className="ip-primary"
                    style={{ marginTop: 20 }}
                    onClick={saveHealth}
                  >
                    ✓ Save health assessment
                  </button>
                </Panel>

                <Panel title="🧭 Decision-support workflow">
                  <p>
                    <strong>1. Measure:</strong> Record the observation
                    using an appropriate instrument.
                  </p>

                  <p>
                    <strong>2. Review:</strong> Compare with historical
                    values and measurement conditions.
                  </p>

                  <p>
                    <strong>3. Act:</strong> Follow approved medical
                    procedures and contact the medical team.
                  </p>

                  <p className="ip-small">
                    InstantPulse cannot determine medical urgency.
                  </p>
                </Panel>
              </>
            )}

            {page === "trends" && (
              <>
                <Heading
                  title="Long-Duration Health Trends"
                  subtitle="Visualize measurements recorded over time."
                  emoji="📈"
                />

                <Panel title="Choose a health indicator">
                  <select
                    className="ip-input"
                    value={selectedMetric}
                    onChange={(event) =>
                      setSelectedMetric(event.target.value)
                    }
                  >
                    {METRICS.map((metric) => (
                      <option
                        key={metric.id}
                        value={metric.id}
                      >
                        {metric.name}
                      </option>
                    ))}
                  </select>
                </Panel>

                <Panel title={trendMetric?.name}>
                  <p className="ip-small">
                    Last 12 recorded values. Chart bars are
                    proportional to the largest recorded value.
                    No medical thresholds are shown.
                  </p>

                  {trendRecords.length === 0 ? (
                    <p>
                      No measurements recorded for this indicator.
                    </p>
                  ) : (
                    <div className="ip-chart">
                      {trendRecords.map((record) => (
                        <div
                          key={record.id}
                          className="ip-bar"
                          title={`${
                            record.values[selectedMetric]
                          } ${trendMetric?.unit}`}
                          style={{
                            height: `${Math.max(
                              5,
                              (
                                Number(
                                  record.values[selectedMetric]
                                ) / trendMaximum
                              ) * 100
                            )}%`,
                          }}
                        />
                      ))}
                    </div>
                  )}
                </Panel>

                <Panel title="📋 Assessment history">
                  {data.history.length === 0 ? (
                    <p>No assessments saved yet.</p>
                  ) : (
                    data.history.slice(0, 15).map((record) => (
                      <div className="ip-row" key={record.id}>
                        <div>
                          <strong>
                            {new Date(
                              record.timestamp
                            ).toLocaleString()}
                          </strong>

                          <p className="ip-small">
                            {record.activityContext} ·{" "}
                            {Object.keys(record.values).length}{" "}
                            indicators
                          </p>
                        </div>

                        <span className="ip-pill">
                          {Object.keys(record.values).length} readings
                        </span>
                      </div>
                    ))
                  )}
                </Panel>
              </>
            )}

            {page === "body" && (
              <>
                <Heading
                  title="Interactive Body Explorer"
                  subtitle="Explore health measurements associated with body regions."
                  emoji="🧍"
                />

                <div className="ip-grid2">
                  <Panel title="Select a body region">
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "center",
                      }}
                    >
                      <BodyExplorer3D
  selectedBodyPart={selectedBodyPart}
  onSelectBodyPart={setSelectedBodyPart}
/>
                      <svg
                        className="ip-body"
                        viewBox="0 0 300 400"
                        role="img"
                        aria-label="Interactive human body diagram"
                      >
                        <circle
                          className={
                            "ip-region " +
                            (
                              selectedBodyPart === "Head"
                                ? "active"
                                : ""
                            )
                          }
                          cx="150"
                          cy="48"
                          r="31"
                          onClick={() =>
                            setSelectedBodyPart("Head")
                          }
                        />

                        <rect
                          className={
                            "ip-region " +
                            (
                              selectedBodyPart === "Chest"
                                ? "active"
                                : ""
                            )
                          }
                          x="111"
                          y="87"
                          width="78"
                          height="115"
                          rx="24"
                          onClick={() =>
                            setSelectedBodyPart("Chest")
                          }
                        />

                        <rect
                          className={
                            "ip-region " +
                            (
                              selectedBodyPart === "Abdomen"
                                ? "active"
                                : ""
                            )
                          }
                          x="116"
                          y="185"
                          width="68"
                          height="65"
                          rx="15"
                          onClick={() =>
                            setSelectedBodyPart("Abdomen")
                          }
                        />

                        <path
                          className={
                            "ip-region " +
                            (
                              selectedBodyPart === "Muscles"
                                ? "active"
                                : ""
                            )
                          }
                          d="
                            M119 95 L90 105 L60 205
                            L75 211 L116 155 Z
                            M181 95 L210 105 L240 205
                            L225 211 L184 155 Z
                            M121 239 L115 340 L105 375
                            L130 375 L150 267 L170 375
                            L195 375 L185 340 L179 239 Z
                          "
                          onClick={() =>
                            setSelectedBodyPart("Muscles")
                          }
                        />
                      </svg>
                    </div>

                    <div className="ip-chips">
                      {[
                        "Head",
                        "Chest",
                        "Abdomen",
                        "Muscles",
                      ].map((part) => (
                        <button
                          key={part}
                          className={
                            "ip-chip " +
                            (
                              selectedBodyPart === part
                                ? "active"
                                : ""
                            )
                          }
                          onClick={() =>
                            setSelectedBodyPart(part)
                          }
                        >
                          {part}
                        </button>
                      ))}
                    </div>
                  </Panel>

                  <Panel title={`${selectedBodyPart} indicators`}>
                    {METRICS.filter(
                      (metric) =>
                        metric.area === selectedBodyPart
                    ).map((metric) => (
                      <div className="ip-row" key={metric.id}>
                        <span>
                          {metric.emoji} {metric.name}
                        </span>

                        <strong>
                          {latest?.values[metric.id] ?? "—"}{" "}
                          {metric.unit}
                        </strong>
                      </div>
                    ))}

                    {selectedBodyPart === "Muscles" && (
                      <p>
                        Altered gravity can contribute to muscle
                        and bone changes during spaceflight.
                      </p>
                    )}

                    <button
                      className="ip-primary"
                      style={{ marginTop: 20 }}
                      onClick={() => navigate("health")}
                    >
                      Record measurements →
                    </button>
                  </Panel>
                </div>
              </>
            )}

            {page === "hazards" && (
              <>
                <Heading
                  title="Five Hazards of Spaceflight"
                  subtitle="Explore NASA's Human Research Program framework."
                  emoji="🛰️"
                />

                <div className="ip-notice">
                  NASA identifies five major hazards of
                  human spaceflight. This prototype does not
                  directly measure radiation or cabin conditions.
                </div>

                <div className="ip-grid3">
                  {HAZARDS.map((hazard, index) => (
                    <button
                      key={hazard.name}
                      className="ip-card"
                      style={{
                        textAlign: "left",
                        color: "white",
                        borderColor:
                          selectedHazard === index
                            ? "#bba0ff"
                            : undefined,
                      }}
                      onClick={() => setSelectedHazard(index)}
                    >
                      <div style={{ fontSize: 38 }}>
                        {hazard.emoji}
                      </div>

                      <h3>{hazard.name}</h3>
                      <p>{hazard.description}</p>
                      <span className="ip-pill">Explore →</span>
                    </button>
                  ))}
                </div>

                <div style={{ marginTop: 20 }}>
                  <Panel
                    title={
                      `${HAZARDS[selectedHazard].emoji} ` +
                      HAZARDS[selectedHazard].name
                    }
                  >
                    <p>
                      {HAZARDS[selectedHazard].description}
                    </p>

                    <h3>What to monitor</h3>
                    <p>
                      {HAZARDS[selectedHazard].monitor}
                    </p>

                    <h3>Educational next steps</h3>
                    <p>
                      {HAZARDS[selectedHazard].action}
                    </p>

                    <a
                      href="https://www.nasa.gov/hrp/hazards/"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Explore NASA's hazard research ↗
                    </a>
                  </Panel>
                </div>
              </>
            )}

            {page === "nutrition" && (
              <>
                <Heading
                  title="Space Nutrition"
                  subtitle="Explore space-food examples and record your meals."
                  emoji="🍓"
                />

                <div className="ip-notice">
                  This educational catalogue includes examples
                  of foods and preservation methods associated
                  with spaceflight. Exact calories, nutrients
                  and shelf lives are not supplied because
                  product-specific values have not been verified.
                </div>

                <div className="ip-stats">
                  <Stat
                    label="Meals today"
                    value={todayMeals.length}
                    detail="Logged servings"
                    emoji="🍽️"
                  />

                  <Stat
                    label="Food examples"
                    value={FOODS.length}
                    detail="Educational catalogue"
                    emoji="🥫"
                  />

                  <Stat
                    label="Pantry stock"
                    value={totalStock}
                    detail="Recorded units"
                    emoji="📦"
                  />

                  <Stat
                    label="Nutrition totals"
                    value="N/A"
                    detail="Awaiting verified labels"
                    emoji="🔬"
                  />
                </div>

                <Panel>
                  <input
                    className="ip-input"
                    placeholder="Search space foods..."
                    value={foodSearch}
                    onChange={(event) =>
                      setFoodSearch(event.target.value)
                    }
                  />
                </Panel>

                <div className="ip-grid3">
                  {FOODS.filter((food) =>
                    food.name
                      .toLowerCase()
                      .includes(foodSearch.toLowerCase())
                  ).map((food) => {
                    const stock = data.pantry
                      .filter(
                        (item) =>
                          item.foodId === food.id &&
                          item.expiry >= today
                      )
                      .reduce(
                        (sum, item) => sum + item.quantity,
                        0
                      );

                    return (
                      <div className="ip-card" key={food.id}>
                        <div style={{ fontSize: 38 }}>
                          {food.emoji}
                        </div>

                        <h3>{food.name}</h3>

                        <span className="ip-pill">
                          {food.category}
                        </span>

                        <p className="ip-small">
                          Nutrition values are not verified
                          for a specific serving.
                        </p>

                        <p className="ip-small">
                          Available pantry stock: {stock}
                        </p>

                        <button
                          className="ip-primary"
                          onClick={() => logFood(food)}
                        >
                          <Plus size={16} />
                          Log serving
                        </button>
                      </div>
                    );
                  })}
                </div>

                <div style={{ marginTop: 20 }}>
                  <Panel title="🍽️ Today's food log">
                    {todayMeals.length === 0 ? (
                      <p>No food logged today.</p>
                    ) : (
                      todayMeals.map((meal) => {
                        const food = FOODS.find(
                          (item) => item.id === meal.foodId
                        );

                        return (
                          <div className="ip-row" key={meal.id}>
                            <span>
                              {food?.emoji} {food?.name}
                            </span>

                            <span className="ip-pill">
                              1 serving
                            </span>
                          </div>
                        );
                      })
                    )}
                  </Panel>
                </div>
              </>
            )}

            {page === "pantry" && (
              <>
                <Heading
                  title="Space Pantry"
                  subtitle="Manage mission food supplies and expiry dates."
                  emoji="📦"
                />

                <div className="ip-notice">
                  Expiry dates are user-entered demonstration
                  data, not verified NASA shelf-life records.
                </div>

                <div className="ip-stats">
                  <Stat
                    label="Food batches"
                    value={data.pantry.length}
                    detail="Inventory entries"
                    emoji="📦"
                  />

                  <Stat
                    label="Total units"
                    value={totalStock}
                    detail="Available stock"
                    emoji="🥫"
                  />

                  <Stat
                    label="Alerts"
                    value={pantryAlerts.length}
                    detail="Expiry or stock"
                    emoji="🔔"
                  />

                  <Stat
                    label="Mission"
                    value={mission?.emoji}
                    detail={mission?.name}
                    emoji="🚀"
                  />
                </div>

                <Panel title="Add supplies">
                  <label className="ip-label">
                    Food item
                  </label>

                  <select
                    className="ip-input"
                    value={pantryFood}
                    onChange={(event) =>
                      setPantryFood(event.target.value)
                    }
                  >
                    {FOODS.map((food) => (
                      <option
                        key={food.id}
                        value={food.id}
                      >
                        {food.name}
                      </option>
                    ))}
                  </select>

                  <div className="ip-grid2">
                    <div>
                      <label className="ip-label">
                        Quantity
                      </label>

                      <input
                        className="ip-input"
                        type="number"
                        min="1"
                        value={pantryQuantity}
                        onChange={(event) =>
                          setPantryQuantity(event.target.value)
                        }
                      />
                    </div>

                    <div>
                      <label className="ip-label">
                        Expiry date
                      </label>

                      <input
                        className="ip-input"
                        type="date"
                        value={pantryExpiry}
                        onChange={(event) =>
                          setPantryExpiry(event.target.value)
                        }
                      />
                    </div>
                  </div>

                  <button
                    className="ip-primary"
                    style={{ marginTop: 20 }}
                    onClick={addPantryItem}
                  >
                    <Plus size={16} />
                    Add to pantry
                  </button>
                </Panel>

                <Panel title="Stored supplies">
                  {data.pantry.length === 0 ? (
                    <p>Your pantry is empty.</p>
                  ) : (
                    data.pantry.map((item) => {
                      const food = FOODS.find(
                        (entry) => entry.id === item.foodId
                      );

                      return (
                        <div className="ip-row" key={item.id}>
                          <div>
                            <strong>
                              {food?.emoji} {food?.name}
                            </strong>

                            <p className="ip-small">
                              Expiry: {item.expiry}
                            </p>
                          </div>

                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              flexWrap: "wrap",
                              gap: 8,
                            }}
                          >
                            <button
                              className="ip-secondary"
                              onClick={() =>
                                updatePantryItem(item.id, -1)
                              }
                            >
                              −
                            </button>

                            <strong>{item.quantity}</strong>

                            <button
                              className="ip-secondary"
                              onClick={() =>
                                updatePantryItem(item.id, 1)
                              }
                            >
                              +
                            </button>

                            <button
                              className="ip-secondary"
                              aria-label="Remove pantry item"
                              onClick={() =>
                                removePantryItem(item.id)
                              }
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </Panel>
              </>
            )}

            {page === "symptoms" && (
              <>
                <Heading
                  title="Spaceflight Symptom Explorer"
                  subtitle="Explore educational symptom associations."
                  emoji="🩺"
                />

                <div className="ip-notice">
                  This tool does not diagnose illness or
                  calculate medical probabilities. Urgent
                  symptoms require approved mission medical
                  procedures immediately.
                </div>

                <Panel title="Select reported symptoms">
                  <div className="ip-chips">
                    {symptomOptions.map((symptom) => (
                      <button
                        key={symptom}
                        className={
                          "ip-chip " +
                          (
                            selectedSymptoms.includes(symptom)
                              ? "active"
                              : ""
                          )
                        }
                        onClick={() =>
                          setSelectedSymptoms((previous) =>
                            previous.includes(symptom)
                              ? previous.filter(
                                  (item) => item !== symptom
                                )
                              : [...previous, symptom]
                          )
                        }
                      >
                        {selectedSymptoms.includes(symptom)
                          ? "✓ "
                          : "+ "}
                        {symptom}
                      </button>
                    ))}
                  </div>

                  {selectedSymptoms.length > 0 && (
                    <button
                      className="ip-secondary"
                      style={{ marginTop: 18 }}
                      onClick={() => setSelectedSymptoms([])}
                    >
                      Clear selections
                    </button>
                  )}
                </Panel>

                <Panel title="Educational associations">
                  {selectedSymptoms.length === 0 ? (
                    <p>
                      Select symptoms to explore related topics.
                    </p>
                  ) : (
                    matchingConditions.map((condition) => (
                      <div
                        className="ip-card"
                        key={condition.name}
                        style={{ marginBottom: 12 }}
                      >
                        <h3>
                          🩺 {condition.name}
                        </h3>

                        <p className="ip-small">
                          Shared symptoms:{" "}
                          {condition.matches.join(", ")}
                        </p>

                        <p>{condition.guidance}</p>

                        <p className="ip-small">
                          This is not a diagnosis.
                        </p>
                      </div>
                    ))
                  )}
                </Panel>
              </>
            )}

            {page === "exercise" && (
              <>
                <Heading
                  title="Exercise & Countermeasures"
                  subtitle="Track physical activity during long-duration missions."
                  emoji="💪"
                />

                <div className="ip-notice">
                  Exercise is important during spaceflight,
                  but the durations entered here are not
                  NASA exercise prescriptions.
                </div>

                <div className="ip-stats">
                  <Stat
                    label="Minutes today"
                    value={exerciseMinutes}
                    detail="Recorded activity"
                    emoji="⏱️"
                  />

                  <Stat
                    label="Sessions today"
                    value={todayExercises.length}
                    detail="Exercise logs"
                    emoji="✅"
                  />

                  <Stat
                    label="Mission"
                    value={mission?.emoji}
                    detail={mission?.name}
                    emoji="🚀"
                  />

                  <Stat
                    label="Activity types"
                    value={EXERCISES.length}
                    detail="Available categories"
                    emoji="💪"
                  />
                </div>

                <Panel title="Log exercise sessions">
                  {EXERCISES.map((exercise) => (
                    <div className="ip-row" key={exercise.id}>
                      <strong>
                        {exercise.emoji} {exercise.name}
                      </strong>

                      <div
                        style={{
                          display: "flex",
                          gap: 8,
                          alignItems: "center",
                        }}
                      >
                        <input
                          className="ip-input"
                          style={{ width: 110 }}
                          type="number"
                          min="1"
                          placeholder="Minutes"
                          value={
                            exerciseInputs[exercise.id] ?? ""
                          }
                          onChange={(event) =>
                            setExerciseInputs({
                              ...exerciseInputs,
                              [exercise.id]: event.target.value,
                            })
                          }
                        />

                        <button
                          className="ip-primary"
                          onClick={() => logExercise(exercise)}
                        >
                          Log
                        </button>
                      </div>
                    </div>
                  ))}
                </Panel>

                <Panel title="Today's exercise history">
                  {todayExercises.length === 0 ? (
                    <p>No exercise sessions logged today.</p>
                  ) : (
                    todayExercises.map((exercise) => (
                      <div
                        className="ip-row"
                        key={exercise.id}
                      >
                        <span>{exercise.name}</span>
                        <strong>
                          {exercise.minutes} min
                        </strong>
                      </div>
                    ))
                  )}
                </Panel>
              </>
            )}

            {page === "research" && (
              <>
                <Heading
                  title="NASA Research & Sources"
                  subtitle="Explore the science informing InstantPulse."
                  emoji="📚"
                />

                <div className="ip-notice">
                  NASA research informs this educational
                  prototype. InstantPulse does not connect
                  to live astronaut medical records or
                  spacecraft sensors.
                </div>

                {[
                  {
                    title: "NASA Human Research Program",
                    url: "https://www.nasa.gov/hrp/",
                  },
                  {
                    title: "Five Hazards of Human Spaceflight",
                    url: "https://www.nasa.gov/hrp/hazards/",
                  },
                  {
                    title: "NASA Open Data",
                    url: "https://data.nasa.gov/",
                  },
                  {
                    title: "NASA Open Science Data Repository",
                    url: "https://osdr.nasa.gov/",
                  },
                ].map((source) => (
                  <Panel
                    key={source.url}
                    title={`🔗 ${source.title}`}
                  >
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open official NASA resource ↗
                    </a>
                  </Panel>
                ))}

                <Panel title="Export demonstration data">
                  <p>
                    Download locally saved profiles,
                    measurements, baselines, food records,
                    pantry supplies and exercise logs.
                  </p>

                  <button
                    className="ip-primary"
                    onClick={exportData}
                  >
                    <Download size={17} />
                    Export JSON
                  </button>
                </Panel>

                <Panel title="Scientific transparency">
                  <p>
                    <strong>NASA-informed:</strong> Spaceflight
                    hazard categories and general spaceflight
                    research.
                  </p>

                  <p>
                    <strong>User-entered:</strong> Health
                    readings, baselines, mission profiles,
                    meals and inventory.
                  </p>

                  <p>
                    <strong>Not implemented:</strong> Medical
                    diagnosis, validated health alerts,
                    live NASA data integration and a secure backend.
                  </p>
                </Panel>
              </>
            )}
            <style>{`
  /* InstantPulse - Light Blue Form Fields */

  main input:not([type="checkbox"]):not([type="radio"]):not([type="range"]),
  main select,
  main textarea {
    background: #EAF6FF !important;
    color: #173A63 !important;
    border: 1px solid #A6D5F2 !important;
    border-radius: 12px !important;
  }

  main input::placeholder,
  main textarea::placeholder {
    color: #6485A0 !important;
  }

  main input:focus,
  main select:focus,
  main textarea:focus {
    outline: 2px solid #69B8ED !important;
  }

  /* Light Blue Dashboard Buttons */

  main .ip-card button,
  main .ip-panel button,
  main .ip-primary,
  main .ip-secondary {
    background: #B8E3FF !important;
    color: #173A63 !important;
    border: 1px solid #83C7F2 !important;
    border-radius: 12px !important;
    font-weight: 600 !important;
  }

  main .ip-card button:hover,
  main .ip-panel button:hover,
  main .ip-primary:hover,
  main .ip-secondary:hover {
    background: #8CCDF7 !important;
    color: #12395F !important;
  }
`}</style>

<MissionHealthSuite />
            <footer className="ip-footer">
              InstantPulse · NASA Space Apps educational prototype ·
              Not affiliated with NASA ·
              Not for operational medical decisions
            </footer>
          </main>
        </div>
      )}
    </div>
  );
}

export default App;
