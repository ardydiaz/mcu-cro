# Production deployment

This guide puts the MCU CRO system (Community Website + admin portal) on a production server. It assumes a Linux server (Ubuntu 22.04/24.04) with **nginx** in front and **PM2** keeping the API running. The same layout works on Windows Server with IIS (see [Windows Server / IIS](#windows-server--iis)).

The example domain is `cro.mcu.edu.ph`. Replace it with the real one everywhere.

## How it fits together

```
Browser ──HTTPS──▶ nginx (cro.mcu.edu.ph)
                     ├── /        → frontend/dist (built React site, static files)
                     └── /api/*   → Node.js API on 127.0.0.1:2002 ──▶ MySQL
                                                                 └──▶ backend/storage/uploads
```

The website and the API **must be on the same domain**. Sign-in uses an httpOnly cookie on `/api/auth`, and every non-GET request is refused unless its `Origin` is exactly `FRONTEND_URL`.

## 1. Server requirements

| Item | Version / note |
|---|---|
| Node.js | 22.9 or newer (24 LTS recommended), because the scripts use `node --env-file-if-exists` |
| MySQL | 8.0 or newer (MariaDB 10.6+ also works), with `utf8mb4` |
| nginx | Any current version, with an HTTPS certificate for the domain |
| PM2 | `npm install -g pm2` |
| Disk | Room for uploaded learning materials and photos (up to 25 MB per document, 8 MB per image) plus backups |

Install Node.js, nginx and PM2 (MySQL is in step 3):

```sh
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt install -y nodejs nginx git
sudo npm install -g pm2
node --version             # v24.x
```

Run **one** API process. The contact-form limit and other rate limits are kept in memory, so PM2 cluster mode or several instances would each count separately.

## 2. Get the code

```sh
sudo mkdir -p /var/www/mcu-cro
sudo chown $USER /var/www/mcu-cro
git clone <repository URL> /var/www/mcu-cro
cd /var/www/mcu-cro
```

## 3. Database

### Install MySQL on Ubuntu

Ubuntu 22.04 and 24.04 include MySQL 8.0 in their standard package list:

```sh
sudo apt update
sudo apt install -y mysql-server
sudo systemctl enable --now mysql
mysql --version            # mysql  Ver 8.x ...
```

If `apt install` fails with **404 Not Found** from `ph.archive.ubuntu.com`, the Philippine mirror is out of date. Switch to the main Ubuntu archive and try again:

```sh
sudo sed -i 's|http://ph.archive.ubuntu.com|http://archive.ubuntu.com|g' \
  /etc/apt/sources.list.d/ubuntu.sources /etc/apt/sources.list 2>/dev/null
sudo apt clean
sudo apt update
sudo apt install -y mysql-server
```

Secure the installation:

```sh
sudo mysql_secure_installation
```

Answer the questions like this:

| Question | Answer |
|---|---|
| Set up VALIDATE PASSWORD component? | **Y**, level **1** (MEDIUM) or **2** (STRONG) |
| Remove anonymous users? | **Y** |
| Disallow root login remotely? | **Y** |
| Remove test database? | **Y** |
| Reload privilege tables now? | **Y** |

On Ubuntu, MySQL's `root` account signs in through the operating system (`auth_socket`), not with a password. Use `sudo mysql` to open the MySQL console as root. Leave it this way; the app uses its own user (below).

### Keep MySQL private

MySQL should only accept connections from the same server. Ubuntu's default already does this. Check it:

```sh
grep -E '^\s*bind-address' /etc/mysql/mysql.conf.d/mysqld.cnf
# bind-address = 127.0.0.1
sudo ss -ltnp | grep 3306
# should show 127.0.0.1:3306, not 0.0.0.0:3306
```

If you use the `ufw` firewall, don't open port 3306. Only 22 (SSH), 80 and 443 are needed:

```sh
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

Other settings need no change: MySQL 8 already uses `utf8mb4` by default, and the app stores all times in UTC no matter what the server's time zone is.

### Create the database and app user

Open the MySQL console with `sudo mysql`, then create the database and a dedicated MySQL user. Do not use `root`.

```sql
CREATE DATABASE mcu_cro CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'mcu_cro'@'localhost' IDENTIFIED BY '<strong password>';
GRANT ALL PRIVILEGES ON mcu_cro.* TO 'mcu_cro'@'localhost';
FLUSH PRIVILEGES;
```

`ALL` on this one database is needed because migrations create and alter tables. The user has no access to any other database. Type `exit` to leave the console.

Check that the new user can sign in:

```sh
mysql -u mcu_cro -p mcu_cro -e "SELECT 1"
```

Put the same password in `DB_PASSWORD` in step 5.

## 4. Microsoft 365 app registration

Follow [m365-login.md](m365-login.md), steps 1 and 2, but add this **Web** redirect URI to the app registration:

```
https://cro.mcu.edu.ph/api/auth/m365/callback
```

You can keep the `localhost` URI for development, or use a separate app registration for production.

## 5. Backend configuration

```sh
cd /var/www/mcu-cro/backend
npm ci --omit=dev
cp .env.example .env
chmod 600 .env
npm run secret    # run twice: one value for each JWT secret
```

Edit `backend/.env`:

```env
NODE_ENV=production
PORT=2002
FRONTEND_URL=https://cro.mcu.edu.ph
# 1 = nginx only. Use 2 if Cloudflare or another proxy is also in front.
TRUST_PROXY=1

DB_HOST=localhost
DB_PORT=3306
DB_NAME=mcu_cro
DB_USER=mcu_cro
DB_PASSWORD=<strong password>

JWT_ACCESS_SECRET=<output of npm run secret>
JWT_REFRESH_SECRET=<a different output of npm run secret>
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=8h
JWT_ISSUER=mcu-cro-api

M365_TENANT_ID=<Directory (tenant) ID>
M365_CLIENT_ID=<Application (client) ID>
M365_CLIENT_SECRET=<client secret value>
M365_REDIRECT_URI=https://cro.mcu.edu.ph/api/auth/m365/callback
```

Important:

- `NODE_ENV=production` marks the sign-in cookies `Secure` (HTTPS only).
- `FRONTEND_URL` must match the address in the browser exactly: `https`, no trailing slash, no `www.` unless the site uses it.
- `TRUST_PROXY` must match the real number of proxies. If it is too low, every visitor shares nginx's IP and they all hit the rate limits together. If it is too high, visitors can fake their IP.
- Never commit `.env`. It is already in `.gitignore`.

Create the tables and the first IT administrator:

```sh
npm run db:migrate
npm run user:create -- you@mcu.edu.ph it_admin "Your Name"
```

**Do not run `npm run db:seed` in production.** It adds sample beneficiaries, stories and learning materials.

Create the upload folder and make sure the account that runs the API can write to it:

```sh
mkdir -p storage/uploads
```

## 6. Build the website

```sh
cd /var/www/mcu-cro/frontend
npm ci
npm run build
```

This creates `frontend/dist`. Leave `VITE_API_URL` at its default `/api`, because the site and API share one domain.

## 7. Start the API with PM2

```sh
cd /var/www/mcu-cro/backend
pm2 start npm --name mcu-cro-api -- start
pm2 save
pm2 startup        # run the command it prints, so the API starts after a reboot
```

Check it:

```sh
curl http://127.0.0.1:2002/api/health      # {"status":"ok"}
pm2 logs mcu-cro-api
```

## 8. nginx

`/etc/nginx/sites-available/mcu-cro`:

```nginx
server {
    listen 80;
    server_name cro.mcu.edu.ph;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name cro.mcu.edu.ph;

    ssl_certificate     /etc/ssl/certs/cro.mcu.edu.ph.crt;
    ssl_certificate_key /etc/ssl/private/cro.mcu.edu.ph.key;

    root /var/www/mcu-cro/frontend/dist;
    index index.html;

    # Learning materials can be up to 25 MB.
    client_max_body_size 26m;

    # Headers for the website's HTML pages. The CSP itself is in index.html,
    # but frame-ancestors only works as a header.
    add_header Content-Security-Policy "frame-ancestors 'none'" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Strict-Transport-Security "max-age=31536000" always;

    # API: the Node app sets its own security headers.
    location /api/ {
        proxy_pass http://127.0.0.1:2002;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
    }

    # Built files have hashed names, so they can be cached for a long time.
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable" always;
        try_files $uri =404;
    }

    # Single-page app: every other path (for example /activities/..., /admin) loads index.html.
    location / {
        add_header Cache-Control "no-cache" always;
        add_header Content-Security-Policy "frame-ancestors 'none'" always;
        add_header X-Frame-Options "DENY" always;
        add_header X-Content-Type-Options "nosniff" always;
        try_files $uri /index.html;
    }
}
```

The headers are repeated inside `location /` because nginx drops the server-level `add_header` lines in any location that sets its own.

Enable it:

```sh
sudo ln -s /etc/nginx/sites-available/mcu-cro /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

## 9. Check that it works

1. `https://cro.mcu.edu.ph` opens the Community Website, and refreshing a deep link such as `/learning-resources` still works.
2. `https://cro.mcu.edu.ph/api/health` returns `{"status":"ok"}`.
3. `https://cro.mcu.edu.ph/admin` → **Sign in with Microsoft 365** brings you back signed in. If not, see the error table in [m365-login.md](m365-login.md).
4. In the browser's developer tools, the `cro_rt` cookie is marked **Secure** and **HttpOnly**.
5. Upload a photo in the admin portal, publish it, and check that it shows on the website.
6. Send a message through **Contact us**. Wait a few seconds before sending, because messages sent within 3 seconds are dropped as spam. Then check that it appears in **Content → Messages**.
7. Under **Settings → Users**, add the CRO staff with their roles, and assign barangays to the Community Coordinators.

## 10. Backups

Back up **both** the database and the uploaded files. Neither is useful without the other.

`/usr/local/bin/mcu-cro-backup.sh`:

```sh
#!/bin/sh
set -e
DEST=/var/backups/mcu-cro
STAMP=$(date +%F)
mkdir -p "$DEST"
mysqldump --single-transaction --routines mcu_cro | gzip > "$DEST/db-$STAMP.sql.gz"
tar -czf "$DEST/uploads-$STAMP.tar.gz" -C /var/www/mcu-cro/backend/storage uploads
find "$DEST" -type f -mtime +30 -delete    # keep 30 days
```

Run it daily from root's crontab (`sudo crontab -e`). As root, `mysqldump` signs in through `auth_socket`, so the script needs no password:

```
30 1 * * * /usr/local/bin/mcu-cro-backup.sh
```

Make the script executable with `sudo chmod 700 /usr/local/bin/mcu-cro-backup.sh`.

Copy the backups to another machine or to storage approved by MCU. They contain beneficiary personal data, so protect them under the Data Privacy Act. Test a restore at least once:

```sh
gunzip < db-YYYY-MM-DD.sql.gz | mysql mcu_cro
tar -xzf uploads-YYYY-MM-DD.tar.gz -C /var/www/mcu-cro/backend/storage
```

## 11. Updating to a new version

Pull the code yourself, then run the deploy script from the project folder, as the app user (not root):

```sh
cd /var/www/mcu-cro
/usr/local/bin/mcu-cro-backup.sh       # back up first
git pull origin main
./deploy.sh
```

The script does not pull. It applies the code that is already on the server: installs packages, applies new migrations, restarts the API, rebuilds the website and checks that the API answers. It stops at the first error.

The same steps by hand:

```sh
cd /var/www/mcu-cro
/usr/local/bin/mcu-cro-backup.sh       # back up first
git pull

cd backend
npm ci --omit=dev
npm run db:migrate                     # applies only new migrations
pm2 restart mcu-cro-api

cd ../frontend
npm ci
npm run build
```

Nothing else is needed for the website: nginx serves the new `dist` straight away.

## 12. Maintenance

| Task | When |
|---|---|
| Renew the Microsoft 365 client secret, update `M365_CLIENT_SECRET`, then `pm2 restart mcu-cro-api` | Before the expiry date shown in Entra |
| Renew the HTTPS certificate (automatic with certbot) | Before it expires |
| Check `pm2 logs mcu-cro-api` and free disk space | Monthly |
| Review users under **Settings → Users** and deactivate staff who have left | Every semester |
| Apply OS, Node.js and MySQL security updates | Monthly |

To sign everyone out at once (for example after a leaked secret), change both JWT secrets in `.env` and restart the API.

## Windows Server / IIS

The same steps apply, with these differences:

- Run the API as a Windows service (for example with [NSSM](https://nssm.cc) running `npm start` in `backend`), or with `pm2` and `pm2-windows-startup`.
- In IIS, install **URL Rewrite** and **Application Request Routing**, and enable the proxy in ARR.
- Point the site at `frontend\dist`. Add a rewrite rule that sends `api/(.*)` to `http://127.0.0.1:2002/api/{R:1}`, and a second rule that sends every request that isn't a file to `/index.html`.
- Set **maxAllowedContentLength** to 27262976 (26 MB) under Request Filtering.
- Add the `Content-Security-Policy: frame-ancestors 'none'` and `X-Frame-Options: DENY` response headers.
- Keep `TRUST_PROXY=1`.
