-- The PettyPawn waitlist: one row per email. The email is the primary key, so a second signup with the same address
-- stores nothing and the API answers "already" from the same single write.
CREATE TABLE waitlist (
  email TEXT PRIMARY KEY,                                   -- trimmed and lowercased
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android')),
  source TEXT,                                              -- utm_source, ?ref=, or the referring site
  country TEXT,                                             -- Cloudflare's two-letter country code
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
