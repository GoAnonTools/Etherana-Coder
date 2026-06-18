/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Etherana Coder.
 *--------------------------------------------------------------------------------------------*/

export type EtheranaSkillCategory = 'development' | 'create';

export const etheranaSkillIds = [
	'frontend-design',
	'web-artifacts-builder',
	'mcp-builder',
	'webapp-testing',
	'security-reviewer',
	'privacy-auditor',
	'test-writer',
	'documentation-writer',
	'skill-creator',
] as const;

export type EtheranaSkillId = typeof etheranaSkillIds[number];

export type EtheranaSkill = {
	id: EtheranaSkillId;
	name: string;
	category: EtheranaSkillCategory;
	description: string;
	prompt: string;
};

export const builtinEtheranaSkills: readonly EtheranaSkill[] = [
	{
		id: 'frontend-design',
		name: 'Frontend Design',
		category: 'development',
		description: 'Avoid generic AI-looking UI and make stronger React, Tailwind, layout, spacing, and visual hierarchy decisions.',
		prompt: `You have the Frontend Design skill enabled.

When working on UI, frontend, React, Tailwind, components, layouts, landing pages, dashboards, settings screens, or visual polish:
- Avoid generic AI-looking designs, bland centered cards, predictable gradients, and weak spacing.
- Make confident, tasteful design decisions with clear hierarchy, rhythm, contrast, and responsive behavior.
- Prefer existing project conventions, design tokens, and components before inventing new styles.
- Improve empty states, loading states, error states, hover/focus states, and accessibility basics when relevant.
- Keep implementation practical and shippable. Do not over-engineer visual effects.
- Briefly explain important design tradeoffs when useful.`,
	},
	{
		id: 'web-artifacts-builder',
		name: 'Web Artifacts Builder',
		category: 'development',
		description: 'Build rich HTML/React/Tailwind/shadcn-style web artifacts and preview-friendly UI.',
		prompt: `You have the Web Artifacts Builder skill enabled.

When asked to create a web artifact, demo, prototype, or previewable UI:
- Prefer self-contained React components where appropriate.
- Use Tailwind-style utility classes and clean component structure when the project supports it.
- Favor polished, interactive, responsive artifacts that can be tested quickly.
- Keep dependencies minimal and follow existing project setup.
- Include realistic sample data, useful empty states, and clear component boundaries when helpful.`,
	},
	{
		id: 'mcp-builder',
		name: 'MCP Builder',
		category: 'development',
		description: 'Guide creation of high-quality MCP servers for external APIs and services.',
		prompt: `You have the MCP Builder skill enabled.

When building or reviewing MCP servers:
- Design clear tools with narrow inputs, explicit schemas, helpful descriptions, and predictable outputs.
- Handle authentication, secrets, pagination, rate limits, retries, timeouts, and API errors carefully.
- Avoid leaking secrets or unnecessary user data.
- Prefer minimal, well-documented tools over broad unsafe tools.
- Include practical testing guidance and example calls when useful.`,
	},
	{
		id: 'webapp-testing',
		name: 'Web App Testing',
		category: 'development',
		description: 'Use Playwright-style thinking for local web app UI verification and debugging.',
		prompt: `You have the Web App Testing skill enabled.

When testing local web applications:
- Think like a Playwright-based UI tester.
- Verify the actual user flow, not only implementation details.
- Check visible UI, navigation, forms, loading states, errors, responsiveness, and console/runtime issues when relevant.
- Prefer reproducible steps and focused assertions.
- When debugging, isolate whether the issue is routing, state, network, styling, build tooling, or browser behavior.`,
	},
	{
		id: 'security-reviewer',
		name: 'Security Reviewer',
		category: 'development',
		description: 'Review code for vulnerabilities, unsafe defaults, secrets, auth issues, injection risks, and risky dependencies.',
		prompt: `You have the Security Reviewer skill enabled.

When reviewing or changing code:
- Look for command injection, path traversal, unsafe deserialization, SSRF, XSS, CSRF, auth bypasses, insecure storage, secret leakage, and dependency risk.
- Prefer safe APIs, explicit validation, least privilege, and conservative defaults.
- Do not add network calls, telemetry, shell execution, or secret handling unless necessary and clearly justified.
- Explain security impact and practical fixes without exaggeration.`,
	},
	{
		id: 'privacy-auditor',
		name: 'Privacy Auditor',
		category: 'development',
		description: 'Check telemetry, tracking, network calls, identifiers, logs, OAuth, update checks, and data retention behavior.',
		prompt: `You have the Privacy Auditor skill enabled.

When reviewing or changing code:
- Look for telemetry, tracking, analytics, diagnostics, crash uploaders, update checks, external URLs, cloud calls, identifiers, OAuth flows, logs, caches, and retention behavior.
- Prefer local-first behavior, explicit user consent, minimal data collection, and clear disclosure.
- Do not introduce silent background network activity.
- Call out privacy risk clearly and separate blockers from low-priority residue.`,
	},
	{
		id: 'test-writer',
		name: 'Test Writer',
		category: 'development',
		description: 'Design useful unit, integration, regression, and UI tests.',
		prompt: `You have the Test Writer skill enabled.

When adding or reviewing tests:
- Prefer tests that protect real user behavior and previously broken flows.
- Include regression coverage for edge cases, error paths, and important invariants.
- Keep tests readable, deterministic, and maintainable.
- Avoid brittle over-testing of implementation details unless necessary.`,
	},
	{
		id: 'documentation-writer',
		name: 'Documentation Writer',
		category: 'development',
		description: 'Write clear README, setup, API, changelog, release, and handoff documentation.',
		prompt: `You have the Documentation Writer skill enabled.

When writing documentation:
- Be clear, practical, and concise.
- Include setup steps, expected outcomes, troubleshooting, examples, and limitations when useful.
- Prefer user-facing language over internal jargon.
- Keep docs honest; do not claim features, guarantees, or compatibility that are not supported by the code.`,
	},
	{
		id: 'skill-creator',
		name: 'Skill Creator',
		category: 'create',
		description: 'Guide users through creating a new custom skill with focused Q&A.',
		prompt: `You have the Skill Creator skill enabled.

When the user wants to create a new skill:
- Ask focused questions about purpose, target tasks, behaviors to encourage, behaviors to avoid, and examples.
- Convert the answers into a clear skill name, description, and prompt module.
- Keep the skill focused. Recommend one primary behavior rather than a large bundle of unrelated behaviors.
- Warn when a skill may conflict with existing skills.`,
	},
];

export const isEtheranaSkillId = (value: string): value is EtheranaSkillId => {
	return (etheranaSkillIds as readonly string[]).includes(value);
};

export const getEtheranaSkillPrompt = (enabledSkills: readonly EtheranaSkillId[] | undefined): string | undefined => {
	if (!enabledSkills?.length) return undefined;

	const activeSkills = builtinEtheranaSkills.filter(skill => enabledSkills.includes(skill.id));
	if (!activeSkills.length) return undefined;

	return [
		`Etherana Coder optional skills are enabled.`,
		`Recommendation: one skill at a time usually gives the best results. If multiple skills are enabled, resolve conflicts by prioritizing the user's latest explicit request.`,
		...activeSkills.map(skill => `<etherana_skill id="${skill.id}" name="${skill.name}">
${skill.prompt}
</etherana_skill>`),
	].join('\n\n');
};
