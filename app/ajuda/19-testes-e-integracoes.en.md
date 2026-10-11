# Tests, tickets and integrations (2.9)

Prumo reads your repository's tests, helps refine them and, when you allow it, creates and updates items in Jira, Qase and GitHub. Everything happens through your own actions, one at a time.

## Tests

Tests has four sections.

**Catalog** reads the test files in the folder linked to the project (Playwright, Cypress, Jest/Vitest, Gherkin `.feature` and `test_*.py`), groups them by feature and shows scenarios and steps. Each test gets a type: unit, integration, functional, regression, smoke, performance or accessibility. The classification is inferred from tags (`@smoke`, `@regression`), path and content; hover the type to see the reason and the confidence. Nothing is executed: this is a reading of the repository. Without a linked folder, the catalog asks you to link one.

**Cases and proposals** appears when Qase is linked. Drafts made by you, by Prumo or by a connected AI stay here until you review (duplicates, requirement, risk and coverage) and publish. Nothing goes to Qase without your confirmation.

**Plans and executions** builds the execution from the chosen cases, runs the linked automations (each asks for your Windows authentication), records the results and publishes to Qase, verifying the run. Feature is the plan, scenario is the case and execution is the report.

**Automation** shows the folder's contract and GitHub Actions runs. Prumo only writes to `prumo/...` branches, never the default one, and opens the Pull Request as a draft.

## Tickets

Search Jira by text, type, status and date. The detail shows description, acceptance criteria, history, attachments and transitions. Commenting, attaching a file, changing status and creating a ticket ask for confirmation with a preview.

## External writes

Off by default. In Connections, enable per project and service. Each operation shows a preview, asks for Windows confirmation, uses a key that prevents duplicates and verifies the result by reading the service again. If a response is lost, repeating the operation does not create another item. Prumo deletes nothing.

## Agents

In Agents, choose the project's specializations and what the AI may ask for. Blocking is enforced on every MCP call. The AI only proposes drafts; it does not create approvals, write to external services or access credentials.

## Home

The home panel summarizes what is happening in the project and answers questions with this computer's data (approved contexts, proposals, executions and schedule). It uses no AI model and no network.

## Shortcuts and settings

F5 or Ctrl+R refreshes the screen with the latest data. The gear button opens theme, language and accent color. The side menu can be collapsed.

## Limits

Writes were validated against simulated services; real Jira, Qase and GitHub accounts have not been exercised yet. Test classification is an inference. The installer is not signed: check the SHA-256 before running it.
