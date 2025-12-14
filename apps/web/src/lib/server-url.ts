export function getServerUrl() {
	// Prefer explicit env, fallback for local dev (web:3001, server:3000)
	return process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3000";
}
