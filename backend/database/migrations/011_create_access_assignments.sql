-- Who may see which beneficiaries (requirements Project 2, Step 5 – Determine User Access).

-- Community Coordinators "encode assigned beneficiaries": they work with the
-- beneficiaries of the barangays assigned to them in Settings.
CREATE TABLE user_barangays (
  user_id     CHAR(36)     NOT NULL,
  barangay_id INT UNSIGNED NOT NULL,
  PRIMARY KEY (user_id, barangay_id),
  KEY user_barangays_barangay_idx (barangay_id),
  CONSTRAINT user_barangays_user_fk FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT user_barangays_barangay_fk FOREIGN KEY (barangay_id) REFERENCES barangays (id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- College/Department users "view beneficiaries assigned to their program": CRO
-- assigns beneficiaries to colleges. A college also sees the beneficiaries it
-- has served or that were referred from or to it.
CREATE TABLE beneficiary_colleges (
  beneficiary_id INT UNSIGNED      NOT NULL,
  college_id     SMALLINT UNSIGNED NOT NULL,
  assigned_by    CHAR(36)          NULL,
  assigned_at    DATETIME(3)       NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (beneficiary_id, college_id),
  KEY beneficiary_colleges_college_idx (college_id),
  CONSTRAINT beneficiary_colleges_beneficiary_fk FOREIGN KEY (beneficiary_id) REFERENCES beneficiaries (id) ON DELETE CASCADE,
  CONSTRAINT beneficiary_colleges_college_fk FOREIGN KEY (college_id) REFERENCES colleges (id),
  CONSTRAINT beneficiary_colleges_assigned_by_fk FOREIGN KEY (assigned_by) REFERENCES users (id) ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
