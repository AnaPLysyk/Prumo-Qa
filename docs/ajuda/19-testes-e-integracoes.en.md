# Tests, tickets and integrations

Prumo shows repository tests alongside Qase cases. It creates or updates items in Jira, Qase and GitHub only if you authorize it.

## With and without connections

**Tests** and **Tickets** work without service connections. Tests come from the project folder; proposals, runs and local tickets stay on this computer. Connections (Jira, Qase, Manual/Prumo, GitHub and local folder) live in **Projects**, in the connection map, and each connected service brings its data:

- **Qase**: cases and suites in Repository, runs in Runs, plans in Plans and defects in Tickets. In Projects, **Import from Qase** has three steps (open Qase, paste the token, choose projects); each chosen project becomes a Prumo project already linked.
- **Jira**: tickets in Tickets.
- **GitHub**: repository and pipelines in Tests, open issues in Tickets. In Projects, **Choose a GitHub repository…** lists the account's repositories. **Link** associates one with the project; **Link and bring to this computer** also downloads a copy, after confirmation.

You can connect a service later and publish what you prepared locally. To link a project you created by hand to an existing one, use **List available resources** on the account row, under **Accounts and permissions**.

When creating the token, grant the permissions listed in each service's form. On GitHub (fine-grained token): **Issues** read and write; **Contents**, **Pull requests** and **Actions** read-only. Without write on Issues, GitHub creates the issue but drops the labels.

## Tests

### IDE

The left side shows the repository with folders and files; the middle has the tabbed editor; the bottom has Problems, Output and Tests. To ask for help or have the Orchestrator act in the IDE ("open app.ts", "create file src/new.ts"), use the floating robot.

- The editor is **Monaco**, the same one as VS Code: syntax highlighting, suggestions, underlined errors, minimap, code folding, multiple cursors, find and replace (Ctrl+F and Ctrl+H), format (Shift+Alt+F), rename (F2) and the editor palette (F1). Word wrap, minimap and font size are saved on this computer.
- **Right-click** (or the Menu key) on a folder or file: create a file or folder there, see the file's tests and Git changes, copy the path and ask the Orchestrator for help.
- **Ctrl+P** opens a file by name; **Ctrl+Shift+P** shows the IDE commands.
- **Terminal** (bottom tab or **Ctrl+`**), with a local folder only. Type the command and press Enter. **Each command asks for your confirmation** in a system dialog showing the folder and the exact text, and runs in the project folder, one at a time, without keyboard input. Ctrl+C stops it. The command has your Windows account permissions: check it before confirming. With the robot, "run npm test in the terminal" opens the terminal and asks for the same confirmation.
- **Save** (Ctrl+S) asks for the system confirmation and only writes if the file did not change outside Prumo. Saving does not run the test.
- **New file** creates an automation. With the Qase case filled in, it writes the `Qase: KEY-ID` annotation that links the two.
- Prumo only writes test files (`*.spec.*`, `*.test.*`, `*.feature`, `test_*.py`) inside the linked folder, without symbolic links and up to 300 KB. Files that appear to contain secrets cannot be edited.
- **CI/CD pipelines** lists, edits and creates (**New pipeline**) the GitHub Actions workflows (`.github/workflows`) of the linked repository. Saving changes only the local file; the pipeline takes effect on GitHub when you push the repository. **GitHub runs** shows the Actions runs. Prumo only writes to `prumo/...` branches, never to the main one, and opens the Pull Request as a draft.

If only GitHub is linked, the IDE reads the files and offers **Bring the GitHub repository**: Prumo uses Git and the credentials already set up on your computer to download a copy into its data folder. **Update from GitHub** only adds changes that do not overwrite your work. Git hooks and symbolic links stay disabled.

### Repository

The list combines Qase cases and manual and automated code tests. A case is linked to a test only when the test has an annotation such as `qase(31, …)`, `@qase-31` or `Qase: SFQ-31`. Similar names do not create links.

Each row shows type, level, tags and latest result. Scenarios created in Prumo have their own number (**P-1**, **P-2**…). Below are the proposals awaiting review and the Qase suites. A proposal is a draft from you, Prumo or an AI; review it before sending it to Qase. Case details show steps, local results and code, and include **Create automation in the IDE**.

**Create › New scenario** opens the editor full screen. Qase and Prumo suites appear together in the tree on the left: the arrow shows the cases, and **⊞** and **⊟** expand or collapse everything. With no search or suite chosen, the list on the right also shows the suites collapsed.

- A suite's **⋯** creates a scenario or suite inside it, edits and removes. On a Qase suite, **Edit suite** changes title and description (the **Edit suite in Qase** operation, with writing enabled and Windows confirmation). Removing only applies to Prumo suites; child suites and scenarios move up to the parent suite, and nothing is deleted with it.
- A case's **⋯** opens, edits, publishes to Qase or removes.
- **Export cases** saves a versioned JSON with the current project's cases, steps, tags, requirements, risks and suites.
- **Import cases** reads a JSON file, validates its format, creates copies with new IDs and asks for native confirmation before writing; existing cases are not overwritten. Before choosing the file you pick the destination: **Prumo only** (needs Manual/Prumo on) or **In Prumo and publish to Qase** (also needs Qase with writing enabled). In the second case the publishing dialog opens right after, with only the imported cases, and Qase still asks for confirmation.

Agents consult the Repository and propose cases as drafts, always for human review. The limit is **1,000 scenarios per project**. When creating plans, selection uses search and pages of 100 cases, and checked cases stay selected when you change pages or search.

### Runs

The list combines, in the same format as the case list, local runs (manual or scheduled), runs prepared in Prumo (**P** icon) and Qase runs (**Q** icon), each with its result bar and state. **Advanced filters** search by title or ID and filter by source, status, environment and period. With a space selected, filters are limited to it.

**Prepare run** opens the case picker in the Qase layout: suites on the left (each tagged Qase, Prumo or code) and cases on the right. Select one case, several, or a **whole suite** with the suite checkbox. Search filters by title or ID, and the summary shows how many cases and suites go into the run. Without a Qase connection, the run uses Prumo scenarios and code tests and stays only on this computer. To publish to Qase, create the run there after preparing it.

**Prumo run.** It opens as a page, like a Qase run:

- On top: title, state and composition (how many cases, from how many suites, how many manual and how many automated).
- The actions **Start manual tests**, **Run cases**, **Run automations**, **Export** and the **⋯** menu: **Edit title and environment**, **Create run in Qase**, **Publish results to Qase**, **Delete run**.
- Search and **Add filter** by status; cases grouped by suite, with each suite's result bar, who executed it and each case's **⋯**.
- On the right: the completion donut and the details.

Selecting several cases (or a whole suite) lets **Mark result** apply one result to all of them and **Remove from run** take them out. Clicking a case opens the side panel with **Execution**, **Send result** and **Evidence**: there you pass, fail, block, skip or invalidate the case with a comment, and see or attach evidence. **Run cases** adds or removes cases while the run does not exist in Qase; once it is created there, the case list is fixed (prepare another run for other cases). Removing a case that already has a result asks for confirmation. **Delete run** removes only the local record, after confirmation, and never deletes the Qase run.

**Qase run.** Click the row to open the page:

- On top: title, state and the actions **Run again** (prepares another run with the same cases), **Export** (CSV) and **⋯ › End run**.
- Below: the description and the **Cases** and **Timeline** tabs. Cases has search (by title, ID or comment), **Add filter** by status and the list grouped by suite, with result bar and duration.
- On the right: the completion rate and the details: status, who started it and when, total and elapsed time, environment, milestone and plan.
- The case panel has the tabs **Execution** (description, actual result, steps and evidence), **Send result** and **History**.
- A row's **⋯** sets **Passed**, **Failed**, **Blocked**, **Skipped** or **Invalid**. Passed and Skipped send directly; the others open the panel for the comment. With several cases selected, **Send result** applies the same status to all.
- In **Send result** you mark each step (one failed step fails the case; all passed approve it), write the comment and use **Attach file…**.

Sending uses the **Publish results to the Qase run** operation, needs writing enabled in Projects and asks for Windows confirmation. The page scrolls with the screen, with no inner scrollbars; **Esc** closes the panel and returns focus to the list; the **ⓘ** icon beside the actions explains when writing is off.

**Scenario evidence.** In a local run, **View evidence** (on the case row) shows the automation run summary, the log and the files, with image and text preview. For a scenario without automation, or to add a screenshot, video or log, use **Attach evidence…** after recording the result. The chosen files are copied to `.prumo/evidencias/runs/<run>/<case>` in the project, with secrets masked in text.

When you **Publish results**, each scenario sends Qase what it has: the run's evidence JSON, the log (stdout and stderr masked), the runner report, what the automation left in `.prumo/artefatos/<job>/` and manual attachments. The limit is 10 files of 10 MB per scenario, including passed ones, and it also applies to scheduled publishing, under the same policy. Only files from those folders are included; shortcuts, secrets (`.env`, keys) and unknown types are refused. An attachment added after publishing is not resent. In a Qase run, the case panel lists the current result's attachments and **Attach file…** sends a new file with the result.

### Plans

The table lists Qase plans (title, created, updated, run time and cases), with search, sorting by column titles and rows per page. Each plan's **⋯** has **Open**, **Start run** and **Copy ID**; **Create plan** is at the top of the list. The plan page has **Start run** (already with the cases and plan) and the **Cases** and **Runs** tabs; clicking a run opens its page.

## Tickets

Jira tickets, Qase defects, GitHub issues and local drafts appear in one table, each row with its source. To search by text, press Enter or click the magnifier. Source, type, status and period filter as soon as they change. Status (Open, In progress or Done) works the same for every source; each service maps its own status: Jira uses the status category, and only open GitHub issues are queried. The period goes from today back to 90 days. Details show description, criteria, links, comments, history, attachments and status changes. Before commenting, attaching, changing status, editing or creating an item, Prumo shows a preview and asks you to confirm.

**New ticket** follows the project's connections. The first field is the **Destination**: **Draft in Prumo** (only with Manual/Prumo on; it stays on this computer) or an integrated tool. A view-only tool shows as unavailable, with a shortcut to enable it in Projects. With the tool linked and writing enabled, the ticket is created there directly, with only that tool's fields and after confirmation:

- **Jira**: ticket type, summary and description.
- **Qase**: defect with summary, actual result, severity, milestone and the project's required fields.
- **GitHub**: issue of type Bug or Improvement, which becomes the `bug` or `enhancement` label. It does not trigger GitHub Actions.

In **Traceability** you pick the **source failure** (a FAIL case from a local run, with its evidence) and add **other links**: Qase cases, Prumo scenarios, automations, run evidence, Jira tickets, Qase defects, GitHub issues and Prumo tickets. Each type lets you search the list or **type the identifier** (case, defect or issue number, Jira key, automation capability, evidence ID). A typed case, defect or Jira ticket is checked in the service before it is added; Prumo scenarios and tickets come only from the list. Links are recorded after the ticket is created. Evidence is quoted in the ticket text; attaching the file exists only in Jira.

Local drafts (created without an integration, from run failures or suggested by AI) can be published later. **Publishing destination** offers only what is linked to the project:

- **Keep local draft**: nothing leaves the computer.
- **Jira**: ticket with the project's bug or improvement type.
- **Qase Defects** (bugs only): severity with Qase's own names, milestone and required fields.
- **GitHub Issues**: issue labelled `bug` or `enhancement`.

After publishing, the item appears in the service's list, marked **published by Prumo**. In a Qase defect you can change the status (in progress, resolved or invalid); the rest is read-only. **Open Jira ticket…** fills in a new ticket and records the defect → ticket link.

## External writes

By default, Prumo does not change data in connected services. To allow it, enable writing for each project and service in **Projects › Accounts and permissions**. Before sending, Prumo shows a preview and asks you to confirm; afterwards it checks the result in the service. If a response is lost, repeating the operation will not create a duplicate. Prumo does not delete data.

## Shortcuts

F5 or Ctrl+R refreshes the screen, and the side menu can be collapsed. The gear opens **Settings**, which only has Appearance (theme, language and accent color). Account and security are in **My account**, from the photo in the top corner.

## Limits

Writing was tested with real Qase, Jira and GitHub accounts, but features depend on each account's plan and permissions. Qase's free plan, for example, does not allow linking cases to Jira tickets. Prumo does not edit or close issues, does not change a defect's title or result and does not delete items. Test classification is an estimate based on the files. The installer is not digitally signed: check its SHA-256 before opening it.

For agents and the chat, see **Help › Assistant, agents and knowledge**.

## Manual execution in runs

In **Runs**, open the run and click a case or **Start manual tests**. Prumo records the start with the session identity and shows the profile photo (or initials). This tracking stays on this computer and does not assign the case to anyone in Qase. Reopening a started case keeps the original person and time. Starting does not record a pass or run automation.

In the case panel (**Send result** tab), read the steps and choose **Passed**, **Failed**, **Blocked**, **Skipped** or **Invalid**. Failed, blocked and invalid need a note. Saving moves to the next pending manual case; in a local run you can turn this off. Filters tell untested, in-progress and recorded cases apart. Automation results cannot be replaced manually.

Manual cases from the local repository are part of run preparation. On the Qase page, **Automations for this run** opens the local record linked to the same run, to execute the declared automations and publish their results with confirmation. Prumo reads all result pages before showing pending cases.
