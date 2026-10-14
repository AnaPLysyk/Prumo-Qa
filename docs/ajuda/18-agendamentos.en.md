# Schedules, tray and runs

Prumo runs a QA routine by itself, without AI. Everything below works with Claude and Codex turned off. They can help interpret results, but they do not run commands, create schedules or publish anything outside the permissions you approved.

## How to create a routine

In Schedules, click New routine. Choose the Prumo project, the type, the frequency and the time zone.

Available types: Jira query (read-only), smoke and regression (run an automation already declared in the project contract), validation by ticket (runs only automations you associated with the ticket in Traceability), change analysis (reads GitHub commits and recommends; it never triggers tests by itself) and performance with k6.

Frequencies: once, every N minutes, every day or on days of the week, always in the chosen time zone. Daylight saving changes are handled: a time that does not exist moves to just after the jump, and a repeated time counts once.

A routine never receives a free-form command. It only picks a capability that the project already declared in qa.project.json. Ticket or description text is always data, never an order.

## How to authorize tests

Running tests is a protected action. In each routine, use Authorize scheduled runs. Prumo shows what the routine can do, asks for your confirmation and then for your Windows authentication. The authorization is valid only for that exact project, environment and command, for up to 30 days and up to a maximum number of runs. If the command, the contract or the test files change, it stops being valid and the run becomes BLOCKED until you authorize again. You can revoke it at any time.

Run now, done by you, asks for Windows authentication every time.

## Prumo in the Windows tray

When you close the window, Prumo stays in the tray so routines keep going. The icon menu lets you open, view schedules, view runs, pause or resume, see the worker state and Quit Prumo. Quit stops the worker and the processes it started. Prumo only starts with Windows if you turn that option on in Schedules; it is off by default.

Pausing prevents new runs; what is already running finishes without being corrupted. If the computer is off, suspended or Prumo is closed at that time, nothing runs: the time shows as MISSED and never as run.

## How to read PASS, FAIL, BLOCKED and NOT_RUN

PASS: the run finished and the reported scenarios passed. FAIL: a test failed. BLOCKED: it could not run because of a rule (approval, expired authorization, changed project, missing tool); this is not a product defect. NOT_RUN: nothing was run. A network or service failure appears as an infrastructure error and may be retried automatically; a test failure is never silently repeated.

PASS without individual scenarios only means the process finished successfully: there is no per-scenario result.

## Look up an old run

In Runs you see the history of all projects or of one project, filtered by ticket and result. Each row shows who ran it (schedule or manual), attempts, duration, scenarios and the state of the Jira comment. View evidence opens the real result stored in the project folder. Viewing the screen does not count as a QA run.

## Relate a run to a ticket

Enter the ticket in the routine. For validation by ticket, the automations come from the associations declared in Traceability (Jira to automation). Without an association, the routine is BLOCKED and nothing is run.

## Jira comments

Prumo can record the result on the ticket as a comment: ticket, type, environment, scenarios, PASS and FAIL, a summary of failures and the local evidence reference. It does not say the ticket was approved and never changes the ticket status.

Manual: in Runs, open Jira comment, read the preview and confirm. Scheduled: first create a publishing policy limited to tickets, routine types, validity and quantity. Without a policy, no scheduled routine comments. Repeating or retrying does not create a duplicate comment. If publishing fails, the local record stays as a pending item.

## What depends on AI

Nothing here depends on AI. AI is optional and only assists: it analyzes tickets, suggests coverage, interprets logs and proposes texts. Decisions, authorizations and records stay with Prumo.
