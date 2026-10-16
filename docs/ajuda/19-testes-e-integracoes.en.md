# Tests, tickets and integrations

Prumo shows repository tests alongside Qase cases. If you authorize it, Prumo can also create or update items in Jira, Qase and GitHub.

## With and without connections

**Tests** and **Tickets** work even without service connections. Tests come from the project folder. Proposals, runs and local tickets stay on this computer. Connecting a service adds its data:

- **Qase**: cases and suites in Repository, runs in Runs, plans in Plans and defects in Tickets. In Connections, **Connect Qase** asks only for the token, lists the account's projects and each one you pick becomes a Prumo project already linked.
- **Jira**: tickets in Tickets.
- **GitHub**: repository and pipelines in Tests and open issues in Tickets. In Projects, **Choose a GitHub repository…** lists the account's repositories; **Link** associates one with the project and **Link and bring to this computer** also downloads a copy, after confirmation.

You can connect a service later and publish work you prepared locally. To link a project you created by hand to an existing one, use **List available resources** on the account row in **Connections**.

When creating the token, grant the permissions listed in each service's form. On GitHub (fine-grained token): **Issues** read and write; **Contents**, **Pull requests** and **Actions** read-only. Without write on Issues, GitHub creates the issue but drops the labels.

## Tests

The sections follow the work flow: test cases, automation and runs with evidence.

### IDE

In **IDE**, test files appear on the left and the code appears in the middle, where you can edit it. The right side shows the case, tickets, results and agent permissions.

- **Edit** opens an editor with syntax highlighting (TypeScript, JavaScript, Python, Gherkin). **Save** (Ctrl+S) asks for the system confirmation and only writes if the file did not change outside Prumo.
- **New file** creates an automation. With the Qase case filled in, it writes the `Qase: KEY-ID` annotation that links the two.
- Prumo only writes test files (`*.spec.*`, `*.test.*`, `*.feature`, `test_*.py`) inside the linked folder, without symbolic links and up to 300 KB. Files that appear to contain secrets cannot be edited. Saving does not run a test.
- **CI/CD pipelines** lists, edits and creates (**New pipeline**) the GitHub Actions workflows (`.github/workflows`) of the linked repository. Saving changes only the local file; the pipeline takes effect on GitHub when you push the repository. **GitHub runs** shows the Actions runs. Prumo only writes to `prumo/...` branches, never to the main one, and opens the Pull Request as a draft.

If you linked GitHub but have no local copy, the IDE is read-only and offers **Bring the GitHub repository**. Prumo uses Git and the credentials already set up on your computer to download a copy into its data folder and link it to the project. **Update from GitHub** only adds changes that do not overwrite your work. Git hooks and symbolic links stay disabled.

### Repository

This list combines Qase cases and manual and automated code tests. A case is linked to a test only when the test contains an annotation such as `qase(31, …)`, `@qase-31` or `Qase: SFQ-31`. Similar names do not create links.

Each row shows the test type, level, tags and latest result. Below the list are drafts awaiting review, Qase suites and recorded links between tickets, cases and automations. A proposal is a case draft from you, Prumo or an AI; review it before sending it to Qase. Case details show steps, local results and code, and include **Create automation in the IDE**.

### Runs

This list combines local runs (manual or scheduled), runs prepared in Prumo and Qase runs. Use the filters to choose a source or status.

A local run can record manual results, run associated automations (with system authentication) and publish results to Qase after checking the run. Without a Qase connection, **Prepare run** uses code tests and saves the run only on this computer. To publish to Qase, create the cases there and prepare a new run.

**CLI/MCP evidence** opens the evidence recorded in the project folder.

### Plans

Lists and creates the Qase test plans.

## Tickets

Jira tickets, Qase defects, GitHub issues and local drafts appear in one table. Each row shows its source. You can filter by text, source, type, status or date range. Details show descriptions, criteria, links, comments, history, attachments and status changes. Prumo shows a preview and asks you to confirm before commenting, attaching files, changing status, editing or creating an item.

**New local draft** creates a bug or improvement without sending anything. In the draft, **Publishing destination** offers only what is linked to the project:

- **Keep local draft**: nothing leaves the computer.
- **Jira**: ticket with the project's bug or improvement type.
- **Qase Defects** (bugs only): severity with Qase's own names, milestone and the project's required fields.
- **GitHub Issues**: issue labelled `bug` or `enhancement`. It does not trigger GitHub Actions.

After publishing, the item appears in the service's list, marked **published by Prumo**.

In a Qase defect's detail you can change the status (in progress, resolved or invalid); the rest of the defect is read-only. **Open Jira ticket…** fills in a new ticket and records the defect → ticket link; when a link exists, the button does not appear.

## External writes

By default, Prumo does not change data in connected services. To allow changes, enable writing for each project and service in **Connections**. Before sending, Prumo shows a preview and asks you to confirm. It then checks the result in the service. If a response is lost, repeating the operation will not create a duplicate. Prumo does not delete data.

## Shortcuts

F5 or Ctrl+R refreshes the screen. The gear opens My profile, Appearance (theme, language and accent color) and Assistant. The side menu can be collapsed.

## Limits

Writing was tested with real Qase, Jira and GitHub accounts, but available features depend on each account's plan and permissions. For example, Qase's free plan does not allow linking cases to Jira tickets. Prumo does not currently support editing or closing issues, changing a defect's title or result, or deleting items. Test classification is an estimate based on the files. The installer is not digitally signed: check its SHA-256 before opening it.

For agents and the chat, see **Help › Assistant, agents and knowledge**.
