-- Spam protection for the website's contact form, without outside services.

-- Messages CRO staff marked as spam (hidden from the inbox).
ALTER TABLE inquiries
  MODIFY status ENUM('new', 'handled', 'archived', 'spam') NOT NULL DEFAULT 'new',
  ADD KEY inquiries_email_idx (email, created_at);

-- Email addresses marked as spam: their messages are quietly dropped.
CREATE TABLE blocked_senders (
  email      VARCHAR(160) NOT NULL,
  blocked_by CHAR(36)     NULL,
  created_at DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (email),
  CONSTRAINT blocked_senders_blocked_by_fk FOREIGN KEY (blocked_by) REFERENCES users (id) ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
