# Tests, tickets and integrations (2.10)

Prumo reads your repository's tests, shows them next to the Qase cases and, when you allow it, creates and updates items in Jira, Qase and GitHub. Everything happens through your own actions, one at a time.

## Tests

Tests represents what exists in Qase **and** in the project's code, in tabs.

**Overview** joins Qase cases and repository tests in a single list. A case and a test only go together through an explicit annotation in the test itself: `qase(31, …)`, `qase.id(31)`, `@qase(31)`, `@qase-31` or `Qase: SFQ-31`. A similar name links nothing. Each row shows the situation (case with code, manual, planned automation, automated in Qase with no code found, code that annotates a missing case or code without a case), the level (unit, API, E2E…), the tags and the last result in Prumo. Filter by source, level, execution and tag; group by tag, feature or level.

**Code** is a read-only view of the test files: folder tree, reader with line numbers and markers per test (level, tags, Qase case) and a panel with the case, the tickets, the results and the agents' real permissions on this code. Only test files inside the linked folder, no symbolic links, up to 300 KB and with secrets masked. The classification comes from tags (`@smoke`, `@regression`), path and content, with reason and confidence. Nothing is executed.

**Qase cases**, **Suites** and **Plans** appear when Qase is linked. The case detail shows steps, local results, link to a ticket, automation declaration and the code that implements it. Drafts made by you, by Prumo or by a connected AI wait for your review (duplicates, requirement, risk and coverage) before publishing.

**Runs** gathers the runs prepared in Prumo and the Qase runs. A local run records manual results, runs the associated automations (each one asks for your Windows authentication) and publishes to Qase, checking the run.

**CI and GitHub** shows the folder's contract and GitHub Actions runs. Prumo only writes to `prumo/...` branches, never to the main one, and opens the Pull Request as a draft.

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
