CREATE TABLE IF NOT EXISTS tracker_jobs (
  id TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS tracker_trips (
  token_hash TEXT PRIMARY KEY,
  job_id TEXT NOT NULL REFERENCES tracker_jobs(id),
  expires_at INTEGER NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  latitude REAL,
  longitude REAL,
  accuracy REAL,
  location_at INTEGER
);
CREATE INDEX IF NOT EXISTS tracker_trip_job ON tracker_trips(job_id);
CREATE TABLE IF NOT EXISTS tracker_photos (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL REFERENCES tracker_jobs(id),
  mime TEXT NOT NULL,
  image TEXT NOT NULL,
  created_at TEXT NOT NULL
);
