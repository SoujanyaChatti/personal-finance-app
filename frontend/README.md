# Frontend — Personal Finance Assistant

## Tech Stack
- React.js
- Tailwind CSS
- Chart.js (react-chartjs-2)
- Axios
- Vite

## Setup
1. Install Node.js.
2. Run `npm install` in `frontend/`.
3. Start dev server: `npm run dev`
4. Access at [http://localhost:5173](http://localhost:5173)

## Structure
- `public/` — Static assets
- `src/components/` — Reusable UI
- `src/pages/` — Main pages
- `src/hooks/` — Custom hooks
- `src/styles/` — Tailwind and custom CSS

## Features
- Auth (login/register)
- Transaction CRUD
- Charts (expenses by category/date)
- Receipt/PDF upload

Configure API base URL in Axios as needed.

## Environment Variables

Copy `.env.example` to `.env.local` and set the API URL:

```
VITE_API_URL=http://localhost:3000/api
```

If deploying, set `VITE_API_URL` to your hosted backend URL.

In code, use `import.meta.env.VITE_API_URL` for all API requests.

## Usage & Testing

1. Start the backend (see backend/README.md for .env setup and MongoDB instructions).
2. Start the frontend:
   ```sh
   cd frontend
   npm install
   npm run dev
   ```
3. Open http://localhost:5173 in your browser.
4. Register a user, login, and use all features (transactions, categories, receipts, PDF import, charts).

## Deployment
- Set `VITE_API_URL` in your frontend `.env` to your hosted backend URL.
- Set `MONGO_URI` in your backend `.env` to your cloud MongoDB URI (Atlas, etc.) if deploying.
- See backend/README.md for Docker instructions.

## Notes
- All API URLs and DB URIs are configurable via environment variables.
- No sensitive credentials are committed to the repo.
- For local testing, MongoDB must be running locally (or use your own Atlas cluster).

---

**Enjoy your Personal Finance Assistant!**
