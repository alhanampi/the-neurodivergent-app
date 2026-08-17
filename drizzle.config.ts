import { config } from 'dotenv'
import { defineConfig } from 'drizzle-kit'

config({ path: '.env.local', quiet: true })

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  throw new Error('Missing DATABASE_URL in .env.local — see .env.example.')
}

export default defineConfig({
  schema: './db/schema.ts',
  out: './db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: databaseUrl,
  },
})
