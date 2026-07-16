# Security Environment

All values below are names only. Never commit real secret values.

| Variable | Purpose | Required | Safe example | Secret |
|---|---|---:|---|---:|
| `VITE_SUPABASE_URL` | Browser Supabase project URL | Yes for live data | `https://project.supabase.co` | No |
| `VITE_SUPABASE_ANON_KEY` | Browser publishable Supabase key | Yes for live data | `placeholder-anon-key` | No, but subject to RLS |
| `SUPABASE_URL` | Server Supabase URL | Media API | `https://project.supabase.co` | No |
| `SUPABASE_SERVICE_ROLE_KEY` | Server admin verification client | Media API | `placeholder-service-role-key` | **Yes** |
| `R2_ACCOUNT_ID` | Cloudflare account | R2 mode | `account-id` | No |
| `R2_ACCESS_KEY_ID` | R2 signing credential | R2 mode | `access-key-id` | **Yes** |
| `R2_SECRET_ACCESS_KEY` | R2 signing secret | R2 mode | `secret-access-key` | **Yes** |
| `R2_BUCKET_NAME` | R2 bucket | R2 mode | `desert-haveli-media` | No |
| `VITE_R2_PUBLIC_BASE_URL` | Browser public media base | R2 mode | `https://media.example.com` | No |
| `VITE_CLOUDINARY_CLOUD_NAME` | Browser Cloudinary URL construction | Cloudinary mode | `cloud-name` | No |
| `CLOUDINARY_CLOUD_NAME` | Server Cloudinary account | Cloudinary mode | `cloud-name` | No |
| `CLOUDINARY_API_KEY` | Server Cloudinary signing key | Cloudinary mode | `api-key` | Sensitive |
| `CLOUDINARY_API_SECRET` | Server Cloudinary signing secret | Cloudinary mode | `api-secret` | **Yes** |
| `VITE_ADMIN_LOGIN_EMAIL` | Admin login identifier configured by UI | Admin UI | `admin@example.com` | No, but avoid exposing personal data |
| `RATE_LIMIT_UPLOAD_WINDOW_SECONDS` | Upload limiter window | Optional; default 60 | `60` | No |
| `RATE_LIMIT_UPLOAD_MAX` | Upload requests per key/window | Optional; default 30 | `30` | No |
| `RATE_LIMIT_ADMIN_WINDOW_SECONDS` | Admin limiter window | Optional; default 60 | `60` | No |
| `RATE_LIMIT_ADMIN_MAX` | Admin requests per key/window | Optional; default 30 | `30` | No |
| `RATE_LIMIT_AUTH_WINDOW_SECONDS` | PIN recovery limiter window | Optional; default 60 | `60` | No |
| `RATE_LIMIT_AUTH_MAX` | PIN recovery requests per key/window | Optional; default 10 | `10` | No |
| `ADMIN_PIN_RECOVERY_OTP_TTL_SECONDS` | Recovery-code lifetime | Optional; default 600 | `600` | No |
| `ADMIN_PIN_RECOVERY_MAX_OTP_ATTEMPTS` | Attempts allowed per recovery code | Optional; default 5 | `5` | No |

Production guidance: use the platform secret manager for all secret variables, separate staging/production projects, rotate credentials if exposure is suspected, and replace the local in-memory limiter with a shared edge/store limiter for multi-instance production.
