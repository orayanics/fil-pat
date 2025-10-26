-- Create a default assessment template for new sessions
INSERT INTO assessment_templates (
  name, description, version, is_default, is_for_kids, estimated_duration_minutes, difficulty_level, allow_skip_items, randomize_items, show_progress_bar, enable_audio_recording, created_by, is_active, created_at, updated_at
) VALUES (
  'Default Template',
  'A default assessment template for new sessions',
  '1.0',
  1,
  0,
  60,
  'Standard',
  0,
  0,
  1,
  1,
  1,
  1,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);
