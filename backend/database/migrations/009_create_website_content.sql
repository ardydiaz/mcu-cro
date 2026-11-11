-- Community Website content (requirements Project 1).

-- Uploaded files (modules, pamphlets, presentations, photos). Stored on disk
-- under storage/uploads/<id>; only files attached to published content are public.
CREATE TABLE files (
  id            CHAR(36)     NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  mime_type     VARCHAR(120) NOT NULL,
  size_bytes    INT UNSIGNED NOT NULL,
  uploaded_by   CHAR(36)     NULL,
  created_at    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  CONSTRAINT files_uploaded_by_fk FOREIGN KEY (uploaded_by) REFERENCES users (id) ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Learning resources repository: College/Department → Topic → Type of Material → Publication (Step 4).
-- Colleges submit; CRO reviews and publishes (Step 7).
CREATE TABLE learning_resources (
  id            INT UNSIGNED      NOT NULL AUTO_INCREMENT,
  college_id    SMALLINT UNSIGNED NOT NULL,
  topic         VARCHAR(120)      NOT NULL,
  type          ENUM('video', 'module', 'pamphlet', 'presentation', 'health_info', 'other') NOT NULL,
  title         VARCHAR(200)      NOT NULL,
  description   TEXT              NULL,
  video_url     VARCHAR(500)      NULL COMMENT 'YouTube, Facebook or Vimeo link',
  file_id       CHAR(36)          NULL,
  language      ENUM('fil', 'en', 'both') NOT NULL DEFAULT 'fil',
  status        ENUM('draft', 'pending', 'published', 'rejected') NOT NULL DEFAULT 'draft',
  review_note   VARCHAR(1000)     NULL COMMENT 'reason when sent back to the college',
  is_featured   BOOLEAN           NOT NULL DEFAULT FALSE,
  published_at  DATETIME(3)       NULL,
  reviewed_by   CHAR(36)          NULL,
  created_by    CHAR(36)          NULL,
  updated_by    CHAR(36)          NULL,
  created_at    DATETIME(3)       NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at    DATETIME(3)       NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  deleted_at    DATETIME(3)       NULL,
  PRIMARY KEY (id),
  KEY learning_resources_public_idx (status, deleted_at, published_at),
  KEY learning_resources_college_idx (college_id, topic, type),
  CONSTRAINT learning_resources_college_fk FOREIGN KEY (college_id) REFERENCES colleges (id),
  CONSTRAINT learning_resources_file_fk FOREIGN KEY (file_id) REFERENCES files (id),
  CONSTRAINT learning_resources_reviewed_by_fk FOREIGN KEY (reviewed_by) REFERENCES users (id) ON DELETE SET NULL,
  CONSTRAINT learning_resources_created_by_fk FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL,
  CONSTRAINT learning_resources_updated_by_fk FOREIGN KEY (updated_by) REFERENCES users (id) ON DELETE SET NULL,
  CONSTRAINT learning_resources_source_chk CHECK (video_url IS NOT NULL OR file_id IS NOT NULL)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Community activities (upcoming, past, documentation, updates) and announcements.
CREATE TABLE posts (
  id            INT UNSIGNED      NOT NULL AUTO_INCREMENT,
  kind          ENUM('activity', 'announcement') NOT NULL,
  title         VARCHAR(200)      NOT NULL,
  slug          VARCHAR(220)      NOT NULL,
  summary       VARCHAR(500)      NULL,
  body          TEXT              NULL,
  event_date    DATE              NOT NULL COMMENT 'activity date, or announcement date',
  location      VARCHAR(200)      NULL,
  barangay_id   INT UNSIGNED      NULL,
  program_id    INT UNSIGNED      NULL,
  college_id    SMALLINT UNSIGNED NULL COMMENT 'organizing college, if any',
  cover_file_id CHAR(36)          NULL,
  cover_url     VARCHAR(255)      NULL COMMENT 'image shipped with the website (imported stories)',
  status        ENUM('draft', 'pending', 'published', 'rejected') NOT NULL DEFAULT 'draft',
  review_note   VARCHAR(1000)     NULL,
  is_featured   BOOLEAN           NOT NULL DEFAULT FALSE,
  published_at  DATETIME(3)       NULL,
  reviewed_by   CHAR(36)          NULL,
  created_by    CHAR(36)          NULL,
  updated_by    CHAR(36)          NULL,
  created_at    DATETIME(3)       NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at    DATETIME(3)       NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  deleted_at    DATETIME(3)       NULL,
  PRIMARY KEY (id),
  UNIQUE KEY posts_slug_key (slug),
  KEY posts_public_idx (kind, status, deleted_at, event_date),
  CONSTRAINT posts_barangay_fk FOREIGN KEY (barangay_id) REFERENCES barangays (id),
  CONSTRAINT posts_program_fk FOREIGN KEY (program_id) REFERENCES programs (id),
  CONSTRAINT posts_college_fk FOREIGN KEY (college_id) REFERENCES colleges (id),
  CONSTRAINT posts_cover_fk FOREIGN KEY (cover_file_id) REFERENCES files (id),
  CONSTRAINT posts_reviewed_by_fk FOREIGN KEY (reviewed_by) REFERENCES users (id) ON DELETE SET NULL,
  CONSTRAINT posts_created_by_fk FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL,
  CONSTRAINT posts_updated_by_fk FOREIGN KEY (updated_by) REFERENCES users (id) ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Photo documentation of an activity.
CREATE TABLE post_photos (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  post_id    INT UNSIGNED NOT NULL,
  file_id    CHAR(36)     NOT NULL,
  caption    VARCHAR(255) NULL,
  sort_order SMALLINT     NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY post_photos_post_idx (post_id, sort_order),
  CONSTRAINT post_photos_post_fk FOREIGN KEY (post_id) REFERENCES posts (id) ON DELETE CASCADE,
  CONSTRAINT post_photos_file_fk FOREIGN KEY (file_id) REFERENCES files (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Messages from the website's contact form (Contact / Community Coordination).
CREATE TABLE inquiries (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  topic      ENUM('general', 'partnership', 'service_request', 'learning_materials') NOT NULL DEFAULT 'general',
  name       VARCHAR(120) NOT NULL,
  email      VARCHAR(160) NOT NULL,
  phone      VARCHAR(20)  NULL,
  organization VARCHAR(160) NULL COMMENT 'barangay, school or organization',
  message    TEXT         NOT NULL,
  status     ENUM('new', 'handled', 'archived') NOT NULL DEFAULT 'new',
  handled_by CHAR(36)     NULL,
  handled_at DATETIME(3)  NULL,
  ip         VARCHAR(45)  NULL,
  created_at DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY inquiries_status_idx (status, created_at),
  CONSTRAINT inquiries_handled_by_fk FOREIGN KEY (handled_by) REFERENCES users (id) ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Public information for the Colleges/Departments, Programs and Partner Communities pages.
ALTER TABLE colleges
  ADD COLUMN description TEXT NULL AFTER slug,
  ADD COLUMN services_offered TEXT NULL COMMENT 'one service per line' AFTER description;

ALTER TABLE programs
  ADD COLUMN description TEXT NULL AFTER name,
  ADD COLUMN is_featured BOOLEAN NOT NULL DEFAULT FALSE AFTER description;

ALTER TABLE barangays
  ADD COLUMN description TEXT NULL AFTER city,
  ADD COLUMN is_partner BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'shown on Partner Communities' AFTER description;
