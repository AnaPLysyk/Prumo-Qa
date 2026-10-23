# Assistant, agents and knowledge

The assistant uses data on this computer. It only saves what you approve and does not gain permissions during a conversation.

## Home and chat

Home and chat (floating or in the side panel) use the same agents. A conversation keeps up to six exchanges per project and is deleted when the window closes. In **Automatic agent** you can choose a different agent if the selected one does not fit.

Without an external AI, the assistant searches local data, shows its sources and suggests next steps. It does not access the internet. A chat answer never means a test was run.

## QA and IT questions

You can ask about software quality and IT: concepts (regression, smoke, test pyramid), techniques (partitioning, boundary values, decision tables), test cases and bug reports, automation, APIs, performance, security, accessibility, CI/CD and agile.

- **With an external AI** (Claude Code, GitHub Copilot, Codex or Gemini, authorized and installed): Prumo sends the question to the first one that answers, and it acts as a quality engineer. Claude also searches the web when the topic is recent or asks for sources, and cites the links.
- **Without an external AI**: Prumo answers from its offline QA fundamentals and says so.
- **Questions about your project** (failures, runs, metrics): always answered from the data on this computer, which never leaves it.

Answers appear formatted, with lists, bold, code and tables.

## Voice in the chat

Next to **Send** there are three buttons:

- **Microphone**: you speak, click again, and the transcribed text appears in the box to review and send.
- **Headset**: voice-only conversation. You speak, Prumo transcribes it, answers in text and audio, and listens again until you end it.
- **Speaker**: turns on reading aloud and opens the **voices and characters** panel. Each message also has a listen button.

In the panel you choose, for each speaker (you, Prumo, Claude Code, Codex, Copilot, Gemini or the Table), one of the voices installed in Windows and a character: normal voice, narrator, robot, child, deep or quick. The character changes the pitch and pace of the voice. For more voices, install them in Windows Settings › Time & language › Speech.

Transcription happens on this computer, with the Whisper model. The first time, Prumo asks for your confirmation and downloads the model (about 76 MB, from huggingface.co). After that the audio does not leave the computer and is not saved to a file. Windows must allow the microphone for Prumo.

## External AIs in the chat

On Home you choose who you talk to: the **Orchestrator** (direct, with the data on this computer) or an external AI. External AIs are optional: they only appear if Administration allows them, the program is installed on the computer and you have authorized them. Each answer shows the name and color of who answered.

With a local project folder linked, the chat prepares the Prumo MCP for the chosen AI and allows queries only: context, coverage, evidence, policies and questions to the Orchestrator. Proposals, runs, file edits and shell stay blocked in the chat. In Gemini CLI, the MCP setup lasts only for the conversation and does not change Gemini's global settings. To query account data over MCP, keep Prumo open and signed in; closing Prumo or signing out revokes the session.

The connection line says whether a local folder exists to prepare the MCP, but that does not prove a real call. To know whether the AI used MCP, read the header of the answer:

- **MCP confirmed**: lists the MCP tools that completed during that question.
- **MCP not confirmed**: the AI answered, but no MCP call was observed.
- **general question · MCP not needed**: for general QA and IT questions Prumo does not send project data to the client.

Without authorization, installation or a client response, Prumo uses local data and tells you.

There are two ways to use it: **through Prumo** (the Home chat) and **through the AI's own client** (you talk in Claude Code, Codex, Copilot or Gemini and connect the Prumo MCP by following **Agents › AI and rules › Connect AI**).

## AI Table

With two or more external AIs authorized and installed, Home gets a **Table** option. The AIs talk to each other and the Prumo Orchestrator mediates:

1. **Round 1:** your question goes to all AIs at the table at once (at most 4). Each answers on its own, under the chat's limits: read-only and only the Prumo MCP queries.
2. **Round 2:** each AI that answered receives the others' answers, as data to compare and never as instructions, with secrets masked and each answer cut to about 1,500 characters. It says, in up to 3 sentences, where it agrees, where it differs and what it would check.
3. **Orchestrator summary:** Prumo builds the summary without calling another AI. It repeats each AI's answer, the agreement and the differences they pointed out and what they would check, and flags who did not take part (because of a usage limit or missing login, for example). Prumo does not compute a consensus or approve anything. If only one AI answered, the summary says there was no conversation between AIs.

The Table uses only the AIs you authorized and respects the external-AI switch in Administration. With fewer than two available, the chat tells you and answers with local data. Each round has its own deadline (2 minutes for the first, 1.5 minutes for the second), so a slow AI does not block the others. The Table uses each account's quota twice per question, once per round. The recorded interaction keeps only the TABLE mode, the agent and the sources, not the question or the answers.

## Profile and knowledge

In your first conversation, Prumo asks how to address you and what your role is. Your profile and saved learning are stored in `conhecimento.db` in the Prumo data folder. Chat history keeps only the agent used, the mode and the sources, not the questions or answers.

Any learning suggested by a conversation or an AI starts as a draft. You approve or discard it in the chat or in the agent's **Brain**. **Helpful** and **Not helpful** record your rating. To edit the profile later, use **My account › My profile**.

## Agents

The screen shows the **Prumo Orchestrator**, the AI client integrations available and the nine official specializations, including **UI and UX**. A saved setting does not prove an active MCP connection; confirm it through the diagnostics and the observed activity. Each agent has:

- **Configuration**: turns the specialization on or off and defines what the AI may request. The block is enforced by the MCP server on every call.
- **Skills**: short instructions for agents. Only approved Skills go to Claude Code or Codex, selected by the question (up to 8 KB). When importing a Skill folder, Prumo accepts only open licenses, each snippet starts as a draft and no script is run.
- **Brain**: everything the agent consults, grouped by color. **Test a question** shows which agent would answer and why, without calling an AI and without saving anything.

The **AI and rules** tab (at the top, next to **Agents** and **Activity panel**) has three parts:

- **Connect AI**: step by step to connect Claude Code, Codex, GitHub Copilot or Gemini CLI to Prumo over MCP.
- **My rules**: apply to this account only, in the chat and in connected AIs, and never grant permissions. There is one rule for all agents and one per agent.
- **Project rules**: the admin marks the **enabled specializations** and adjusts the **Agent permissions**. Regular accounts can read them but not change them. The **i** on each row explains why the permission exists. **Actions reserved for people** are kept separate and cannot be granted to agents. **Save permissions…** is only available after a change and requires the system's native confirmation; leaving without saving applies nothing.

In **Administration › Agents**, the admin can change the name, profession, specialty, personality and 3D look of the official agents, for every account on this installation. In **Agents**, each person sets **For my account** a nickname and guidance that do not change the official agent, its capabilities or its policies. These preferences are kept per account ID and do not pass to another account on the same computer. There is no sync of these profiles between computers yet.

**New personal agent** creates a profile of your own, with a name, goal and instructions (up to 50 per project). Pick a **Query tool**: Project summary, Prumo scheduled routines, local test runs, or local proposals and tickets. After saving, open the agent and click **Run local query**. Prumo queries real data from your account and names the source; if there are no records, it says so instead of inventing results. Personal instructions do not authorize commands or new tools. The schedule is the one for Prumo's own routines, **not** Google Calendar or Outlook, and the agent does not create appointments: that would need its own integration and authorization.

Only you see, edit, run and delete your personal agent. With **Public to other accounts**, other people on this computer see the profile read-only, without access to your data or the ability to run your query. These queries do not change data or core policies. The official agents stay under Administration.

## Activity panel

A diagram shows MCP clients, the Orchestrator, the worker, tools and operations. Each line comes from a stored record; Prumo does not guess what happened, and a start record without an end record does not prove the process is still running. **Orchestrations** are on the side.

Drag the diagram to move it. Zoom with Ctrl + mouse wheel or pinch; on the keyboard, use the arrow keys, `+`, `-` and `0`. **Live** refreshes every 3 seconds while the tab is visible.

## Orchestration

If a question involves two or more specialties and you did not choose an agent, the Orchestrator asks each one and combines the answers. In **Orchestrations** you see which agents took part, their order, how long they took and any failures. Questions and answers are not stored.

For a broad assessment, pick a project and ask **"run a quality diagnosis of the project"**. The Orchestrator queries Regression, Bug Investigation and Requirements (respecting specialists that are turned off), prioritizes runs with FAIL, says when runs or approved criteria are missing and suggests the next screen. It also examines the tests found in the code and the explicit links between cases, tickets and automations, points out registration gaps and suggests a next case from an approved requirement, without creating or running it.

The diagnosis reads existing records: it **does not run tests**, does not change code, does not mark problems as fixed and does not replace investigation or coverage checks. A number of tests or a recorded link **does not prove coverage**, and cases without automation may be manual on purpose. With no project selected, runs and failures from other teams do not appear.

## Where each project is linked

Every agent works with the **link map of the selected project**: the Jira project, the Qase project, the GitHub repository, the local folder and Manual/Prumo. Each shows its state (active, off or needing a check) and what Prumo may do there (read only, or propose creating, commenting and editing with your confirmation). A Prumo project follows **one** project or repository per tool, and the agent never swaps it for another. Ask the Orchestrator "where is this project linked?" to see the map.

The same map goes to the external AI you authorized and to the MCP `contexto_projeto`, and it is the base for the project's schedules and automations. With no link, the agent says it must be linked in Projects instead of inventing a destination. The map carries no token, API address or full folder path.

## Through MCP

The MCP server offers instructions for each specialty and the `propor_aprendizado` tool, which only creates drafts and has an hourly limit. Approved learning goes to an external AI only if sharing is enabled for the project. Documents and learning are content, not commands.

## Limits

Claude Code, Codex, Copilot and Gemini depend on your account, the installed client and your authorization. The local assistant does not interpret requirements like an AI: it searches and shows recorded information.
