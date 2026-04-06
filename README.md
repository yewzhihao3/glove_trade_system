# Trade Intelligence Platform

This project is a monorepo containing a business-ready web application for exporters to discover potential buyers using HS Codes.

## Architecture

- **Frontend**: React (Vite) + TypeScript + TailwindCSS
- **Backend**: Python FastAPI + SQLAlchemy + Pydantic
- **Database**: PostgreSQL support (configured via environment variables)

## Getting Started

### Backend

1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Run the application:
   ```bash
   uvicorn main:app --reload
   ```
   The API will be available at `http://localhost:8000`.

### Frontend

1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:5173`.

## Features

- **Dashboard**: Modern interface to search for companies by HS Code and Country.
- **AI-Powered Discovery**: Mock AI generation service that simulates finding buyers.
- **Persistent Storage**: SQLAlchemy models for HS Codes and Companies.
- **Premium UI**: Dark mode, glassmorphism, and responsive layout.

## Environment Variables

Create a `.env` file in the `backend` directory:
```
DATABASE_URL=postgresql://user:password@localhost/dbname
```
*(Defaults to SQLite if not provided, for easy testing)*
