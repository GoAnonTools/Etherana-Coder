# Etherana Coder 0.1.0 Privacy Summary

Etherana Coder is designed as a privacy-first VS Code fork.

## Default behavior

Etherana Coder is intended to avoid silent background behavior where possible. The first release focuses on manual user control, local-first defaults, and clear disclosure for third-party code or services.

## No automatic update polling

Etherana Coder 0.1.0 does not use automatic update polling. Updates are distributed as manual downloads.

## Deployment partner links

The Deployment tab includes partner links for Railway and VPS.org.

These links help support the free app, but Etherana Coder does not contact these partners automatically. The partner websites open only after the user clicks a button.

## Extensions

Extensions are third-party code and may contact external services. Etherana Coder shows a warning so users can make informed choices before installing extensions.

## Accounts/profile entry point

The upstream accounts/profile Activity Bar entry point is hidden to avoid suggesting that cloud login is required for the editor shell.

## Skills

Built-in skills are model-agnostic prompt modules. They are disabled by default and stored in local/global settings as enabled skill IDs.

Skill prompts are added only when a user enables a skill.

## Custom system prompt

Users can choose to use Etherana's default system prompt or provide a custom system prompt. Custom prompts and skill prompts are kept separate in the final model instructions.

## User responsibility

Users are responsible for the privacy behavior of:

- The model/provider they configure.
- Extensions they install.
- MCP servers they add.
- External websites they choose to open.
- Code or files they intentionally send to configured providers.

## Release note

This summary describes the intended behavior of Etherana Coder 0.1.0. Users and reviewers should verify behavior against the source code and release build.
