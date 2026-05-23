/**
 * This worker acts as the router for fetch requests, protecting the APIs
 * using Cloudflare Access JWT validation (if used).
 */

import { verifyJwt } from './api/jwt';
import { templates } from './templates/index';
import type { Env } from './api/jwt';

/**
 * Injects strict security headers into the response.
 */
function applySecurityHeaders(response: Response): Response {
	const newResponse = new Response(response.body, response);

	// Content Security Policy
	newResponse.headers.set(
		'Content-Security-Policy',
		"default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://cdn.jsdelivr.net; frame-ancestors 'none';"
	);

	newResponse.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
	newResponse.headers.set('X-Content-Type-Options', 'nosniff');
	newResponse.headers.set('X-Frame-Options', 'DENY');

	return newResponse;
}

export default {
	/**
	 * Main HTTP request handler (Fetch event).
	 * Handles routing and Zero Trust JWT validation for API endpoints.
	 */
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url);

		// 1. Authorisation Check (JWT Validation) - will skip if Zero Trust not enabled with variables set.
		const jwtHeader = request.headers.get('Cf-Access-Jwt-Assertion');
		const verification = await verifyJwt(jwtHeader, env);

		if (!verification.isValid) {
			const errorMsg = verification.error || 'Access verification failed.';
			return applySecurityHeaders(new Response(JSON.stringify({ error: 'Unauthorised', details: errorMsg }), {
				status: 401,
				headers: { 'Content-Type': 'application/json; charset=utf-8' },
			}));
		}

		const userEmail = verification.payload?.email || 'unknown-user@openmarkdown.local';

		// 2. API Routes
		// GET /api/config - Provide user details to the decoupled SPA
		if (url.pathname === '/api/config' && request.method === 'GET') {
			return applySecurityHeaders(new Response(JSON.stringify({ email: userEmail }), {
				status: 200,
				headers: { 'Content-Type': 'application/json; charset=utf-8' },
			}));
		}

		// GET /api/templates - List all available templates (id, name, description)
		if (url.pathname === '/api/templates' && request.method === 'GET') {
			const listing = templates.map(({ id, name, description }) => ({ id, name, description }));
			return applySecurityHeaders(new Response(JSON.stringify(listing), {
				status: 200,
				headers: { 'Content-Type': 'application/json; charset=utf-8' },
			}));
		}

		// GET /api/templates/:id - Retrieve a specific template's full content
		const templateMatch = url.pathname.match(/^\/api\/templates\/([a-z0-9-]+)$/);
		if (templateMatch && request.method === 'GET') {
			const templateId = templateMatch[1];
			const template = templates.find((t) => t.id === templateId);
			if (!template) {
				return applySecurityHeaders(new Response(JSON.stringify({ error: 'Template not found' }), {
					status: 404,
					headers: { 'Content-Type': 'application/json; charset=utf-8' },
				}));
			}
			return applySecurityHeaders(new Response(JSON.stringify({ id: template.id, name: template.name, content: template.content }), {
				status: 200,
				headers: { 'Content-Type': 'application/json; charset=utf-8' },
			}));
		}

		// 3. Fallback for unhandled routes
		return applySecurityHeaders(new Response(JSON.stringify({ error: 'Not Found' }), {
			status: 404,
			headers: { 'Content-Type': 'application/json; charset=utf-8' },
		}));
	},
} satisfies ExportedHandler<Env>;
