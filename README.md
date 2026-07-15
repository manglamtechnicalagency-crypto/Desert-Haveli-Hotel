# jaisalmerdeserthotel

Premium heritage hotel website for The Desert Haveli Guest House Jaisalmer.

## Run locally

```bash
npm install
npm run dev
```

## Cloudinary media storage

The admin media uploads support Cloudinary for room photos, website images,
gallery images, and background videos. Set `VITE_CLOUDINARY_CLOUD_NAME` in the
frontend environment and set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and
`CLOUDINARY_API_SECRET` in the server/Vercel environment. The API secret must
never be prefixed with `VITE_` or committed to the repository. Existing R2 or
Supabase paths remain readable until assets are replaced or migrated.
