-- Admin-portal accounts. People sign in with Microsoft 365; this table decides
-- whether they get in and what they can do.
CREATE TABLE users (
  id            CHAR(36)               NOT NULL,
  email         VARCHAR(254)           NOT NULL COMMENT 'lower-cased M365 sign-in name',
  name          VARCHAR(160)           NULL,
  role          ENUM('admin', 'staff') NOT NULL DEFAULT 'staff' COMMENT 'keep in sync with src/constants/roles.js',
  is_active     BOOLEAN                NOT NULL DEFAULT TRUE,
  entra_oid     CHAR(36)               NULL COMMENT 'M365 object id, set on first sign-in',
  last_login_at DATETIME(3)            NULL,
  created_at    DATETIME(3)            NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at    DATETIME(3)            NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY users_email_key (email),
  UNIQUE KEY users_entra_oid_key (entra_oid)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
