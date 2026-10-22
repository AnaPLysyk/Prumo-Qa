# Assistant, agents and knowledge

The assistant uses data on this computer. It saves only learning you approve and does not gain permissions during a conversation.

## Home and chat

Home and chat (floating or in the side panel) use the same agents. A conversation keeps up to six exchanges per project and is deleted when the window closes. In **Automatic agent**, you can choose a different agent if the selected one is not suitable.

Without an external AI, the assistant searches local data, shows its sources and suggests next steps. It does not access the internet. A chat answer does not mean a test was run.

## QA and IT questions

Ask anything about software quality and IT: concepts (regression, smoke, test pyramid), techniques (partitioning, boundary values, decision tables), writing test cases and bug reports, automation, APIs, performance, security, accessibility, CI/CD and agile. If you connected and authorized an AI (Claude Code, GitHub Copilot, Codex or Gemini), Prumo sends the question to the first one that answers, and it acts as a quality engineer; Claude also searches the web when the topic is recent or asks for sources, and cites the links. With no AI available, Prumo answers from its offline QA fundamentals and says so. Questions about your project (failures, runs, metrics) are still answered from the data on this computer, which never leaves it. Answers appear formatted, with lists, bold, code and tables.

## Voice in the chat

Next to **Send**, the chat box has three buttons. **Microphone**: you speak, click again, and the transcribed text appears in the box for you to review and send. **Headset**: voice-only conversation — you speak, Prumo transcribes it into the chat, answers in text and audio, and listens again until you end it. **Speaker**: turns on reading messages aloud and opens the **voices and characters** panel. Each message also has a listen button, to hear only that one.

In the panel you choose, for each speaker (you, Prumo, Claude Code, Codex, Copilot, Gemini or the Table), one of the voices installed in Windows and a character: normal voice, narrator, robot, child, deep or quick. Characters change the pitch and pace of the chosen voice. For more voices, install them in Windows Settings › Time & language › Speech.

Transcription happens on this computer, with the Whisper model. The first time, Prumo asks for your confirmation and downloads the model (about 76 MB, from huggingface.co); after that the audio never leaves the computer and is not saved to a file. Windows must allow the microphone for Prumo.

## External AIs in the chat

Claude Code, Codex, GitHub Copilot and Gemini CLI are optional. The chat uses one only if you authorize it in **Settings** and the program is installed. For project questions, it can provide the Prumo MCP with read-only tools. For general QA and IT questions, the project MCP is not needed and project data is not sent to the client. The answer identifies its source. Without authorization or the program, chat uses local data and tells you.

After an external answer, the header reports **MCP confirmed** with the MCP tools that completed during that question, **MCP not confirmed** when no MCP call was observed, or **general question · MCP not needed** when the question did not require project data. MCP availability alone is never proof of use.

## Profile and knowledge

In your first conversation, Prumo asks how to address you and what your role is. Your profile and saved learning are stored in `conhecimento.db` in the Prumo data folder. Chat history stores only the agent, mode and sources — not questions or answers.

Any learning suggested by a conversation or AI starts as a draft. You can approve or discard it in chat or in the agent's **Brain**. **Helpful** and **Not helpful** record your rating.

## Agents

The screen shows the **Prumo Orchestrator**, Claude Code, Codex, GitHub Copilot and Gemini CLI clients connected over MCP and the official specializations. Each agent has:

- **Configuration**: turns the specialization on or off and defines what the AI may request. The block is enforced by the MCP server on every call.
- **Skills**: short instructions for agents. Only approved Skills are sent to Claude Code or Codex, selected based on the question (up to 8 KB). When importing a Skill folder, Prumo accepts only open licenses. Each snippet starts as a draft and no script is run.
- **Brain**: everything the agent consults, grouped by color. **Test a question** shows which agent would answer and why, without calling an AI and without saving anything.

**New personal agent** creates an agent you own, with a name, goal and instructions (up to 50 per project). Select a **Local data source**: Project summary, Prumo scheduled routines, local test runs, or local proposals/tickets. Once saved, open the agent and click **Run local query**. The result comes from actual records, identifies its source, and explicitly reports when no records exist. Instructions cannot grant extra tools or permissions. Prumo's routine schedule is not Google Calendar, Outlook, or an external calendar, and these agents do not create appointments.

Only the owner can edit, run or delete a personal agent. Making its profile public lets other accounts on this computer view it, but not access the owner's data or run the query. The queries are read-only; core agents remain under Administration.

The **Agents › AI and rules** tab at the top has three parts. **Connect AI** walks you through connecting Claude Code, Codex, GitHub Copilot or Gemini CLI to Prumo over MCP (install, connect, test, use). **My rules** keeps rules for this account only: one for all agents and one per agent; they apply in the chat and in connected AIs and never grant permissions. **Project rules** holds enabled specializations, editable permissions and human-only operations. It is separate from the agent list. Admins can save shared policy changes after native confirmation; regular accounts have read-only access.

## Activity panel

In **Agents › Activity panel**, a diagram shows MCP clients, the Orchestrator, worker, tools and operations. Each item comes from a stored record; Prumo does not guess what happened. A start record without an end record does not prove that the process is still running.

Drag the diagram to move it. Use Ctrl + mouse wheel or pinch to zoom; on the keyboard, use the arrow keys, `+`, `-` and `0`. **Live** refreshes every 3 seconds while the tab is visible.

## Orchestration

If a question involves two or more specialties and you did not choose an agent, the Orchestrator asks each one and combines their answers. In **Orchestrations**, you can see which agents took part, their order, how long they took and any failures. Questions and answers are not stored.

## Where each project is linked

Every agent works with the **link map of the selected project**: the Jira project, the Qase project, the GitHub repository, the local folder and Manual/Prumo, each with its state (active, off or needing a check) and what Prumo may do there (read only, or propose creating, commenting and editing with your confirmation). Each Prumo project follows **one** project or repository per tool, and the agent never swaps it for another. Ask the Orchestrator "where is this project linked?" to see the map. The same map goes to the external AI you authorized and to the MCP `contexto_projeto`, and it underpins the project's schedules and automations. With no link, the agent says it must be linked in Projects instead of inventing a destination. The map carries no token, API address or full folder path.

## Through MCP

The MCP server offers instructions for each specialty and the `propor_aprendizado` tool. It can only create drafts and has an hourly limit. Approved learning is sent to an external AI only if sharing is enabled for the project. Documents and learning are content, not commands.

## Limits

Claude and Codex depend on your account, the installed program and your authorization. The local assistant does not interpret requirements like an AI; it searches and shows recorded information.
