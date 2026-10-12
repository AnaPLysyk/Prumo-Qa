# Assistant, agents and knowledge (2.10)

Prumo has a local assistant and eight agent specializations. They answer with the data on this computer, learn only what you approve and never gain new permissions by chatting.

## Home and chat

Home and the floating (or side) chat use the same orchestrator and the same specializations as the Agents screen. The session keeps up to six turns, separated by project, and disappears when the window closes. Routing considers whole words, an explicit mention of the agent and the follow-up of the conversation; in **Automatic agent** you can pick another agent and correct the choice.

Local mode is deterministic: it queries data, shows the sources and suggests next steps, with no AI model and no network. Claude and Codex are optional providers: they only answer with your authorization in the product, and the answer says where it came from. A chat answer never becomes an executed test.

## Profile and knowledge

In the first conversation Prumo asks what to call you and your role (QA, development, product or analysis). It is not a remote account login. Profile, knowledge and attendance metadata stay in the local file `conhecimento.db`, in your Windows profile.

The chat does not store questions or answers: only the attendance is kept (agent, mode and sources). Conversations stored up to 2.9 remain readable.

Every learning that comes from a conversation or from an AI starts as a **draft**. You approve or discard it in the chat or in the agent's **Brain**. Helpful/not helpful records your feedback; correcting the chosen agent teaches vocabulary, without validating a business rule on its own.

## Agents

The Agents screen shows the **Prumo Orchestrator**, the Codex and Claude Code clients connected through MCP and the project's eight specializations, each with its own portrait. For each agent:

- **Configuration** turns the specialization on or off and defines what the AI may request. The block applies in the MCP server on every call.
- **Brain** shows the skill, the capabilities, the reasons behind the policies and the approved or draft knowledge.

**New preview** creates a custom agent only as a local preview in the window (up to 50 per project, JSON import up to 32 KiB). It does not create a specialization, connection or process in the core. **Contexts** opens from this screen.

## Activity panel

Agents › Activity panel is a live canvas: at the top, one window per observed MCP or CLI client, the Orchestrator, the worker and, when there was delegation, Claude Code or Codex; in the middle, the tool, the agent or the routine; at the bottom, each operation, attendance or run. **Every line matches a stored record**; no communication between agents is inferred. A start without an end does not prove that a process is running.

Drag to move, Ctrl + wheel or pinch to zoom; on the keyboard, arrows move, `+` and `-` zoom and `0` fits. **Live** queries every 3 seconds while the tab is visible. Each query brings up to 1000 operations, 200 runs and 40 attendances per agent.

## Through MCP

Prumo's MCP server offers prompts for the specializations and the `propor_aprendizado` tool, which only creates a draft, with an hourly limit; approving is still up to you. Approved knowledge only goes to the external AI context with the project's sharing permission. Documents and knowledge are data, never orders.

## Limits

The agent portraits are images with visual motion, without a 3D face. Claude and Codex depend on your account and your authorization. The integrations were validated with simulated services.
