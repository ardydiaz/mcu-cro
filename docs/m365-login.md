# Microsoft 365 sign-in and portal users

Staff sign in to the admin portal with their MCU Microsoft 365 account. The two
parts have separate jobs:

- **Microsoft 365 (Entra ID)** proves *who* the person is. No app roles are needed in Entra.
- **The `users` table (MySQL)** decides *whether* they get in and *what* they can do: `admin` or `staff`, active or deactivated.

After sign-in, the backend issues its own JWTs:

- **Access token**: 15 minutes, kept in browser memory and sent as `Authorization: Bearer …`.
- **Refresh token**: an httpOnly cookie that lasts `JWT_REFRESH_EXPIRES_IN` (8 hours by default). Each refresh reloads the user from the database, so role changes and deactivation take effect within 15 minutes.

## 1. Register the app

In the [Microsoft Entra admin center](https://entra.microsoft.com), go to **Identity → Applications → App registrations → New registration**:

| Field | Value |
|---|---|
| Name | `mcu-cro` |
| Supported account types | *Accounts in this organizational directory only* (single tenant) |
| Redirect URI | Platform **Web** (not Single-page application), `http://localhost:2001/api/auth/m365/callback` |

On the app's **Overview** page, copy the **Directory (tenant) ID** and the **Application (client) ID**.

## 2. Create a client secret

Go to **Certificates & secrets → Client secrets → New client secret**. Copy the **Value** right away, because Entra shows it only once. Note the expiry date and renew the secret before it runs out.

## 3. Configure the backend

In `backend/.env`:

```env
M365_TENANT_ID=<Directory (tenant) ID>
M365_CLIENT_ID=<Application (client) ID>
M365_CLIENT_SECRET=<client secret value>
M365_REDIRECT_URI=http://localhost:2001/api/auth/m365/callback
FRONTEND_URL=http://localhost:2001

DB_HOST=localhost
DB_PORT=3306
DB_NAME=mcu_cro
DB_USER=root
DB_PASSWORD=<your MySQL password>
```

Create the database and tables with `npm run db:migrate` (in `backend/`).

## 4. Add the first administrator

Nobody can sign in until they are in the `users` table. Create the first admin from the command line:

```sh
npm run user:create -- you@mcu.edu.ph admin "Your Name"
```

Then open http://localhost:2001/admin and click **Sign in with Microsoft 365**. From then on, manage everyone else in the portal under **Settings → Users**:

- **Add user:** enter their MCU Microsoft 365 email and pick a role. They can sign in right away.
- **Edit:** change the name or role.
- **Deactivate:** blocks sign-in while keeping the account and its history. Reactivate any time.
- **Remove:** deletes the account.

Safeguards: you can't change your own role or deactivate yourself, and the portal always keeps at least one active administrator.

On first sign-in the account is linked to the person's Microsoft 365 identity (`entra_oid`). If that email address is later given to a different person, the new person can't use the old access.

## Security measures

| Measure | Where |
|---|---|
| Every `/api` route except `/api/health` and `/api/auth/*` requires a JWT. Each request re-checks in MySQL that the user is active and the token isn't revoked; roles are read fresh from the database. | `middleware/requireAuth.js` |
| Instant revocation: deactivating a user, or **Sign out of all devices**, increments `users.token_version`, which invalidates every token issued before | `users.service.js`, `/api/auth/logout-all` |
| Rate limits: sign-in 100 / 15 min per IP, refresh 300 / 15 min per IP, API 1,500 / 15 min per user | `middleware/rateLimit.js` |
| Cross-site request blocking on every non-GET request (`Origin` must be `FRONTEND_URL`) | `middleware/checkOrigin.js` |
| Security headers (CSP, HSTS, no framing, nosniff, no `X-Powered-By`) on API responses | `helmet` in `app.js` |
| Content Security Policy on the built website (own scripts only, plus Google Fonts) | `frontend/vite.config.js` |
| JSON bodies limited to 100 KB; requests time out after 30 s | `app.js`, `server.js` |
| Audit log of sign-ins, refused sign-ins, sign-outs and user changes (who, what, before/after, IP, browser) | `audit_logs` table, `middleware/auditLog.js` |

## Production checklist

- Serve the site and API from the same HTTPS domain (for example `https://cro.mcu.edu.ph`, with `/api` going to the backend).
- Set `NODE_ENV=production` so cookies are marked `Secure`.
- Set `TRUST_PROXY` to the number of proxies in front of the API, so rate limits and the audit log see real client IPs.
- Have the web server send `Content-Security-Policy: frame-ancestors 'none'` (or `X-Frame-Options: DENY`) for the website's HTML pages, since that directive can't be set with a `<meta>` tag.
- Set `FRONTEND_URL` and `M365_REDIRECT_URI` to the production domain, and add that redirect URI to the app registration under **Web**.
- Run `npm run db:migrate` to apply migrations, using a dedicated MySQL user rather than `root`.
- Store `M365_CLIENT_SECRET`, `DB_PASSWORD` and the JWT secrets in the server's secret store, not in git.

## Sign-in errors shown on the login page

| `?error=` | Meaning |
|---|---|
| `not_configured` | `M365_*` variables are missing in `backend/.env` |
| `no_access` | Signed in with Microsoft 365, but the email isn't in the `users` table, or the account is deactivated |
| `wrong_tenant` | The account is not from the MCU tenant |
| `session_expired` | The sign-in took longer than 10 minutes, or the state check failed |
| `m365_error` | Microsoft returned an error, or the user cancelled. In development, the Microsoft error code (for example `AADSTS700025`) is shown under the message. |
