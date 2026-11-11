# MCU CRO

- `backend/` – Node.js + Express API on MySQL (`mysql2`) (`npm run dev`, port 2002)
- `frontend/` – React (Vite) (`npm run dev`, port 2001, proxies `/api` to the backend)
- `docs/` – setup guides (see `docs/m365-login.md` for sign-in and user setup)

## First-time setup

1. Set the `DB_*` values in `backend/.env` (MySQL host, port, database name, user, password).
2. In `backend/`: `npm install`, then `npm run db:migrate`. This creates the database if needed and applies `database/migrations/*.sql`.
3. Add the first IT administrator: `npm run user:create -- you@mcu.edu.ph it_admin "Your Name"`.
4. Start `npm run dev` in `backend/` and `frontend/`, then open http://localhost:2001/admin.
5. Optional, for development: `npm run db:seed` adds fictional sample data: 75 beneficiaries in 6 Caloocan barangays, about 200 service records and 40 referrals, plus 7 programs, and 25 learning materials with generated PDFs (20 published; the others are draft, waiting for review or sent back, to try the review flow). `npm run db:seed -- --materials` adds only the learning materials. Remove all sample data with `npm run db:seed -- --reset` (barangays and programs are kept). The script refuses to run when `NODE_ENV=production`.

## Importing existing beneficiary lists

CRO and IT administrators can bring in beneficiaries kept in Excel under **Beneficiaries → Import from Excel**: download the template (with drop-downs and instructions), fill it in or use a file with the same headings, and upload it (.xlsx or CSV, up to 2,000 rows). Every row is checked first and nothing is saved until you confirm. Rows with problems or people already registered (same name and birth date) are skipped. The audit log records the number of rows imported, not their contents.

## Community Website content

The public site (`/`, `/learning-resources`, `/activities`, `/colleges`, `/programs-services`, `/partner-communities`, `/about`, `/contact`) reads from `/api/public`, which needs no sign-in and only returns **published** content and totals, never beneficiary records.

Content is managed in the admin portal under **Content**:

- **Learning materials** are organized College/Department → Topic → Type. Upload a PDF, PowerPoint, Word or image file (up to 25 MB), or paste a YouTube, Facebook or Vimeo video link.
- **Activities & announcements** have a date, place, barangay, program, cover photo and photo documentation. Activities dated in the future show as "Upcoming".
- **Colleges, programs & barangays** hold the descriptions shown on the public pages.
- **Messages** collects what visitors send through the contact form.

**Review flow:** college users save drafts and submit them. CRO staff (coordinators and administrators) then publish or send back with a note.

Uploaded files are stored in `backend/storage/uploads/`, which is not in git. **Back up this folder together with the database.**

## Database changes

Add a new numbered file to `backend/database/migrations/` (for example `002_create_colleges.sql`) and run `npm run db:migrate`. Each file runs once; applied files are recorded in the `schema_migrations` table, so never edit a file after it has been applied.
