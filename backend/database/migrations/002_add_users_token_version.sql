-- Incremented to revoke every session of a user at once (deactivation,
-- "sign out everywhere"). Tokens carry the version they were issued with.
ALTER TABLE users
  ADD COLUMN token_version INT UNSIGNED NOT NULL DEFAULT 0 AFTER entra_oid;
