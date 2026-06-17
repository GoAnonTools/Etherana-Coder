# Etherana Coder privacy-first base

The current clean base disables editor-side telemetry defaults, 1DS transport, experimentation services, hardware-derived identifiers, marketplace identity headers, remote extension gallery access, recommendations, update checks, Settings Sync, Remote Tunnel, online feedback submission, and external vendor help links opened by default.

It also removes stale build-time privacy audit hits such as marketplace user-id headers and hardcoded vendor build-helper download references.

Etherana Coder is not a sandbox. Network activity can still happen from Git, package managers, terminal commands, extensions, configured AI providers, language tooling, debuggers, and development servers.
