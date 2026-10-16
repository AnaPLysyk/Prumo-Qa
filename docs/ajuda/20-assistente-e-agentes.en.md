# Assistant, agents and knowledge

I wanted an assistant that answers with the data on this computer, learns only what you approve and never gains new permissions by chatting.

## Home and chat

Home and the chat (floating or side panel) use the same orchestrator and the eight specializations of the Agents screen. A conversation keeps up to six turns per project and disappears when the window closes. In **Automatic agent** you pick another agent if the route is wrong.

Without an external AI, the assistant queries the data, shows the sources and suggests next steps, with no network. A chat answer never becomes a test that ran.

## Claude Code and Codex in the chat

They are optional and only answer if you authorize them in **Settings**. The chat calls the program installed here, only to ask for an answer: no tools, no MCP and no hooks. The answer says where it came from. Without authorization or the program, the chat answers with local data and says so.

MCP is the other direction: Claude and Codex calling Prumo.

## Profile and knowledge

In the first conversation Prumo asks how to address you and what your role is. Profile and knowledge live in conhecimento.db, in the Prumo data folder. From the chat only the service record (agent, mode and sources) is kept, never questions or answers.

Every learning that comes from a conversation or an AI is born as a draft. You approve or discard it in the chat or in the agent's **Brain**. **Helpful** and **Not helpful** record your rating.

## Agents

The screen shows the **Prumo Orchestrator**, the Codex and Claude Code clients connected over MCP and the eight specializations. Each agent has:

- **Configuration**: turns the specialization on or off and defines what the AI may request. The block is enforced by the MCP server on every call.
- **Skills**: instruction snippets. Only approved ones go to Claude Code or Codex, chosen by the question (up to 8 KB). Importing a Skill folder accepts only open licenses; each snippet comes in as a draft and no script from the folder runs.
- **Brain**: everything the agent consults, grouped by color. **Test a question** shows which agent would answer and why, without calling an AI and without saving anything.

**New preview** creates a custom agent only as a local preview (up to 50 per project); it creates no specialization or process.

## Activity panel

In **Agents › Activity panel**, a canvas shows MCP clients, the Orchestrator, the worker, tools and operations. Every line comes from a stored record; nothing is inferred. A start without an end does not prove the process is still running.

Drag to move; Ctrl + wheel or pinch to zoom; on the keyboard, arrows, `+`, `-` and `0`. **Live** refreshes every 3 seconds while the tab is visible.

## Orchestration

When a question touches two or more specialties and you did not pick an agent, the orchestrator asks each one and combines the answers. In **Orchestrations**, in the panel, you see who took part, the order, the time and what failed. Questions and answers are not stored.

## Through MCP

The MCP server offers the specializations' prompts and the propor_aprendizado tool, which only creates drafts, with an hourly limit. Approved knowledge only goes to the external AI with the project's sharing permission. Documents and knowledge are data, never orders.

## Limits

Claude and Codex depend on your account, the installed program and your authorization. The local assistant does not interpret requirements like an AI: it looks up and shows what is recorded.
