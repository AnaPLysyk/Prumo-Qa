# Schedules, tray and runs

QA routines work without AI. Claude and Codex can help interpret a result, but they do not create routines, run tests or publish results.

## Create a routine

In **Schedules**, click **New routine**. Choose the project, routine type, environment, frequency and time zone.

- **Jira query**: reads up to 50 tickets and shows what is new or changed. It runs nothing.
- **Smoke** and **Regression**: run an automation already declared in the project's `qa.project.json`.
- **Validation by ticket**: runs only the tests linked to the ticket in **Tests › Repository**. Without a link, it is `BLOCKED`.
- **Change analysis**: reads the linked GitHub commits and says how many are new. It never triggers tests.
- **Performance (k6)**: uses the official k6 installed on your computer, with up to 50 virtual users for up to 600 seconds. It cannot run in production. Without k6, it is `NOT_RUN`.
- **Qase run**: runs the automations of the cases in a run already created in Qase.

You can run a routine once, every few minutes, daily or weekly. It uses the chosen time zone. When daylight saving starts, a time that does not exist moves to the first available time. If a time occurs twice, the routine runs only once.

A routine can run only a capability declared by the project; it cannot accept a free-form command. Ticket text is treated as information, never as an instruction to Prumo.

## Authorize tests

Running tests requires authorization. Open the routine and its **Authorization** tab. Choose how long the authorization lasts (1 to 30 days), set the maximum number of runs and click **Authorize scheduled runs…**. Prumo shows what the routine can do, then asks you to confirm and authenticate with your system.

- It applies only to that project, environment and command.
- If the command, project contract or test files change, the authorization expires. The run is `BLOCKED` until you authorize it again.
- You can revoke it at any time.

**Run now** is done by you and asks for authentication every time.

## Tray and missed times

When you close the window, Prumo stays in the system tray so routines can continue. Its menu lets you open Prumo, view or pause routines and check the worker (the process that runs them). **Quit Prumo** stops the worker and the processes it started.

In **Policies and preferences › Resident Prumo** you turn on **Start Prumo with the system**. It is off by default.

Pausing prevents new runs but does not stop one already in progress. If the computer is off or suspended, or you quit Prumo, the routine does not run; its time is marked **MISSED**. Under **If Prumo is closed at that time**, you can choose **Run once when back**.

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
