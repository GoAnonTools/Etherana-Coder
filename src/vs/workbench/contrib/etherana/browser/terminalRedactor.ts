/*--------------------------------------------------------------------------------------
 *  © 2026 GoAnon. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

const commonSecretPatterns = [
	// 1. Specific provider key formats
	/sk-ant-[a-zA-Z0-9\-_]{32,}/g,                          // Anthropic
	/sk-[a-zA-Z0-9\-_]{32,}/g,                              // OpenAI (includes sk-proj-... and legacy sk-...)
	/AIza[0-9A-Za-z\-_]{35}/g,                              // Google AI / Firebase
	/hf_[a-zA-Z0-9]{32,}/g,                                 // HuggingFace
	/(?:pk_live_|sk_live_)[0-9a-zA-Z]{24,}/g,               // Stripe live keys
	/(?:pk_test_|sk_test_)[0-9a-zA-Z]{24,}/g,               // Stripe test keys
	/gh[pos_][a-zA-Z0-9]{36,}/g,                            // GitHub tokens (ghp_, gho_, ghs_)
	/ey[a-zA-Z0-9]{10,}\.ey[a-zA-Z0-9]{10,}\.[a-zA-Z0-9_-]{10,}/g, // JWT
	/xox[pborsan]-[0-9]{12,}-[0-9]{12,}-[0-9]{12,}-[a-z0-9]{32,}/gi, // Slack tokens
	/AKIA[0-9A-Z]{16}/g,                                    // AWS Access Key ID
	/dp\.pt\.[a-zA-Z0-9]{40,}/g,                            // Doppler tokens
	/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, // UUIDs used as secrets (contextual — see pattern 5)

	// 2. Private key blocks (PEM format — note: no "BLOCK" suffix in real PEM)
	/-----BEGIN (?:RSA |EC |OPENSSH |PGP |DSA )?PRIVATE KEY-----[\s\S]+?-----END (?:RSA |EC |OPENSSH |PGP |DSA )?PRIVATE KEY-----/g,

	// 3. URL-embedded credentials: https://user:password@host
	/https?:\/\/[^:@\s]+:[^@\s]+@[^\s]+/gi,

	// 4. Contextual KEY=VALUE secrets
	/(?:api_?key|secret|token|password|passwd|pwd|auth_?token|access_?token|refresh_?token|private_?key|client_?secret)\s*[:=]\s*["']?[a-zA-Z0-9_\-\.\/\+]{10,}["']?/gi,

	// 5. Authentication headers
	/(?:Authorization|Bearer)\s*[:\s]\s*(?:Bearer\s+)?[a-zA-Z0-9\-\._~+\/]{20,}/gi,

	// 6. Context-aware high-entropy base64 near a secret label
	/(?:token|secret|password|api_?key|access_?token|refresh_?token|auth|bearer)\b.{0,30}\b[a-zA-Z0-9+\/]{40,}={0,2}/gi,

	// 7. Very long hex strings (raised threshold avoids SHA-256 false positives)
	/[a-f0-9]{96,}/gi,
];

/**
 * Secret redaction for terminal output before it is sent to an LLM.
 * Covers the most common secret formats; not exhaustive — avoid putting
 * raw secrets in your terminal if possible.
 */
export function redactSecrets(text: string): { redactedText: string; count: number } {
	let count = 0;
	let currentText = text;

	for (const pattern of commonSecretPatterns) {
		const matches = currentText.match(pattern);
		if (matches) {
			count += matches.length;
			currentText = currentText.replace(pattern, (match) => {
				// For KEY=VALUE style matches, preserve the key name for context
				const eqIdx = match.indexOf('=');
				const colIdx = match.indexOf(':');
				const separatorIdx = eqIdx !== -1 ? eqIdx : colIdx;

				if (separatorIdx !== -1 && separatorIdx < 30) {
					return match.slice(0, separatorIdx + 1) + ' [REDACTED]';
				}
				return '[REDACTED]';
			});
		}
	}

	return { redactedText: currentText, count };
}
