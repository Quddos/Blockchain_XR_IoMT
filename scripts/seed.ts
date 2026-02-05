import { config as loadEnv } from "dotenv";
import { neon } from "@neondatabase/serverless";

loadEnv();
loadEnv({ path: ".env.local", override: true });

type SessionSeed = {
  session_id: string;
  smoothness: number;
  time_score: number;
  final_score: number;
  duration: number;
  left_smoothness: number;
  right_smoothness: number;
  date: string;
};

const samples: SessionSeed[] = [
  {
    session_id: "UNITY-001",
    smoothness: 0.82,
    time_score: 0.74,
    final_score: 0.78,
    duration: 320,
    left_smoothness: 0.85,
    right_smoothness: 0.79,
    date: "2025-03-24T10:30:00Z",
  },
  {
    session_id: "UNITY-002",
    smoothness: 0.76,
    time_score: 0.69,
    final_score: 0.72,
    duration: 295,
    left_smoothness: 0.71,
    right_smoothness: 0.77,
    date: "2025-03-26T09:00:00Z",
  },
  {
    session_id: "UNITY-003",
    smoothness: 0.88,
    time_score: 0.81,
    final_score: 0.86,
    duration: 340,
    left_smoothness: 0.9,
    right_smoothness: 0.85,
    date: "2025-03-29T13:15:00Z",
  },
  {
    session_id: "UNITY-004",
    smoothness: 0.69,
    time_score: 0.61,
    final_score: 0.65,
    duration: 280,
    left_smoothness: 0.58,
    right_smoothness: 0.7,
    date: "2025-04-01T08:45:00Z",
  },
  {
    session_id: "UNITY-005",
    smoothness: 0.8,
    time_score: 0.76,
    final_score: 0.82,
    duration: 330,
    left_smoothness: 0.84,
    right_smoothness: 0.78,
    date: "2025-04-05T11:20:00Z",
  },
];

async function main() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not defined. Make sure it exists in .env.local or the shell.",
    );
  }

  const sql = neon(connectionString);

  console.log(`Seeding ${samples.length} VR rehab sessions...\n`);

  for (const sample of samples) {
    await sql`
      INSERT INTO sessions (
        session_id,
        smoothness,
        time_score,
        final_score,
        duration,
        left_smoothness,
        right_smoothness,
        date
      )
      VALUES (
        ${sample.session_id},
        ${sample.smoothness},
        ${sample.time_score},
        ${sample.final_score},
        ${sample.duration},
        ${sample.left_smoothness},
        ${sample.right_smoothness},
        ${sample.date}
      );
    `;
    console.log(`• ${sample.session_id} seeded`);
  }

  console.log("\nSeed complete.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});


