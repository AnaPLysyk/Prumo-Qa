# Assistant, agents and knowledge

The assistant uses data on this computer. It saves only learning you approve and does not gain permissions during a conversation.

## Home and chat

Home and chat (floating or in the side panel) use the same agents. A conversation keeps up to six exchanges per project and is deleted when the window closes. In **Automatic agent**, you can choose a different agent if the selected one is not suitable.

Without an external AI, the assistant searches local data, shows its sources and suggests next steps. It does not access the internet. A chat answer does not mean a test was run.

## Claude Code and Codex in the chat

Claude Code and Codex are optional. The chat uses them only if you authorize them in **Settings** and the program is installed. It asks for an answer without tools, MCP or hooks. The answer identifies its source. Without authorization or the program, chat uses local data and tells you.

MCP is the other direction: Claude and Codex calling Prumo.

## Profile and knowledge

In your first conversation, Prumo asks how to address you and what your role is. Your profile and saved learning are stored in `conhecimento.db` in the Prumo data folder. Chat history stores only the agent, mode and sources — not questions or answers.

Any learning suggested by a conversation or AI starts as a draft. You can approve or discard it in chat or in the agent's **Brain**. **Helpful** and **Not helpful** record your rating.

## Agents

The screen shows the **Prumo Orchestrator**, the Codex and Claude Code clients connected over MCP and the eight specializations. Each agent has:

- **Configuration**: turns the specialization on or off and defines what the AI may request. The block is enforced by the MCP server on every call.
- **Skills**: short instructions for agents. Only approved Skills are sent to Claude Code or Codex, selected based on the question (up to 8 KB). When importing a Skill folder, Prumo accepts only open licenses. Each snippet starts as a draft and no script is run.
- **Brain**: everything the agent consults, grouped by color. **Test a question** shows which agent would answer and why, without calling an AI and without saving anything.

**New preview** creates an agent of yours, with name, goal and instructions (up to 50 per project). Only you see, edit and delete it. If you check **Public to the other accounts**, the other people on this computer also see it, read only; Administration does not see your private agents. It is a preview: it does not start a process or change the core policies. Prumo's fixed agents are still managed by Administration.

## Activity panel

In **Agents › Activity panel**, a diagram shows MCP clients, the Orchestrator, worker, tools and operations. Each item comes from a stored record; Prumo does not guess what happened. A start record without an end record does not prove that the process is still running.

Drag the diagram to move it. Use Ctrl + mouse wheel or pinch to zoom; on the keyboard, use the arrow keys, `+`, `-` and `0`. **Live** refreshes every 3 seconds while the tab is visible.

## Orchestration

If a question involves two or more specialties and you did not choose an agent, the Orchestrator asks each one and combines their answers. In **Orchestrations**, you can see which agents took part, their order, how long they took and any failures. Questions and answers are not stored.

## Through MCP

The MCP server offers instructions for each specialty and the `propor_aprendizado` tool. It can only create drafts and has an hourly limit. Approved learning is sent to an external AI only if sharing is enabled for the project. Documents and learning are content, not commands.

## Limits

Claude and Codex depend on your account, the installed program and your authorization. The local assistant does not interpret requirements like an AI; it searches and shows recorded information.
