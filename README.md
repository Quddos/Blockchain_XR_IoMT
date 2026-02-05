Project overview
**Trust‑Aware Blockchain‑XR: Rehabilitation & Adaptive IoMT Framework.**

This repository demonstrates the Trust-Aware Blockchain-XR framework for secure, adaptive IoMT rehabilitation systems. The project integrates XR clients with a Next.js web dashboard and exposes session telemetry (including reaction times and violation flags) via a local `public/sessions.json` file and a `/api/sessions` endpoint. The dashboard visualizes trust signals and reaction-time trends aligned with the research.
<img width="1916" height="970" alt="image" src="https://github.com/user-attachments/assets/feba3bfe-84df-4110-bdfe-a02b11811c30" />
![IMG_5171](https://github.com/user-attachments/assets/5e6c7bbf-a49e-4ad1-9253-18be3fdc5090)

## SynecliptXR: Adaptive Visualization VR Cognitive Assessment System
Authors:

- Raheem Qudus 
  - Dept. of Computer Science and Engineering (SeaS)
  - SRM University AP, Andhra Pradesh, India
  - qudus_raheem@srmap.edu.in
- Ashok Kumar Pradhan
  - Dept. of Computer Science and Engineering (SeaS)
  - SRM University AP, Andhra Pradesh, India
  - ashokkumar.p@srmap.edu.in
- Niranjan Kumar Ray
  - School of Computer Engineering, KIIT Deemed to be University, Odisha, India
  - niranjan.rayfcs@kiit.ac.in



This repository contains the Next.js dashboard and API, a small database access library, migration seed scripts, and example client payload formats used by Unity.

Table of contents
-----------------

- **Project Title**: Research title and authorship
- **Quick Start**: run locally and seed demo data
- **Architecture**: data flow and components
- **Unity / Meta Quest 3 Integration**: example POST code and payload
- **API**: endpoints and behavior
- **Database**: Neon usage, migrations, seed
- **Dashboard**: how it reads live data
- **Data model**: session fields and types
- **Therapy & Research Context**: clinical metrics and purpose
- **Authors & Citation**n

---

## Trust‑Aware Blockchain‑XR Dashboard

Full-stack Next.js 14 (App Router) dashboard for visualizing reaction-time and trust signals from XR rehabilitation sessions. By default the API will read from `public/sessions.json` (if present) and expose `{ sessions: [...] }` at `/api/sessions` — this allows rapid prototyping and alignment with the research dataset.

### Tech Stack

- Next.js 14 App Router, React Server Components
- Tailwind CSS (v4)
- Neon Postgres via `@neondatabase/serverless`
- Recharts for data visualization
- Type-safe validation with `zod`

- <img width="1332" height="871" alt="image" src="https://github.com/user-attachments/assets/eea8a5b1-1a1b-4ce0-b90e-a4598c2e4885" />


### Prerequisites

- Node.js 18+ and npm
- A Neon Postgres database and `DATABASE_URL` env var

### Environment Variables

Create a `.env.local` file with:

```env
DATABASE_URL="postgresql://<user>:<password>@<host>:5432/<db>"
```

### Database Migration

Run the SQL in `migrations/001_create_sessions.sql` on your Neon database:

```sql
CREATE TABLE IF NOT EXISTS sessions (
  id SERIAL PRIMARY KEY,
  session_id TEXT,
  smoothness FLOAT,
  time_score FLOAT,
  final_score FLOAT,
  duration FLOAT,
  left_smoothness FLOAT,
  right_smoothness FLOAT,
  date TEXT
);
```

### Install & Run

```bash
npm install
```

Optional: seed demo data

```bash
npm run seed
```

Run dev server

```bash
npm run dev
```

Open the dashboard

- Dashboard: `http://localhost:3000/dashboard`
- API endpoint: `http://localhost:3000/api/sessions`

### Architecture (high level)

Flow:

Unity (Meta Quest 3) XR App (device) → HTTP POST JSON → Next.js API (`/api/sessions`) → Neon/Postgres DB → Next.js Dashboard reads DB → Clinician views.

Components in this repo
- `app/api/sessions/route.ts` — API route implementing GET and POST for sessions (edge runtime, CORS enabled).
- `lib/sessions.ts` — database helper: `getSessions()` and `insertSession()` with basic zod validation.
- `lib/db.ts` — neon client factory using `process.env.DATABASE_URL`.
- `app/dashboard/page.tsx` — dashboard page (server component) that fetches live sessions using `getSessions()`; rendered dynamically.
- `components/dashboard/TrendCharts.tsx` — client-side charting components using `recharts`.
- `scripts/seed.ts` — inserts demo sessions into the DB.

### Unity / Meta Quest 3 integration

Unity should send session payloads to the API using a JSON POST. Below is an example C# Unity snippet using `UnityWebRequest`.

Example Unity C# POST (UnityEngine.Networking):

```csharp
using System.Collections;
using UnityEngine;
using UnityEngine.Networking;

[System.Serializable]
public class SessionPayload {
    public string session_id;
    public float smoothness;
    public float time_score;
    public float final_score;
    public float duration;
    public float left_smoothness;
    public float right_smoothness;
    public string date; // ISO 8601 string
}

public class SessionUploader : MonoBehaviour {
    public string apiUrl = "https://your-deploy-domain.com/api/sessions";

    public IEnumerator UploadSession(SessionPayload payload) {
        string json = JsonUtility.ToJson(payload);
        var request = new UnityWebRequest(apiUrl, "POST");
        byte[] bodyRaw = System.Text.Encoding.UTF8.GetBytes(json);
        request.uploadHandler = new UploadHandlerRaw(bodyRaw);
        request.downloadHandler = new DownloadHandlerBuffer();
        request.SetRequestHeader("Content-Type", "application/json");

        yield return request.SendWebRequest();

        if (request.result == UnityWebRequest.Result.Success) {
            Debug.Log("Upload successful: " + request.downloadHandler.text);
        } else {
            Debug.LogError("Upload failed: " + request.error + " Response: " + request.downloadHandler.text);
        }
    }
}
```

Payload example (JSON)

```json
{
  "session_id": "3c2b03aa-7cbe-45bc-9504-cc93415687de",
  "smoothness": 0.72,
  "time_score": 0.65,
  "final_score": 0.68,
  "duration": 312,
  "left_smoothness": 0.74,
  "right_smoothness": 0.70,
  "date": "2025-11-19T12:34:56Z"
}
```

Notes for Meta Quest 3 builds
- Use Unity's XR Plugin Management and the Oculus (Meta) XR plugin for device support.
- The device needs network access (Wi-Fi) to reach your deployed API.
- Test uploads while headset is on the same network or via the public endpoint.
- For production, use HTTPS and secure CORS policies; the current API example sets `Access-Control-Allow-Origin: *` for convenience.

### API details

Endpoint: `POST /api/sessions`
- Accepts JSON payload matching the session schema.
- Validates payload with `zod`.
- Stores session into the `sessions` table.

Endpoint: `GET /api/sessions`
- Returns `{ sessions: [...] }` JSON listing sessions. When `public/sessions.json` is present, the API prefers that file and returns its parsed entries (useful for research/alignment with the paper). 
- CORS headers are present to allow device uploads and prototyping.

Example curl POST

```bash
curl -X POST 'http://localhost:3000/api/sessions' \
  -H 'Content-Type: application/json' \
  -d '{ "session_id":"UNITY-123", "smoothness":0.8, "time_score":0.7, "final_score":0.75, "duration":300, "left_smoothness":0.78, "right_smoothness":0.82, "date":"2025-11-19T12:00:00Z" }'
```

### Database (Neon)

This project uses Neon (serverless Postgres) via the `@neondatabase/serverless` client. The repository expects the `DATABASE_URL` environment variable to be set to the Neon connection string.

Key files:
- `migrations/001_create_sessions.sql` — creates the `sessions` table schema.
- `scripts/seed.ts` — inserts demo `UNITY-*` sessions for local testing.

### Dashboard behavior

- The dashboard is implemented in `app/dashboard/page.tsx` as a server component that calls `getSessions()` from `lib/sessions.ts`.
- To ensure the dashboard always reads live rows from the DB, the page is marked dynamic with `export const dynamic = "force-dynamic"`.
- Charts are implemented in a client component `TrendCharts.tsx` which uses `recharts` to display trends and a bilateral balance heatmap.

### Data model

Each session record contains:
- `id`: integer primary key (DB assigned)
- `session_id`: string (unique identifier from the client / headset)
- `smoothness`: number (motor control metric)
- `time_score`: number (timing metric)
- `final_score`: number (composite performance score)
- `duration`: number (seconds)
- `left_smoothness`: number
- `right_smoothness`: number
- `date`: string (ISO 8601)

### Therapy and research context

SynecliptXR is designed to support clinicians and researchers studying motor-control recovery following stroke. The key metrics (smoothness, final score, left/right balance) provide quantitative measures of motor control and bilateral symmetry. Visualizations and trend analysis enable longitudinal monitoring and early detection of improvements or regressions.

### Authors & citation

	itle{SynecliptXR: Adaptive Visualization VR Cognitive Assessment System with AI-Driven Stroke Rehabilitation Insight.}

Authors:

- Raheem Qudus (first author)
  - Dept. of Computer Science and Engineering (SeaS)
  - SRM University AP, Andhra Pradesh, India
  - qudus.raheem@srm.ap.edu.in
- Ashok Kumar Pradhan
  - Dept. of Computer Science and Engineering (SeaS)
  - SRM University AP, Andhra Pradesh, India
  - ashokkumar.p@srm.ap.edu.in
- Niranjan Kumar Ray
  - School of Computer Engineering, KIIT Deemed to be University, Odisha, India
  - niranjan.rayfcs@kiit.ac.in

When citing this project, please list Raheem Qudus as the first author.

### Contributing

- Feel free to open issues or pull requests.
- If you add new telemetry or schema changes, update `migrations/` and the seed script.

### Security & privacy

- This project stores rehabilitation telemetry. For any deployment with real patient data, ensure proper consent, data anonymization, secure transport (HTTPS), and access controls.
- Do not expose `DATABASE_URL` or credentials in public repositories.

### License

This repository does not include an explicit license file. Suggested: apply the `MIT` license or your preferred institutional license. Confirm with the authors before publishing.

### Contact

For questions about the project, research, or integration help, contact the authors listed above (Raheem Qudus is the lead / first author).

Appendix: Implementation notes
-----------------------------

- The API implements simple validation with `zod` and returns helpful errors on invalid payloads.
- The server uses `@neondatabase/serverless` for DB access and caches the client in `lib/db.ts`.
- The dashboard uses server-side code to compute aggregate values (average smoothness, best score) and client-side `recharts` for visualization.

Next steps you may want me to help with
-------------------------------------

- Add a `LICENSE` file (e.g., MIT).
- Add CI or deployment instructions for Vercel / Netlify / Render and Neon.
- Add a small Unity sample project demonstrating upload of a session.

---

README generated by the project maintainer tooling.
