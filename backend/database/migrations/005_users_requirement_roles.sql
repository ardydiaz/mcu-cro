-- Roles from the CRO requirements (Step 5 – Determine User Access):
--   it_admin    IT Administrator: system administration, user accounts
--   cro_admin   CRO Administrator: all community data, programs, reports
--   coordinator Community Coordinator: encodes beneficiaries and services
--   college     College/Department User: their own college's beneficiaries, services and content
-- Existing accounts: admin → it_admin, staff → coordinator.
ALTER TABLE users
  MODIFY role ENUM('admin', 'staff', 'it_admin', 'cro_admin', 'coordinator', 'college') NOT NULL DEFAULT 'coordinator';

UPDATE users SET role = 'it_admin' WHERE role = 'admin';
UPDATE users SET role = 'coordinator' WHERE role = 'staff';

ALTER TABLE users
  MODIFY role ENUM('it_admin', 'cro_admin', 'coordinator', 'college') NOT NULL DEFAULT 'coordinator'
    COMMENT 'keep in sync with src/constants/roles.js',
  ADD COLUMN college_id SMALLINT UNSIGNED NULL AFTER role,
  ADD CONSTRAINT users_college_fk FOREIGN KEY (college_id) REFERENCES colleges (id),
  -- College users always belong to a college; nobody else does.
  ADD CONSTRAINT users_college_role_chk CHECK ((role = 'college') = (college_id IS NOT NULL));
