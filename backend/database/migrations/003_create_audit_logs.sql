-- Who did what, and when: sign-ins (including refused ones) and data changes.
-- Rows are only ever inserted, never updated or deleted by the application.
CREATE TABLE audit_logs (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id     CHAR(36)        NULL COMMENT 'actor; NULL for anonymous or refused sign-ins',
  actor_email VARCHAR(254)    NULL COMMENT 'kept even if the user is later removed',
  action      VARCHAR(64)     NOT NULL COMMENT 'e.g. auth.sign_in, user.update',
  entity_type VARCHAR(64)     NULL,
  entity_id   VARCHAR(64)     NULL,
  details     JSON            NULL,
  ip          VARCHAR(45)     NULL,
  user_agent  VARCHAR(255)    NULL,
  created_at  DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY audit_logs_user_idx (user_id, created_at),
  KEY audit_logs_entity_idx (entity_type, entity_id),
  KEY audit_logs_action_idx (action, created_at)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
