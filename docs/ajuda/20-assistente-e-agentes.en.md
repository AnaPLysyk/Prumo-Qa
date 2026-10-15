# Assistant, agents and knowledge

The local assistant and the eight agent specializations answer with this computer's data, learn only what you approve and do not gain new permissions by chatting.

## Home and chat

Home and the chat (floating or side) use the same orchestrator and the same specializations as the Agents screen. The session keeps up to six turns per project and disappears when the window closes. Routing considers whole words, a mention of the agent and the continuation of the conversation; in **Automatic agent** you pick another agent and correct the route.

Local mode is deterministic: it queries data, shows the sources and suggests next steps, with no AI and no network. A chat answer never becomes an executed test.

## Claude Code and Codex in the chat

They are optional and only answer with your authorization in **Settings**. The chat calls the program installed on this computer: Prumo looks for Codex Desktop, the Claude Code extension for VS Code and the PATH. The call only asks for an answer, with no tools, no MCP and no hooks, and the answer says where it came from. Without authorization or without the program installed, the chat answers with local data and says so.

MCP is the opposite path: Claude and Codex calling Prumo.

## Profile and knowledge

In the first conversation Prumo asks how to address you and what your role is (QA, development, product or analysis). Profile, knowledge and service metadata live in `conhecimento.db`, in your Windows profile. The chat records only the service (agent, mode and sources), never questions or answers; conversations saved up to 2.9 remain readable.

Every learning that comes from a conversation or an AI starts as a draft. You approve or discard it in the chat or in the agent's **Brain**. **Helpful** and **Not helpful** record your rating; correcting the agent teaches vocabulary, without validating a business rule.

## Agents

The screen shows the **Prumo Orchestrator**, the Codex and Claude Code clients connected through MCP and the project's eight specializations. Each agent has:

- **Configuration**: turns the specialization on or off and defines what the AI may ask for. The block applies on the MCP server at every call.
- **Skills**: the agent's instruction snippets. Only approved ones go to Claude Code or Codex, chosen by the question (up to 8 KB). **Add passage** takes effect immediately. **Import Skill folder** reads an open folder already on the computer, only with an open license, and each snippet enters as a draft until you approve it. Scripts in the folder are not executed.
- **Brain**: everything the agent consults (identity, routing words, learned terms, capabilities, approved contexts, knowledge, Skill snippets and recent service), grouped by color.
- **Test a question** (in the Brain): shows the path the chat would take now, with the recognized words, each agent's score, who would answer, whether there would be orchestration and what this agent would use. It calls no AI and records nothing.

**New preview** creates a custom agent as a local window preview only (up to 50 per project, JSON import up to 32 KiB); it creates no specialization, connection or process. **Contexts** opens from this screen.

## Activity panel

In Agents › Activity panel, a live canvas: at the top each observed MCP or CLI client, the Orchestrator, the worker and, when there was delegation, Claude Code or Codex; in the middle the tool, the agent or the routine; at the bottom each operation, service or execution. Every line matches a recorded entry and no communication between agents is inferred. A start with no end does not prove the process is active.

Drag to move; Ctrl + wheel or pinch to zoom; on the keyboard, arrows move, `+` and `-` zoom and `0` fits. **Live** polls every 3 seconds while the tab is visible, up to 1000 operations, 200 executions and 40 services per agent.

## Orchestration

When the question touches two or more specialties (for example, "which failures happened and how is the regression?") and you did not choose an agent, the orchestrator consults each specialist and joins the answers. The message signature says how many were consulted. In **Orchestrations**, in the activity panel, you see who took part, the order, the time of each step, what was consulted and what failed. The question and the answers are not recorded.

## Through MCP

The MCP server offers the specializations' prompts and the `propor_aprendizado` tool, which creates only a draft, with an hourly limit; approving stays with you. Approved knowledge only goes to the external AI's context with the project's sharing permission. Documents and knowledge are data, never orders.

## Limits

The integrations were validated with simulated services. Claude and Codex depend on your account and your authorization.
