# SETUP

## 1. Project Setup

```bash
git clone <your-repository-url>
cd Lakshya
```

Open two terminals:

```bash
cd lakshyabackend
```

```bash
cd lakshyafrontend
```

## 2. Backend Setup

From `lakshyabackend`:

```bash
npm install
```

Create a `.env` file in `lakshyabackend` with:

```env
MONGO_URI=
JWT_SECRET=
EMAIL_USER=
EMAIL_PASS=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
GROQ_API_KEY=
```

Run backend server:

```bash
npm run dev
```

## 3. Frontend Setup

From `lakshyafrontend`:

```bash
npm install
npm run dev
```

## 4. Notes

- MongoDB must be running before starting the backend.
- Ensure all required environment variables are set correctly.
- Default backend port: `3000`.
- Default frontend port: `5173`.
