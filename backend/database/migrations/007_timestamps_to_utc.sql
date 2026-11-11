-- Until now, column defaults (CURRENT_TIMESTAMP) used the MySQL server's local
-- time while the app reads every timestamp as UTC, so these showed 8 hours late
-- in the Philippines. Connections now use UTC; this shifts the existing values.
-- Values the app wrote itself (last_login_at, consent_at) were already UTC.
-- On a server already running in UTC the offset is 0 and nothing changes.
SET @offset = TIMESTAMPDIFF(SECOND, UTC_TIMESTAMP(), CONVERT_TZ(UTC_TIMESTAMP(), '+00:00', @@global.time_zone));

UPDATE users SET created_at = created_at - INTERVAL @offset SECOND, updated_at = updated_at - INTERVAL @offset SECOND;
UPDATE colleges SET created_at = created_at - INTERVAL @offset SECOND, updated_at = updated_at - INTERVAL @offset SECOND;
UPDATE barangays SET created_at = created_at - INTERVAL @offset SECOND, updated_at = updated_at - INTERVAL @offset SECOND;
UPDATE beneficiaries
SET created_at = created_at - INTERVAL @offset SECOND,
    updated_at = updated_at - INTERVAL @offset SECOND,
    deleted_at = deleted_at - INTERVAL @offset SECOND;
UPDATE audit_logs SET created_at = created_at - INTERVAL @offset SECOND;
