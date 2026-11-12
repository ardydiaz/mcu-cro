-- Microsoft 365 profile photo, copied from Microsoft Graph at each sign-in.
-- Small (up to 120x120, a few KB). NULL when the person has no photo.
ALTER TABLE users
  ADD COLUMN photo            MEDIUMBLOB  NULL AFTER entra_oid,
  ADD COLUMN photo_type       VARCHAR(40) NULL AFTER photo,
  ADD COLUMN photo_updated_at DATETIME(3) NULL AFTER photo_type;
