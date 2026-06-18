# Etherana Coder 0.1.0

Etherana Coder is a privacy-first VS Code fork focused on local-first AI coding workflows, user control, and reduced background network behavior.

## Highlights

- Privacy-first VS Code-based editor experience.
- Etherana Settings with privacy, model, provider, skills, deployment, MCP, project memory, and general settings.
- Built-in model-agnostic Skills MVP.
- Active skills indicator in chat.
- Custom system prompt support.
- Deployment partner tab with user-clicked partner links.
- Extensions privacy warning.
- Accounts/profile Activity Bar entry point hidden for a cleaner privacy-first experience.
- Core privacy cleanup for telemetry, update polling, crash reporting, and external service behavior.

## Built-in Skills

Etherana Coder includes built-in optional skills:

- Frontend Design
- Web Artifacts Builder
- MCP Builder
- Web App Testing
- Security Reviewer
- Privacy Auditor
- Test Writer
- Documentation Writer
- Skill Creator

Skills are optional, model-agnostic, and disabled by default.

## Deployment tab

The Deployment tab includes partner links for:

- Railway
- VPS.org

Etherana Coder does not contact deployment partners automatically. Partner links open only when clicked.

## Privacy defaults

- No account required for the editor shell.
- No automatic update polling.
- No silent deployment partner calls.
- Built-in skills are disabled by default.
- Extensions are clearly marked as third-party code.
- Users choose their own model/provider configuration.

## Known limitations

- First release candidate quality.
- Builds may be unsigned.
- Windows SmartScreen or macOS Gatekeeper warnings may appear for unsigned builds.
- No automatic updater in v0.1.0.
- Custom skills are not installable through the UI yet; Skill Creator helps draft reusable skill prompts/specs.

## Source

Source code:
https://github.com/GoAnonTools/Etherana-Coder
