import type { IncomingMessage, ServerResponse } from 'node:http'

/**
 * Minimal stand-ins for @vercel/node's VercelRequest/VercelResponse types.
 * We deliberately don't depend on the `@vercel/node` package itself — it
 * pulls in a heavy build-analysis toolchain (Python/YAML/TOML tooling) as
 * transitive dependencies purely for these type declarations, and that
 * toolchain is the source of several unpatched transitive CVEs. Vercel's
 * Node.js runtime really does provide parsed `query`/`body`/`cookies` and
 * the `status()`/`json()`/`send()` helpers on top of plain Node http
 * objects — these types just describe that shape directly.
 */
export interface VercelApiRequest extends IncomingMessage {
  query: Record<string, string | string[]>
  cookies: Record<string, string>
  body: unknown
}

export interface VercelApiResponse extends ServerResponse {
  status: (statusCode: number) => VercelApiResponse
  json: (body: unknown) => VercelApiResponse
  send: (body: unknown) => VercelApiResponse
}
