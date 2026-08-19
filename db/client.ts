import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema.js'

// Server-only: imported by /api routes and drizzle-kit, never by src/ (the
// Vite client bundle). DATABASE_URL is a plain (non-VITE_-prefixed) env var
// for exactly that reason — Vite won't expose it to the browser.
const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  throw new Error('Missing DATABASE_URL — see .env.example.')
}

const sql = neon(databaseUrl)

export const db = drizzle(sql, { schema })
