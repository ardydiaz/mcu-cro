-- Colleges and departments that supply website content and provide services
-- to beneficiaries. College/Department users belong to one of these.
CREATE TABLE colleges (
  id         SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  code       VARCHAR(20)       NOT NULL,
  name       VARCHAR(160)      NOT NULL,
  slug       VARCHAR(80)       NOT NULL COMMENT 'used in public URLs: /colleges/<slug>',
  sort_order SMALLINT          NOT NULL DEFAULT 0,
  is_active  BOOLEAN           NOT NULL DEFAULT TRUE,
  created_at DATETIME(3)       NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3)       NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY colleges_code_key (code),
  UNIQUE KEY colleges_slug_key (slug)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

INSERT INTO colleges (code, name, slug, sort_order) VALUES
  ('COM', 'College of Medicine', 'medicine', 1),
  ('COD', 'College of Dentistry', 'dentistry', 2),
  ('CPT', 'College of Physical Therapy', 'physical-therapy', 3),
  ('CON', 'College of Nursing', 'nursing', 4),
  ('CPH', 'College of Pharmacy', 'pharmacy', 5),
  ('COO', 'College of Optometry', 'optometry', 6),
  ('CMT', 'College of Medical Technology', 'medical-technology', 7),
  ('CAS', 'College of Arts and Sciences', 'arts-and-sciences', 8),
  ('BED', 'Basic Education', 'basic-education', 9),
  ('IOE', 'Institute of Education', 'institute-of-education', 10),
  ('SBM', 'School of Business and Management', 'business-and-management', 11);
