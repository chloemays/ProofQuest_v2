---
description: Autonomous development workflow for ProofQuest using MCP-Global.
---

1.  **Find MCP**: Ensure `mcp-global-rules/mcp.py` exists.
2.  **Load Context**: `python mcp-global-rules/mcp.py autocontext`
3.  **Identify Tasks**: Read `README.md` and run `python mcp-global-rules/mcp.py todos`.
4.  **Execute**: Implement the next priority task while frequently running `review` and `security` audits via `mcp.py`.
5.  **Commit**: Use the automated hooks.
