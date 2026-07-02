# SkyAssist – Self-Service Flight Recovery Platform

Backend API built with Node.js, Express, and MongoDB.

## Setup

**1. Create your `.env` file**

Copy `.env.example` to a new file named `.env`:

```
cp .env.example .env
```

Update the values if needed:

```
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/skyassist
```

**2. Install dependencies**

```
npm install
```

**3. Run the development server**

```
npm run dev
```

The server will start on `http://localhost:5000`.

## Available Routes

| Method | Path                    | Description            |
|--------|-------------------------|------------------------|
| GET    | /                       | Health check           |
| GET    | /api/bookings/test      | Booking route check    |
| GET    | /api/recovery/test      | Recovery route check   |
