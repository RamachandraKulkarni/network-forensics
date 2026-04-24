# Network Forensics Lab Helper

React UI for the Network Forensics Lab TA application.

## Local Development

Create `.env.local` with:

```bash
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-public-anon-key
MINIMAX_API_KEY=your-minimax-token-plan-api-key
MINIMAX_MODEL=MiniMax-M2.7
OPENROUTER_API_KEY=your-openrouter-api-key
OPENROUTER_IMAGE_MODEL=google/veo-3.1-fast
OPENROUTER_SITE_URL=http://127.0.0.1:5173
OPENROUTER_APP_NAME=Network Forensics Lab TA
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

## Lab AI Context

Each lab chat automatically includes the selected lab metadata plus summarized context from the
corresponding lab manual in `src/labManualContext.js`. The original PDFs in `knowledge-documents/`
are not deployed because that folder is gitignored.

Student image attachments are sent to the server with the chat request. The server sends the latest
attached image batch to OpenRouter for image understanding, injects that image analysis into the
system context, and then asks MiniMax to produce the final student-facing answer.

`OPENROUTER_IMAGE_MODEL` is the image-analysis model entry point. It is currently set to the
requested `google/veo-3.1-fast`; if OpenRouter rejects that model for chat/image understanding,
replace it with a vision-capable OpenRouter chat model.

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
MINIMAX_API_KEY
MINIMAX_MODEL
OPENROUTER_API_KEY
OPENROUTER_IMAGE_MODEL
OPENROUTER_SITE_URL
OPENROUTER_APP_NAME
```

`MINIMAX_API_KEY` is server-only. Do not add a `VITE_` prefix. The server also accepts
`MINIMAX_TOKEN_PLAN_API_KEY` if you prefer that env var name.
`OPENROUTER_API_KEY` is also server-only.
