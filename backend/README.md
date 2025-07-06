# Backend — Personal Finance Assistant

## Tech Stack
- Node.js, Express.js
- MongoDB, Mongoose
- Multer (file uploads)
- JWT, bcrypt (auth)
- Tesseract.js, pdf2pic, pdf-parse, Natural (receipt/PDF processing)

## Setup
1. Install Node.js and MongoDB.
2. Run `npm install` in `backend/`.
3. Create a `.env` file with:
   - `MONGO_URI=<your-mongodb-uri>`
   - `JWT_SECRET=<your-secret>`
   - `PORT=3000`
   - `GEMINI_API_KEY=<your-gemini-api-key>`
4. Start server: `npm start`
5. (Optional) Use Docker: `docker build -t finance-app . && docker run -p 3000:3000 finance-app`

## Structure
- `src/config/` — DB and env config
- `src/controllers/` — API logic
- `src/middleware/` — Auth, error handling
- `src/models/` — Mongoose schemas
- `src/routes/` — API routes
- `src/services/` — Receipt/PDF parsing
- `src/utils/` — Helpers

## API
See code for endpoints. Auth required for most routes.

To get a Gemini API key:
1. Go to https://ai.google.dev/ and sign in with your Google account.
2. Create an API key (free tier available as of June 2024).
3. Paste it in your `.env` as shown above.
