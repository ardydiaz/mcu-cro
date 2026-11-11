-- Community programs (e.g. "Alaga Ko Barangay Ko: Alaga sa Bawat Edad").
CREATE TABLE programs (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name        VARCHAR(160) NOT NULL,
  is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY programs_name_key (name)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Services received by a beneficiary (requirements Step 4 – Service Record, and
-- Step 6 – Beneficiary → Program → College → Service → Date → Findings → Follow-up).
CREATE TABLE service_records (
  id               INT UNSIGNED      NOT NULL AUTO_INCREMENT,
  beneficiary_id   INT UNSIGNED      NOT NULL,
  service_date     DATE              NOT NULL,
  program_id       INT UNSIGNED      NULL,
  college_id       SMALLINT UNSIGNED NOT NULL COMMENT 'responsible college/department',
  service_type     ENUM('medical', 'dental', 'optical', 'physical_therapy', 'nursing', 'laboratory', 'pharmacy', 'health_education', 'other') NOT NULL,
  findings         TEXT              NULL COMMENT 'assessment / findings',
  intervention     TEXT              NULL COMMENT 'intervention / service provided',
  recommendation   TEXT              NULL,
  follow_up_date   DATE              NULL,
  follow_up_status ENUM('none', 'scheduled', 'completed', 'missed') NOT NULL DEFAULT 'none',
  created_by       CHAR(36)          NULL,
  updated_by       CHAR(36)          NULL,
  created_at       DATETIME(3)       NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at       DATETIME(3)       NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  deleted_at       DATETIME(3)       NULL,
  PRIMARY KEY (id),
  KEY service_records_beneficiary_idx (beneficiary_id, service_date),
  KEY service_records_date_idx (service_date),
  KEY service_records_college_idx (college_id, service_date),
  KEY service_records_follow_up_idx (follow_up_status, follow_up_date),
  -- Beneficiaries are soft-deleted in the app; CASCADE only matters for sample-data cleanup.
  CONSTRAINT service_records_beneficiary_fk FOREIGN KEY (beneficiary_id) REFERENCES beneficiaries (id) ON DELETE CASCADE,
  CONSTRAINT service_records_program_fk FOREIGN KEY (program_id) REFERENCES programs (id),
  CONSTRAINT service_records_college_fk FOREIGN KEY (college_id) REFERENCES colleges (id),
  CONSTRAINT service_records_created_by_fk FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL,
  CONSTRAINT service_records_updated_by_fk FOREIGN KEY (updated_by) REFERENCES users (id) ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Referrals (requirements Step 3 – Referral Form; Step 6 – referral/follow-up).
-- Referred to another MCU college/department, or to an outside facility.
CREATE TABLE referrals (
  id                     INT UNSIGNED      NOT NULL AUTO_INCREMENT,
  beneficiary_id         INT UNSIGNED      NOT NULL,
  service_record_id      INT UNSIGNED      NULL COMMENT 'the service that led to the referral',
  referral_date          DATE              NOT NULL,
  college_id             SMALLINT UNSIGNED NOT NULL COMMENT 'referring college/department',
  referred_to_college_id SMALLINT UNSIGNED NULL,
  referred_to_facility   VARCHAR(160)      NULL COMMENT 'outside hospital, clinic or health center',
  reason                 TEXT              NOT NULL,
  urgency                ENUM('routine', 'urgent', 'emergency') NOT NULL DEFAULT 'routine',
  status                 ENUM('pending', 'in_progress', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
  outcome                TEXT              NULL,
  created_by             CHAR(36)          NULL,
  updated_by             CHAR(36)          NULL,
  created_at             DATETIME(3)       NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at             DATETIME(3)       NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  deleted_at             DATETIME(3)       NULL,
  PRIMARY KEY (id),
  KEY referrals_beneficiary_idx (beneficiary_id, referral_date),
  KEY referrals_status_idx (status, referral_date),
  KEY referrals_college_idx (college_id),
  KEY referrals_to_college_idx (referred_to_college_id),
  CONSTRAINT referrals_beneficiary_fk FOREIGN KEY (beneficiary_id) REFERENCES beneficiaries (id) ON DELETE CASCADE,
  CONSTRAINT referrals_service_record_fk FOREIGN KEY (service_record_id) REFERENCES service_records (id) ON DELETE SET NULL,
  CONSTRAINT referrals_college_fk FOREIGN KEY (college_id) REFERENCES colleges (id),
  CONSTRAINT referrals_to_college_fk FOREIGN KEY (referred_to_college_id) REFERENCES colleges (id),
  CONSTRAINT referrals_created_by_fk FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL,
  CONSTRAINT referrals_updated_by_fk FOREIGN KEY (updated_by) REFERENCES users (id) ON DELETE SET NULL,
  CONSTRAINT referrals_destination_chk CHECK (referred_to_college_id IS NOT NULL OR referred_to_facility IS NOT NULL)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
