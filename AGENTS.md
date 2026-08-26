<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Git Rules
- **CANONICAL REPOSITORY:** `https://github.com/Sacredconnection/Wholesale.git`.
- In this workspace, the canonical repository is configured as the `sacredconnection` remote. Do not assume that `origin` is the deployment repository.
- Production deployments are triggered by pushes to the `main` branch of `Sacredconnection/Wholesale` through Vercel.
- Before any push, verify both the destination remote URL and target branch. Push release changes to `sacredconnection/main` unless the user explicitly requests another destination.
- **DO NOT** perform Git commits (`git commit`) automatically.
- **ALWAYS** ask for the user's explicit permission before committing any changes.

