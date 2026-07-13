# Cloudflare R2 media setup

The admin media manager uploads directly to Cloudflare R2 through short-lived signed URLs. R2 secrets stay in Vercel server environment variables; never expose them as `VITE_` variables.

Create an R2 bucket, an R2 API token with Object Read/Write access limited to that bucket, and a custom public domain such as `media.example.com`. Configure the bucket CORS policy to allow `PUT` from the production site and local development origin:

```json
[
  {
    "AllowedOrigins": ["https://desert-haveli-hotel-beta.vercel.app", "http://localhost:5173"],
    "AllowedMethods": ["PUT", "GET", "HEAD"],
    "AllowedHeaders": ["content-type"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

Set these in Vercel for Preview and Production:

```text
R2_ACCOUNT_ID
R2_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY
R2_BUCKET_NAME=desert-haveli-media
R2_PUBLIC_BASE_URL=https://media.example.com
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
VITE_R2_PUBLIC_BASE_URL=https://media.example.com
```

The existing Supabase tables continue to store media metadata. Existing Supabase media remains readable until its records are migrated to matching R2 keys.
