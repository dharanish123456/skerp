# SKERP Deployment Reference

Last updated: 2026-07-13

This file contains the deployment locations and commands for SKERP. It does not contain passwords, private keys, or other secrets.

## Public URLs

- Frontend: https://erp.skenterprises4u.com/
- Backend API: https://api.skenterprises4u.com/api
- API health/data check: https://api.skenterprises4u.com/api/companies

The frontend must use this API base URL:

```env
VITE_API_BASE_URL=https://api.skenterprises4u.com/api
```

Do not use the old production URL with `http://56.228.25.70:8087` because browsers block it as mixed content when the frontend uses HTTPS.

## AWS EC2 Backend

- Region: `eu-north-1` (Europe/Stockholm)
- Instance name: `skerp-backend`
- Instance ID: `i-090848eed7cd51ade`
- Instance type: `t3.micro`
- Public IP: `56.228.25.70`
- Private IP: `172.31.41.87`
- Public DNS: `ec2-56-228-25-70.eu-north-1.compute.amazonaws.com`
- Linux username: `ubuntu`
- Key file on Windows: `C:\Users\Dharanish\Downloads\skerp-backend-key.pem`
- Security group: `launch-wizard-1` (`sg-08226f77fffc7b3cc`)

Important: the instance currently has no Elastic IP. The public IP can change after stopping and starting the instance. If the IP changes, update the DNS record for `api.skenterprises4u.com`, the RDS security-group rule if needed, and the Nginx configuration only if it contains the IP.

### Connect from Windows PowerShell

Make sure the EC2 security group allows SSH port `22` from your current IP, then run:

```powershell
cd $env:USERPROFILE\Downloads
ssh -i .\skerp-backend-key.pem ubuntu@56.228.25.70
```

The EC2 username is `ubuntu`. `Dharanish` is the AWS account name, not the Ubuntu SSH username.

### Backend files and service

- JAR: `/home/ubuntu/skerp-backend-0.0.1-SNAPSHOT.jar`
- Server environment file: `/home/ubuntu/.env`
- Systemd service: `/etc/systemd/system/skerp-backend.service`
- Nginx site: `/etc/nginx/sites-available/skerp-api`
- Nginx enabled link: `/etc/nginx/sites-enabled/skerp-api`
- Application port: `8087` (internal; Nginx exposes HTTPS publicly)

The server `.env` must contain the real RDS password. Never commit or paste that value into this file.

Expected server environment variable names:

```env
SERVER_PORT=8087
DB_URL=jdbc:postgresql://skerp-db.ctqsgw64ako2.eu-north-1.rds.amazonaws.com:5432/skerp_backend
DB_USERNAME=postgres
DB_PASSWORD=<RDS password>
CORS_ALLOWED_ORIGINS=https://erp.skenterprises4u.com,http://erp.skenterprises4u.com
UPLOAD_DIR=uploads/employee-proofs
```

### Check or restart the backend

```bash
sudo systemctl status skerp-backend
sudo systemctl restart skerp-backend
sudo journalctl -u skerp-backend -n 100 --no-pager
curl http://localhost:8087/api/companies
```

Expected response for an empty database is usually `[]`.

### Check Nginx and HTTPS

```bash
sudo nginx -t
sudo systemctl reload nginx
sudo certbot certificates
curl -i https://api.skenterprises4u.com/api/companies
```

The API certificate is managed on EC2 with Certbot. A successful response should contain `HTTP/2 200` (or `HTTP/1.1 200`) and JSON.

## AWS RDS PostgreSQL

- DB identifier: `skerp-db`
- Database name: `skerp_backend`
- Master username: `postgres`
- Endpoint: `skerp-db.ctqsgw64ako2.eu-north-1.rds.amazonaws.com`
- Port: `5432`
- Region/AZ: `eu-north-1c`
- RDS security group: `skerp-db-sg` (`sg-0d57c061b00a0b873`)
- EC2 security group: `launch-wizard-1` (`sg-08226f77fffc7b3cc`)

RDS inbound PostgreSQL access should allow the EC2 security group. Avoid opening port `5432` to the whole internet. The database password is stored only in the server environment file and the password manager.

## DNS records

The DNS provider is GoDaddy/cPanel DNS.

- `api.skenterprises4u.com` -> EC2 public IP `56.228.25.70`
- `erp.skenterprises4u.com` -> frontend cPanel hosting
- Optional alias: `www.erp.skenterprises4u.com` -> CNAME to `erp.skenterprises4u.com`

The `www.erp.skenterprises4u.com` record was not resolving during the last certificate attempt. Add the optional CNAME only if the `www` URL is required.

## Frontend deployment

From the project root on Windows:

```powershell
npm install
npm run build
```

The production files are created in:

```text
dist\
```

Upload the contents of `dist` to the frontend document root in cPanel:

```text
/public_html/erp.skenterprises4u.com/
```

The `.well-known/acme-challenge/` folder is only for certificate verification. Do not delete it while a certificate request is active.

## SSL status

- API: HTTPS is working through Nginx and Certbot at `https://api.skenterprises4u.com`.
- Frontend: cPanel previously showed a self-signed certificate for `erp.skenterprises4u.com`; a trusted AutoSSL/Let's Encrypt certificate still needs to be installed and verified.
- A trusted certificate issuer should say Let’s Encrypt, GoDaddy, or another public certificate authority. It should not say `CN=erp.skenterprises4u.com`.

Verify the frontend certificate from CloudShell:

```bash
curl -Iv https://erp.skenterprises4u.com 2>&1 | grep -E "subject:|issuer:|expire date:"
```

## Common troubleshooting

### Frontend shows mixed-content errors

Rebuild and redeploy after confirming `.env` contains:

```env
VITE_API_BASE_URL=https://api.skenterprises4u.com/api
```

Clear the browser cache or use an InPrivate window after redeployment.

### API returns 502 Bad Gateway

Check whether Spring Boot is running and listening on port `8087`:

```bash
sudo systemctl status skerp-backend
curl http://localhost:8087/api/companies
sudo nginx -t
```

### SSH connection times out

In the EC2 security group, set inbound SSH port `22` source to **My IP**, save, and retry the PowerShell command. The local public IP may change.

### Database connection fails

Check the RDS endpoint, database password, port `5432`, and that the RDS security group allows the EC2 security group. Then inspect:

```bash
sudo journalctl -u skerp-backend -n 100 --no-pager
```

## Security reminders

- Never commit `.env`, RDS passwords, PEM files, or private certificate keys.
- Keep SSH port `22` restricted to your current IP.
- Keep RDS port `5432` restricted to the EC2 security group.
- Do not expose the Spring Boot port publicly after confirming Nginx works; eventually remove public port `8087` from the EC2 security group.
- Consider allocating an Elastic IP before relying on the current EC2 public IP in DNS.
