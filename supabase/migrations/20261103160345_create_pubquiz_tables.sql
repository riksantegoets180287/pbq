/*
# Create pubquiz scoreboard tables (single-tenant, no auth)

1. New Tables
- `pubquiz_settings`: one row holding the quiz title (`id` = 'main').
- `pubquiz_teams`: teams with `id` (text), `name`, `created_at_ms` (bigint, milliseconds since epoch, used for ordering).
- `pubquiz_rounds`: rounds with `id` (text), `name`, `round_number`.
- `pubquiz_scores`: one row per team-and-round score. `points` is numeric. Rows are removed when a score is cleared.

2. Relationships
- `pubquiz_scores.team_id` references `pubquiz_teams` and cascades on delete.
- `pubquiz_scores.round_id` references `pubquiz_rounds` and cascades on delete.

3. Security
- Row level security is enabled on all four tables.
- The site has no sign-in, so every request runs as the anonymous role. Policies are granted to `anon` and `authenticated` for the verbs the app uses.
- Data is intentionally shared across the site, so `USING (true)` is used for these policies.

4. Important notes
- Text ids are used so existing team and round ids from the app keep working.
- The migration is idempotent and can be re-run safely.
*/

CREATE TABLE IF NOT EXISTS pubquiz_settings (
  id text PRIMARY KEY,
  title text NOT NULL DEFAULT 'Nieuwe Pubquiz',
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pubquiz_teams (
  id text PRIMARY KEY,
  name text NOT NULL,
  created_at_ms bigint NOT NULL DEFAULT (extract(epoch from now()) * 1000)::bigint
);

CREATE TABLE IF NOT EXISTS pubquiz_rounds (
  id text PRIMARY KEY,
  name text NOT NULL,
  round_number integer NOT NULL
);

CREATE TABLE IF NOT EXISTS pubquiz_scores (
  team_id text NOT NULL REFERENCES pubquiz_teams(id) ON DELETE CASCADE,
  round_id text NOT NULL REFERENCES pubquiz_rounds(id) ON DELETE CASCADE,
  points numeric NOT NULL,
  PRIMARY KEY (team_id, round_id)
);

ALTER TABLE pubquiz_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE pubquiz_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE pubquiz_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE pubquiz_scores ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON pubquiz_settings TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON pubquiz_teams TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON pubquiz_rounds TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON pubquiz_scores TO anon, authenticated;

DROP POLICY IF EXISTS "anon_select_pubquiz_settings" ON pubquiz_settings;
CREATE POLICY "anon_select_pubquiz_settings" ON pubquiz_settings FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_pubquiz_settings" ON pubquiz_settings;
CREATE POLICY "anon_insert_pubquiz_settings" ON pubquiz_settings FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_pubquiz_settings" ON pubquiz_settings;
CREATE POLICY "anon_update_pubquiz_settings" ON pubquiz_settings FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_pubquiz_settings" ON pubquiz_settings;
CREATE POLICY "anon_delete_pubquiz_settings" ON pubquiz_settings FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_select_pubquiz_teams" ON pubquiz_teams;
CREATE POLICY "anon_select_pubquiz_teams" ON pubquiz_teams FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_pubquiz_teams" ON pubquiz_teams;
CREATE POLICY "anon_insert_pubquiz_teams" ON pubquiz_teams FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_pubquiz_teams" ON pubquiz_teams;
CREATE POLICY "anon_update_pubquiz_teams" ON pubquiz_teams FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_pubquiz_teams" ON pubquiz_teams;
CREATE POLICY "anon_delete_pubquiz_teams" ON pubquiz_teams FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_select_pubquiz_rounds" ON pubquiz_rounds;
CREATE POLICY "anon_select_pubquiz_rounds" ON pubquiz_rounds FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_pubquiz_rounds" ON pubquiz_rounds;
CREATE POLICY "anon_insert_pubquiz_rounds" ON pubquiz_rounds FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_pubquiz_rounds" ON pubquiz_rounds;
CREATE POLICY "anon_update_pubquiz_rounds" ON pubquiz_rounds FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_pubquiz_rounds" ON pubquiz_rounds;
CREATE POLICY "anon_delete_pubquiz_rounds" ON pubquiz_rounds FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_select_pubquiz_scores" ON pubquiz_scores;
CREATE POLICY "anon_select_pubquiz_scores" ON pubquiz_scores FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_pubquiz_scores" ON pubquiz_scores;
CREATE POLICY "anon_insert_pubquiz_scores" ON pubquiz_scores FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_pubquiz_scores" ON pubquiz_scores;
CREATE POLICY "anon_update_pubquiz_scores" ON pubquiz_scores FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_pubquiz_scores" ON pubquiz_scores;
CREATE POLICY "anon_delete_pubquiz_scores" ON pubquiz_scores FOR DELETE TO anon, authenticated USING (true);
