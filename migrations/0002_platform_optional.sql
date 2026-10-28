-- 2026-10-27: the waitlist no longer asks which phone. platform is now the device the visitor signed up on (ios or
-- android, sent by the page) or NULL on a computer. SQLite cannot relax NOT NULL in place, so the table is rebuilt and
-- every row is copied across.
CREATE TABLE waitlist_next (
  email TEXT PRIMARY KEY,                                   -- trimmed and lowercased
  platform TEXT CHECK (platform IN ('ios', 'android')),     -- the signup's device; NULL on a computer
  source TEXT,                                              -- utm_source, ?ref=, or the referring site
  country TEXT,                                             -- Cloudflare's two-letter country code
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
INSERT INTO waitlist_next (email, platform, source, country, created_at)
  SELECT email, platform, source, country, created_at FROM waitlist;
DROP TABLE waitlist;
ALTER TABLE waitlist_next RENAME TO waitlist;
