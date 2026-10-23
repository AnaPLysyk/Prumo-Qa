# Tests, tickets and integrations

## Manual execution in runs

Open a run and click a case or **Start manual tests**. Prumo records the start using the current session and displays the profile photo or initials. This tracking stays on this computer and does not assign the case in Qase. Reopening preserves the original person and start time. Starting does not record a passed result or execute automation.

Read the steps and select **Passed**, **Failed**, **Blocked**, **Skipped**, or **Invalid**. Failed, blocked and invalid results require an observation. Saving advances to the next pending manual case; this option can be disabled for local runs. Filters distinguish untested cases, work in progress and recorded results. Automation results remain protected from manual replacement.

Run preparation includes manual cases from the local repository. Local run titles and environments can be changed with **Edit run**. On the Qase page, **Automations for this run** opens the local record linked to the same remote run, where declared automations can be executed and their results published with confirmation. Prumo loads all result pages before displaying pending cases. External publications and attachments still require the project's permissions and confirmations.

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

In **IDE**, the left side shows the repository with all folders and files; the middle has the tabbed editor; the bottom has Problems, Output and Tests. To ask for help or have the Orchestrator act in the IDE ("open app.ts", "create file src/new.ts"), use the floating robot.

- The editor is **Monaco**, the same one as VS Code: highlighting for dozens of languages, code suggestions, underlined syntax errors, minimap, code folding, multiple cursors, find and replace (Ctrl+F and Ctrl+H), format document (Shift+Alt+F), rename (F2), the editor command palette (F1) and sticky scroll. Word wrap, minimap and font size are saved on this computer.
- **Right-click** (or the Menu key) on a folder or file opens actions: create a file or folder there, see the file tests and Git changes, copy the path and ask the Orchestrator for help.
- **Ctrl+P** opens a file by name and **Ctrl+Shift+P** shows the IDE commands.
- **Terminal** (tab in the bottom panel or **Ctrl+`**), with a local folder only: type a command and press Enter. **Each command asks for your confirmation** in a system dialog showing the folder and the exact text, and runs in the project folder, one at a time, without keyboard input. Ctrl+C stops the running command. The command has your Windows account permissions: check it before running. With the floating robot, "run npm test in the terminal" opens the terminal and asks for the same confirmation. **Save** (Ctrl+S) asks for the system confirmation and only writes if the file did not change outside Prumo.
- **New file** creates an automation. With the Qase case filled in, it writes the `Qase: KEY-ID` annotation that links the two.
- Prumo only writes test files (`*.spec.*`, `*.test.*`, `*.feature`, `test_*.py`) inside the linked folder, without symbolic links and up to 300 KB. Files that appear to contain secrets cannot be edited. Saving does not run a test.
- **CI/CD pipelines** lists, edits and creates (**New pipeline**) the GitHub Actions workflows (`.github/workflows`) of the linked repository. Saving changes only the local file; the pipeline takes effect on GitHub when you push the repository. **GitHub runs** shows the Actions runs. Prumo only writes to `prumo/...` branches, never to the main one, and opens the Pull Request as a draft.

If you linked GitHub but have no local copy, the IDE is read-only and offers **Bring the GitHub repository**. Prumo uses Git and the credentials already set up on your computer to download a copy into its data folder and link it to the project. **Update from GitHub** only adds changes that do not overwrite your work. Git hooks and symbolic links stay disabled.

### Repository

This list combines Qase cases and manual and automated code tests. A case is linked to a test only when the test contains an annotation such as `qase(31, …)`, `@qase-31` or `Qase: SFQ-31`. Similar names do not create links.

Each row shows the test type, level, tags and latest result. Below the list are drafts awaiting review, Qase suites and recorded links between tickets, cases and automations. A proposal is a case draft from you, Prumo or an AI; review it before sending it to Qase. Case details show steps, local results and code, and include **Create automation in the IDE**.

In the Repository, Qase and Prumo suites appear together in the tree on the left: each suite's arrow shows its cases, and **⊞** and **⊟** expand or collapse everything. With no search or suite chosen, the list on the right also shows the suites collapsed, and each one opens to its cases. Each suite's **⋯** menu lets you create a scenario or suite inside it, edit and remove. Qase suite: **Edit suite** changes title and description (the **Edit suite in Qase** operation, with writing enabled and Windows confirmation); removing only applies to Prumo suites, and their child suites and scenarios move up to the parent suite, with nothing deleted along with it. Each case's **⋯** opens, edits, publishes to Qase or removes. In the local Repository, **Export cases** saves a versioned JSON with the project's cases, steps, tags, requirements, risks and suites. **Import cases** opens a JSON file, validates its format, creates copies with new IDs and asks for native confirmation before writing; existing cases are not overwritten. Before choosing the file you pick the destination: **Prumo only** (needs Manual/Prumo on) or **In Prumo and publish to Qase** (also needs Qase integrated with writing enabled); in that case, right after importing, the publishing dialog opens with only the cases that came in, and Qase still asks for confirmation. Agents can consult the Repository and propose QA cases as drafts, always for human review.

The Repository supports up to **1,000 scenarios per project**. When creating plans, case selection uses search and pages of 100 cases; checked cases remain selected when you change pages or search.

### Runs

This list combines local runs (manual or scheduled), runs prepared in Prumo and Qase runs. **Advanced filters** search by title or ID and filter by source, status/result, environment and date range. When a space is selected, filters are limited to it and apply to the loaded results.

A local run can record manual results, run associated automations (with system authentication) and publish results to Qase after checking the run. **Prepare run** opens the case picker in the Qase layout: suites on the left (each tagged Qase, Prumo or code) and cases on the right. Select one case, several, or a **whole suite** with the suite checkbox; search filters by title or ID and the summary shows how many cases and suites go into the run. Without a Qase connection, it uses Prumo scenarios and code tests and saves the run only on this computer. To publish to Qase, create the run in Qase after preparing it.

A run prepared in Prumo opens as a page, like a Qase run: title, state and composition (how many cases, from how many suites, how many manual and how many automated) on top; the actions **Start manual tests**, **Run cases**, **Run automations**, **Export** and the **⋯** menu (**Edit title and environment**, **Create run in Qase**, **Publish results to Qase**, **Delete run**); search and **Add filter** by status; and the cases grouped by suite, with each suite's result bar, who executed it and a **⋯** menu per case. On the right are the completion donut and the details. Selecting several cases (or a whole suite) lets **Mark result** apply one result to all of them at once, and **Remove from run** takes them out. Clicking a case opens the side panel with **Execution**, **Send result** and **Evidence**, where you pass, fail, block, skip or invalidate the case with a comment, and see or attach evidence. **Run cases** adds or removes cases while the run does not exist in Qase yet; once it is created there, the case list is fixed (prepare another run for other cases), and removing a case that already has a result asks for confirmation. **Delete run** removes only the local record after confirmation and never deletes the Qase run.

**CLI/MCP evidence** opens the evidence recorded in the project folder.

On the Qase run page, content uses the screen's normal scrolling instead of internal scrollbars. **Esc** closes the panel and returns focus to the list. The selected count and **Submit result** appear when cases are selected; the **ⓘ** icon beside the actions explains when writing is disabled.

### Plans

Lists and creates the Qase test plans.

## Tickets

Jira tickets, Qase defects, GitHub issues and local drafts appear in one table. Each row shows its source. To search by text, press Enter or click the magnifier. Source, type, status and period filter as soon as they change. Status (Open, In progress or Done) works the same for every source. Each service maps its own status: Jira uses the status category, and GitHub only queries open issues. The period goes from today back to 90 days. Details show descriptions, criteria, links, comments, history, attachments and status changes. Prumo shows a preview and asks you to confirm before commenting, attaching files, changing status, editing or creating an item.

**New ticket** follows the project's connections. With an integrated tool (linked and with writing enabled), the ticket is created there directly, with only that tool's fields and after confirmation:

- **Jira**: ticket type, summary and description.
- **Qase**: defect with summary, actual result, severity, milestone and the project's required fields.
- **GitHub**: issue with the Bug or Improvement type, which becomes the `bug` or `enhancement` label. It does not trigger GitHub Actions.

The first field is the **Destination**, with what the project has: **Draft in Prumo** (only with Manual/Prumo on; it stays on this computer) and the integrated tools. A view-only tool shows as unavailable, with a shortcut to enable it in Projects.

In **Traceability** you pick the **source failure** (a FAIL case from a local run, automated or manual, with its evidence) and add **other links**: Qase cases, Prumo scenarios, automations, run evidence, Jira tickets, Qase defects, GitHub issues and Prumo tickets. Each type lets you search the list or **type the identifier** (case, defect or issue number, Jira key, automation capability, evidence ID); a typed case, defect or Jira ticket is checked in the service before it is added. Prumo scenarios and tickets come only from the list. Links are only recorded after the ticket is created and show up in the links map. Evidence is quoted in the ticket text; attaching the file exists only in Jira.

Local drafts (created without an integration, from run failures or suggested by AI) can be published later. In the draft, **Publishing destination** offers only what is linked to the project:

- **Keep local draft**: nothing leaves the computer.
- **Jira**: ticket with the project's bug or improvement type.
- **Qase Defects** (bugs only): severity with Qase's own names, milestone and the project's required fields.
- **GitHub Issues**: issue labelled `bug` or `enhancement`. It does not trigger GitHub Actions.

After publishing, the item appears in the service's list, marked **published by Prumo**.

In a Qase defect's detail you can change the status (in progress, resolved or invalid); the rest of the defect is read-only. **Open Jira ticket…** fills in a new ticket and records the defect → ticket link; when a link exists, the button does not appear.

## External writes

By default, Prumo does not change data in connected services. To allow changes, enable writing for each project and service in **Connections**. Before sending, Prumo shows a preview and asks you to confirm. It then checks the result in the service. If a response is lost, repeating the operation will not create a duplicate. Prumo does not delete data.

## Shortcuts

F5 or Ctrl+R refreshes the screen. The gear opens Settings, with Appearance only (theme, language and accent color). Account and security live in **My account**, from the photo in the top corner. The side menu can be collapsed.

## Limits

Writing was tested with real Qase, Jira and GitHub accounts, but available features depend on each account's plan and permissions. For example, Qase's free plan does not allow linking cases to Jira tickets. Prumo does not currently support editing or closing issues, changing a defect's title or result, or deleting items. Test classification is an estimate based on the files. The installer is not digitally signed: check its SHA-256 before opening it.

For agents and the chat, see **Help › Assistant, agents and knowledge**.
