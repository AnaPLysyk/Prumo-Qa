# Tests, tickets and integrations (2.13)

Prumo reads your repository's tests, shows them next to the Qase cases and, when you allow it, creates and updates items in Jira, Qase and GitHub. Everything happens through your own actions, one at a time.

## Tests

Tests has four sections, in the order of the flow: test case → automation → execution with evidence.

**IDE** uses the whole screen, without titles, like a code editor. On the left, the tree of the linked folder's test files; in the middle, the code with line numbers and markers per test (level, tags, Qase case); on the right, the case, the tickets, the results and the agents' real permissions on this code. **Edit** opens the file in an editor with syntax highlighting (TypeScript, JavaScript, Python, Gherkin); **Save** (or Ctrl+S) asks for the native Windows confirmation and only writes if the file did not change outside Prumo. **New file** creates an automation and, if you enter the Qase case, writes the `Qase: KEY-ID` annotation in the file, which links the automation to the case. Prumo only writes test files (`*.spec.*`, `*.test.*`, `*.feature`, `test_*.py`) inside the linked folder, without symbolic links and up to 300 KB; a file with what looks like a secret is not opened for editing. Nothing is executed. The **CI/CD pipelines** mode lists the GitHub Actions workflows (`.github/workflows`) of the **same repository** linked to the project, with name, events and jobs, and lets you edit them and create new ones (**New pipeline**). Saving only changes the file on this computer: the pipeline takes effect on GitHub after you push the repository. **GitHub runs** shows the GitHub Actions runs; Prumo only writes to `prumo/...` branches, never to the main one, and opens the Pull Request as a draft.

If the project only has the **GitHub** repository linked (no local folder), the IDE shows the code read-only and offers **Bring the GitHub repository**: Prumo downloads a copy to `%LOCALAPPDATA%\PrumoQAepositorios`, using the git installed on this computer and its credentials (Prumo does not hand your credential to git), and links the folder to the project. Afterwards, **Update from GitHub** only fast-forwards the copy, without overwriting your changes. Hooks and symbolic links stay off and nothing is executed.

**Repository** joins, in a single list, the Qase cases (when linked) and the code's tests, manual and automated. A case and a test only go together through an explicit annotation in the test itself: `qase(31, …)`, `qase.id(31)`, `@qase(31)`, `@qase-31` or `Qase: SFQ-31`. A similar name links nothing. Each row shows the situation (case with code, manual, planned automation, automated in Qase with no code found, code that annotates a missing case, or code without a case), the level, the tags and the last result in Prumo. Below the list are the **proposals under review** (case drafts made by you, by Prumo or by a connected AI, which wait for your review before going to Qase), the Qase **suites** and the **declared links** (ticket ↔ case ↔ automation). The case detail shows steps, local results and the code that implements it, and has the **Create automation in the IDE** button. Without Qase linked, the repository shows what exists in the folder's code.

**Runs** is a single list of everything that runs or has run: local executions (manual and scheduled, with evidence and the Jira comment), runs prepared in Prumo and Qase runs. Filter by origin and by status (in progress, completed, failed). A local run records manual results, runs the associated automations (each one asks for your Windows authentication) and publishes to Qase, checking the run. **CLI/MCP evidence** opens the validation evidence saved in the project folder.

**Plans** lists and creates the Qase test plans, when linked.

## With and without connections

Tests and Tickets work **with no connection at all**: tests come from the repository folder, and proposals, runs and tickets stay local on this computer. Connecting enriches the screens: **Qase** brings cases and suites to **Repository**, runs to **Runs** and plans to **Plans**; **Jira** brings tickets to **Tickets**; **GitHub** brings the repository and the pipelines. After connecting, what you already did locally can be published.

Without Qase, **Prepare run** uses the tests from the linked folder's code. That run stays only on this computer and accepts manual results. Prumo does not let you create it in Qase, because those cases do not exist there: create the cases in Qase and prepare another run to publish.

In **Projects**, **Choose a GitHub repository…** lists the repositories of the connected GitHub account. **Link** only associates the repository with the project; **Link and bring to this computer** also downloads a copy, after your confirmation.

## Tickets

Jira tickets and Qase defects are in a single table, with the source on each row and filters by text, source, type, status and period. The ticket detail shows description, criteria, relations, comments, history, attachments and transitions. Commenting, attaching, changing status, editing and creating a ticket ask for confirmation with a preview.

Qase defects are read-only. On a defect, **Open Jira ticket…** fills in a new ticket and records the defect → ticket link; when a link already exists, the button is not shown.

## External writes

Off by default. In Connections, enable per project and service. Each operation shows a preview, asks for Windows confirmation, uses a key that prevents duplicates and verifies the result by reading the service again. If a response is lost, repeating the operation does not create another item. Prumo deletes nothing.

## Agents

In Agents, choose the project's specializations and what the AI may ask for. Blocking is enforced on every MCP call. The AI only proposes drafts; it does not create approvals, write to external services or access credentials.

## Home

The home panel summarizes what is happening in the project and answers questions with this computer's data. See [Assistant, agents and knowledge](20-assistente-e-agentes.en.md).

## Shortcuts and settings

F5 or Ctrl+R refreshes the screen with the latest data. The gear button opens theme, language and accent color. The side menu can be collapsed.

## Limits

Writes were validated against simulated services; real Jira, Qase and GitHub accounts have not been exercised yet. Test classification is an inference. The installer is not signed: check the SHA-256 before running it.
