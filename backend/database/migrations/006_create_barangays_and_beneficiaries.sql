-- Partner barangays. A table (not free text) so reports per barangay stay
-- consistent (requirements Step 8: standardize fields).
CREATE TABLE barangays (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name       VARCHAR(120) NOT NULL,
  city       VARCHAR(120) NOT NULL COMMENT 'city or municipality',
  is_active  BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY barangays_name_city_key (name, city)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Beneficiary profiles (requirements Project 2, Step 4 – Beneficiary Profile).
-- The displayed Beneficiary ID is derived from `id` (BEN-000123).
-- Fields will be adjusted once CRO finalizes its manual forms (Step 3).
CREATE TABLE beneficiaries (
  id                       INT UNSIGNED NOT NULL AUTO_INCREMENT,
  first_name               VARCHAR(80)  NOT NULL,
  middle_name              VARCHAR(80)  NULL,
  last_name                VARCHAR(80)  NOT NULL,
  suffix                   VARCHAR(10)  NULL COMMENT 'Jr., Sr., III',
  birth_date               DATE         NOT NULL,
  sex                      ENUM('male', 'female') NOT NULL,
  civil_status             ENUM('single', 'married', 'widowed', 'separated') NULL,
  -- Address and contact
  barangay_id              INT UNSIGNED NOT NULL,
  address                  VARCHAR(255) NULL COMMENT 'house no., street, purok',
  contact_number           VARCHAR(20)  NULL,
  email                    VARCHAR(254) NULL,
  -- Family and demographics
  household_size           TINYINT UNSIGNED NULL,
  emergency_contact_name   VARCHAR(160) NULL,
  emergency_contact_number VARCHAR(20)  NULL,
  occupation               VARCHAR(80)  NULL,
  education                ENUM('none', 'elementary', 'high_school', 'senior_high', 'vocational', 'college', 'postgraduate') NULL,
  is_pwd                   BOOLEAN      NOT NULL DEFAULT FALSE,
  notes                    TEXT         NULL,
  -- Data Privacy Act (RA 10173): when consent to collect the data was obtained
  consent_at               DATETIME(3)  NOT NULL,
  created_by               CHAR(36)     NULL,
  updated_by               CHAR(36)     NULL,
  created_at               DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at               DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  deleted_at               DATETIME(3)  NULL COMMENT 'removed from the list; kept for history and audit',
  PRIMARY KEY (id),
  KEY beneficiaries_name_idx (last_name, first_name),
  KEY beneficiaries_birth_date_idx (birth_date),
  KEY beneficiaries_deleted_at_idx (deleted_at),
  CONSTRAINT beneficiaries_barangay_fk FOREIGN KEY (barangay_id) REFERENCES barangays (id),
  CONSTRAINT beneficiaries_created_by_fk FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL,
  CONSTRAINT beneficiaries_updated_by_fk FOREIGN KEY (updated_by) REFERENCES users (id) ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
