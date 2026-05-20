/*--------------------------------------------------------------------------------------
 *  © 2026 GoAnon. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

const commonSecretPatterns = [
	// 1. Specific provider patterns (very unlikely to have false positives)
	/(?:sk-[a-f0-9]{32,})/gi, // OpenAI and generic sk- keys
	/(?:pk_live_[0-9a-zA-Z]{24,})/g, // Stripe live keys
	/(?:sk_live_[0-9a-zA-Z]{24,})/g, // Stripe secret keys
	/(?:gh[p_o]_[a-zA-Z0-9]{36,})/g, // GitHub tokens
	/(?:ey[a-zA-Z0-9]{10,}\.ey[a-zA-Z0-9]{10,}\.[a-zA-Z0-9_-]{10,})/g, // JWT
	/(?:xox[pborsan]-[0-9]{12,}-[0-9]{12,}-[0-9]{12,}-[a-z0-9]{32,})/gi, // Slack tokens
	/(?:AKIA[0-9A-Z]{16})/g, // AWS Access Key ID

	// 2. Private Keys (highly sensitive)
	/-----BEGIN (?:RSA |EC |OPENSSH |PGP )?PRIVATE KEY BLOCK-----[\s\S]+?-----END (?:RSA |EC |OPENSSH |PGP )?PRIVATE KEY BLOCK-----/g,

	// 3. Contextual Secrets (KEY=VALUE)
	// We redact values when they follow an explicit secret/token label.
	// This covers env vars and config files (e.g. MY_TOKEN=...)
	/(?:(?:api_?key|secret|token|password|passwd|pwd|auth_?token|access_?token|refresh_?token)\s*[:=]\s*["']?[a-zA-Z0-9_\-\.\/\+]{10,}["']?)/gi,

	// 4. Authentication Headers
	// Catch "Authorization: Bearer <token>" or "Bearer <token>" in logs
	/(?:(?:Authorization|Bearer)\s*[:\s]\s*(?:Bearer\s+)?[a-zA-Z0-9\-\._~+\/]{20,})/gi,

	// 5. Context-aware broad high-entropy redaction
	// Instead of redacting ALL long base64 strings (which false-flags many build logs/hashes),
	// we only redact long high-entropy strings when preceded by a "secret-like" word within 30 characters.
	/(?:(?:token|secret|password|api_?key|access_?token|refresh_?token|auth|bearer)\b.{0,30}\b[a-zA-Z0-9+\/]{40,}={0,2})/gi,

	// 6. Extremely long high-entropy hex strings
	// Increased threshold from 64 to 96 chars to prevent redacting standard 64-char hashes (like SHA-256)
	// which are common in normal logs, while still catching very long generated secrets.
	/(?:[a-f0-9]{96,})/gi,
];

/**
 * Basic secret redaction for terminal output.
 * Note: This is not exhaustive but catches the most common patterns.
 */
export function redactSecrets(text: string): { redactedText: string; count: number } {
	let count = 0;
	let currentText = text;

	for (const pattern of commonSecretPatterns) {
		const matches = currentText.match(pattern);
		if (matches) {
			count += matches.length;
			currentText = currentText.replace(pattern, (match) => {
				// Keep a bit of prefix if it's a KEY=VALUE style to preserve context
				const eqIdx = match.indexOf('=');
				const colIdx = match.indexOf(':');
				const separatorIdx = eqIdx !== -1 ? eqIdx : colIdx;

				if (separatorIdx !== -1 && separatorIdx < 20) {
					return match.slice(0, separatorIdx + 1) + ' [REDACTED]';
				}
				return '[REDACTED]';
			});
		}
	}

	return { redactedText: currentText, count };
}
