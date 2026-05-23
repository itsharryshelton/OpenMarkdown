/**
 * TypeScript module declaration for importing .md files as raw text strings.
 * Wrangler's esbuild processes these via the "Text" rule in wrangler.jsonc.
 */
declare module '*.md' {
	const content: string;
	export default content;
}
