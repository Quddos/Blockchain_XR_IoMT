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


