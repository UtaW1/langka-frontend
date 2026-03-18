# Langka Frontend

Vite + React frontend for Langka Order Management.

## Prerequisites

- Node.js 18+
- npm

## Environment Setup

This app reads the API base URL from `VITE_API_URL`.

Create your local env file:

```bash
cp .env.example .env.local
```

Then set the correct backend URL in `.env.local`:

```env
VITE_API_URL=http://localhost:8000/api
```

For a deployed backend, use your real API host, for example:

```env
VITE_API_URL=https://langkacafe.online/api
```

If `VITE_API_URL` is missing, the frontend falls back to `http://localhost:8000/api`.

## Run

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```
