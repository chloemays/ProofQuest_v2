# AI Agent Instructions for ProofQuest

This project uses the **MCP-Global** system for development, quality assurance, and memory.

## Mandatory Workflow

Before starting any work, you MUST:
1.  **Load Context**: Run `python mcp-global-rules/mcp.py autocontext`.
2.  **Check Memory**: Run `python mcp-global-rules/mcp.py recall "project state"`.
3.  **Read the Rules**: Refer to `mcp-global-rules/global_rules.md` for core principles (e.g., "Fix Properly, Never Disable").

## Trigger Commands

- **"dev"**: Run the autonomous development loop. Follow the instructions in `.agent/workflows/dev.md`.
- **"go"**: Get context and suggestions. Follow the instructions in `.agent/workflows/go.md`.

## Enforcement

Bypassing the MCP system is **FORBIDDEN**. Automated hooks will block invalid commits.
