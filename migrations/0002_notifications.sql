CREATE TABLE IF NOT EXISTS tracker_notifications (
  event_key TEXT PRIMARY KEY,
  job_id TEXT NOT NULL REFERENCES tracker_jobs(id),
  channel TEXT NOT NULL,
  kind TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS tracker_notification_job ON tracker_notifications(job_id);
