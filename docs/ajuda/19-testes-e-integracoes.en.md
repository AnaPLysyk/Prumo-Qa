# Tests, tickets and integrations

Prumo reads your repository's tests, shows them next to the Qase cases and, with your authorization, creates and updates items in Jira, Qase and GitHub.

## With and without connections

Tests and Tickets work with no connection at all: tests come from the repository folder, and proposals, runs and tickets stay local on this computer. Each connection adds data:

- **Qase**: cases and suites in Repository, runs in Runs and plans in Plans.
- **Jira**: tickets in Tickets.
- **GitHub**: repository and pipelines in Tests. In Projects, **Choose a GitHub repository…** lists the account's repositories; **Link** associates one with the project and **Link and bring to this computer** also downloads a copy, after confirmation.

What you did locally can be published after you connect.

## Tests

Four sections, in the order of the flow: test case → automation → execution with evidence.

### IDE

Full screen, no titles. The tree of test files is on the left; the code is in the middle, with level, tag and Qase case markers; on the right are the case, the tickets, the results and the agents' permissions.

- **Edit** opens an editor with syntax highlighting (TypeScript, JavaScript, Python, Gherkin). **Save** (Ctrl+S) asks for the Windows confirmation and only writes if the file did not change outside Prumo.
- **New file** creates an automation. With the Qase case filled in, it writes the `Qase: KEY-ID` annotation that links the two.
- It only writes test files (`*.spec.*`, `*.test.*`, `*.feature`, `test_*.py`) inside the linked folder, with no symbolic links and up to 300 KB. A file that looks like a secret does not open for editing. Nothing is executed.
- **CI/CD pipelines** lists, edits and creates (**New pipeline**) the GitHub Actions workflows (`.github/workflows`) of the linked repository. Saving changes only the local file; the pipeline takes effect on GitHub when you push the repository. **GitHub runs** shows the Actions runs. Prumo only writes to `prumo/...` branches, never to the main one, and opens the Pull Request as a draft.

With only GitHub linked and no local folder, the IDE is read-only and offers **Bring the GitHub repository**. Prumo downloads a copy to `%LOCALAPPDATA%\PrumoQA\repositorios`, using the installed git and its credentials, and links it to the project. **Update from GitHub** only fast-forwards the copy, without overwriting your work. Hooks and symbolic links stay off.

### Repository

A single list with the Qase cases and the code's tests, manual and automated. A case and a test only join through an explicit annotation in the test: `qase(31, …)`, `qase.id(31)`, `@qase(31)`, `@qase-31` or `Qase: SFQ-31`. A similar name links nothing.

Each row shows the status (case with code, manual, planned automation, automated in Qase with no code, code annotating a missing case, or code with no case), the level, the tags and the latest result. Below the list are the proposals under review, the Qase suites and the declared links (ticket ↔ case ↔ automation). A proposal is a case draft, written by you, Prumo or an AI, that waits for review before going to Qase. The case detail shows steps, local results and the code, and has **Create automation in the IDE**.

### Runs

A single list with local executions (manual and scheduled, with evidence and the Jira comment), runs prepared in Prumo and Qase runs, with filters by origin and status.

A local run records manual results, runs the associated automations (each asks for Windows authentication) and publishes to Qase, checking the run. Without Qase, **Prepare run** uses the code's tests: the run stays only on this computer and cannot be created in Qase, because those cases do not exist there. To publish, create the cases in Qase and prepare another run.

**CLI/MCP evidence** opens the evidence recorded in the project folder.

### Plans

Lists and creates the Qase test plans.

## Tickets

Jira tickets, Qase defects and local tickets share one table, with the origin on each row and filters by text, origin, type, status and period. The detail shows description, criteria, relations, comments, history, attachments and transitions. Commenting, attaching, changing status, editing and creating ask for confirmation with a preview.

In **Local (Prumo)** you create and review bugs and improvements without sending anything to a service, classify the failure, link it to an existing ticket or publish to Jira after review.

Qase defects are read-only. **Open Jira ticket…** fills in a new ticket and records the defect → ticket link; when a link exists, the button does not appear.

## External writes

Off by default; enable per project and service in Connections. Each operation shows a preview, asks for the Windows confirmation, uses a key that prevents duplicates and checks the result by re-reading the service. If the response is lost, repeating does not create another item. Prumo deletes nothing.

## Shortcuts

F5 or Ctrl+R refreshes the screen. The gear opens My profile, Appearance (theme, language and accent color) and Assistant. The side menu can be collapsed.

## Limits

Writes were validated against simulated services; real Jira, Qase and GitHub accounts have not been exercised yet. Test classification is an inference. The installer is not signed: check the SHA-256 before running it.

For agents and the chat, see [Assistant, agents and knowledge](20-assistente-e-agentes.md).
