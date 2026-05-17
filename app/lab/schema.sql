-- /lab — Neon schema for the full-stack demo.
-- Run once via the Neon SQL Editor or `psql $DATABASE_URL -f app/lab/schema.sql`.
-- Idempotent: safe to re-run.

CREATE TABLE IF NOT EXISTS lab_users (
    id            TEXT        PRIMARY KEY,
    email         TEXT        NOT NULL UNIQUE,
    password_hash TEXT        NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_lab_users_email_lower ON lab_users (lower(email));

CREATE TABLE IF NOT EXISTS lab_sessions (
    token_hash  TEXT        PRIMARY KEY,
    user_id     TEXT        NOT NULL REFERENCES lab_users(id) ON DELETE CASCADE,
    expires_at  TIMESTAMPTZ NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_lab_sessions_user_id    ON lab_sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_lab_sessions_expires_at ON lab_sessions (expires_at);

CREATE TABLE IF NOT EXISTS lab_tasks (
    id          TEXT        PRIMARY KEY,
    user_id     TEXT        NOT NULL REFERENCES lab_users(id) ON DELETE CASCADE,
    title       TEXT        NOT NULL,
    body        TEXT,
    status      TEXT        NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active','pending','archived')),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_lab_tasks_user_created ON lab_tasks (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lab_tasks_user_status  ON lab_tasks (user_id, status);
