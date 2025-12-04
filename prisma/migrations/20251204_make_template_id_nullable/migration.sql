-- Make template_id nullable in assessment_sessions
PRAGMA foreign_keys=OFF;

CREATE TABLE assessment_sessions_new (
  session_id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_uuid TEXT NOT NULL UNIQUE,
  patient_id INTEGER,
  clinician_id INTEGER NOT NULL,
  template_id INTEGER,
  session_name TEXT,
  session_date DATETIME NOT NULL,
  start_time DATETIME,
  end_time DATETIME,
  duration_minutes INTEGER,
  session_type TEXT DEFAULT 'Assessment' NOT NULL,
  session_mode TEXT DEFAULT 'Standard' NOT NULL,
  is_practice_session BOOLEAN DEFAULT 0 NOT NULL,
  is_resumed BOOLEAN DEFAULT 0 NOT NULL,
  status TEXT DEFAULT 'Scheduled' NOT NULL,
  current_item_id INTEGER,
  total_items INTEGER,
  completed_items INTEGER DEFAULT 0 NOT NULL,
  skipped_items INTEGER DEFAULT 0 NOT NULL,
  overall_score REAL,
  total_possible_score REAL,
  percentage_score REAL,
  clinician_ip TEXT,
  patient_ip TEXT,
  websocket_room_id TEXT,
  pre_session_notes TEXT,
  post_session_notes TEXT,
  session_summary TEXT,
  recommendations TEXT,
  session_paused_at DATETIME,
  session_resumed_at DATETIME,
  activity_log TEXT,
  clinician_left_count INTEGER DEFAULT 0 NOT NULL,
  total_pause_duration INTEGER DEFAULT 0 NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at DATETIME NOT NULL,
  FOREIGN KEY (patient_id) REFERENCES patients(patient_id),
  FOREIGN KEY (clinician_id) REFERENCES clinicians(clinician_id),
  FOREIGN KEY (template_id) REFERENCES assessment_templates(template_id),
  FOREIGN KEY (current_item_id) REFERENCES session_items(item_id)
);

INSERT INTO assessment_sessions_new SELECT * FROM assessment_sessions;
DROP TABLE assessment_sessions;
ALTER TABLE assessment_sessions_new RENAME TO assessment_sessions;

PRAGMA foreign_keys=ON;
