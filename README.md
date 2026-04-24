# Network Forensics Lab Helper

React UI for the Network Forensics Lab TA application.

## Local Development

Create `.env.local` with:

```bash
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-public-anon-key
```

Then run:

```bash
npm install
npm run dev
```

## Supabase Auth

The app uses Supabase Auth with the GitHub provider. In Supabase, enable GitHub under **Authentication > Providers** and configure the GitHub OAuth app callback URL:

```text
https://<project-ref>.supabase.co/auth/v1/callback
```

Add these redirect URLs in Supabase:

```text
http://127.0.0.1:5173/
http://localhost:5173/
https://network-forensics.vercel.app/
```

## Vercel

Vercel can build this project directly from GitHub.

Build settings:

```text
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
Install Command: npm ci
```

Set these Vercel environment variables:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```
