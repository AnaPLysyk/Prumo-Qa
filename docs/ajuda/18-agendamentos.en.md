# Schedules, tray and runs

I wanted the QA routine to run by itself, without depending on AI. Everything on this page works with Claude and Codex turned off: they can help you read a result, but they do not run, schedule or publish anything.

## Create a routine

In Schedules, click **New routine** and choose the project, type, environment, frequency and time zone.

- **Jira query**: reads up to 50 tickets and shows what is new or changed. It runs nothing.
- **Smoke** and **Regression**: run an automation already declared in the project's `qa.project.json`.
- **Validation by ticket**: runs only the automations associated with the ticket in the declared links (Tests › Repository). With no link, it is BLOCKED.
- **Change analysis**: reads the linked GitHub commits and says how many are new. It never triggers tests.
- **Performance (k6)**: uses the official k6 installed, up to 50 virtual users and 600 s, never in production. Without k6, it is NOT_RUN.
- **Qase run**: runs the automations of the cases in a run already created in Qase.

Frequency: once, every N minutes, every day or weekly, always in the chosen time zone. Daylight saving is handled: a time that does not exist moves to just after the jump; a repeated time counts once.

A routine never receives a free-form command, only a capability the project declared. Ticket text is data, never an order.

## Authorize tests

Running tests is a protected action. Open the routine, **Authorization** tab, choose the validity (1 to 30 days) and the maximum number of runs and click **Authorize scheduled runs…**. Prumo shows what the routine can do, asks for your confirmation and then for your system authentication.

- It is valid only for that exact project, environment and command.
- If the command, the contract or the test files change, it stops being valid and the run is BLOCKED until you authorize again.
- You can revoke it at any time.

**Run now** is done by you and asks for authentication every time.

## Tray and missed times

When you close the window, Prumo stays in the tray so routines keep going. The icon menu opens Prumo, shows schedules and runs, pauses or resumes, shows the worker state and has **Quit Prumo**, which stops the worker and the processes it started.

In **Policies and preferences › Resident Prumo** you turn on **Start Prumo with the system**. It is off by default.

Pausing prevents new runs; what is already running finishes without being corrupted. If the computer is off or suspended, or Prumo is closed, nothing runs: the time shows as MISSED, never as run. In the routine, **If Prumo is closed at that time** lets you switch to **Run once when back**.

## PASS, FAIL, BLOCKED and NOT_RUN

- **PASS**: it finished and the reported scenarios passed. With no individual scenarios, PASS only says the process finished successfully.
- **FAIL**: a test failed. A test failure is never silently repeated.
- **BLOCKED**: a rule prevented the run (missing or expired authorization, changed project, missing tool). It is not a product defect.
- **NOT_RUN**: nothing was run.

A network or service failure shows as an infrastructure error and may be retried automatically.

## Look up runs

**Tests › Runs** lists manual and scheduled runs, with filters by source and status. Open a row to see the summary, steps (attempts), logs and the evidence stored in the project folder.

## Jira comment

Enter the ticket in the routine. Prumo can comment the result on the ticket: type, environment, scenarios, a summary of failures and the local evidence reference. The comment does not approve the ticket and never changes its status.

- **Manual**: open the run (PASS or FAIL) in Tests › Runs, click **Jira comment**, read the preview and use **Publish to Jira…**.
- **Scheduled**: first approve a policy in **Policies and preferences › Jira comments**, limited to tickets, routine types, validity and quantity. Without a policy, no routine comments.

Repeating does not duplicate the comment. If publishing fails, the record stays as a local pending item.

The **Qase run** routine follows the same idea: it only publishes to Qase with the policy approved in the run's **Publishing** tab (Tests › Runs). You revoke these policies in **Policies and preferences › Results in Qase**.
