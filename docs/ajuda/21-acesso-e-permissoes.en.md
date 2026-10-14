# Access, users and permissions

Prumo works with this computer's Windows account. If several people share the computer, or you want to limit what each one does, turn **login** on in **Administration › Users**.

## Turn login on

1. Open **Administration › Users** and click **Turn on login**.
2. Create the first account: it is always an **Administrator**. The username has 3 to 40 characters (lowercase letters, numbers, dot, hyphen or underscore) and the password at least 10 characters, mixing letters and numbers.
3. Keep the **recovery code**, shown only once, outside this computer.

From then on the window asks for login before showing any screen. With login off nothing changes: every screen stays open, as before.

## Roles and permissions

Each person has a **role**, and each role has a level per screen: **No access** (the screen disappears from the menu and the backend refuses its requests), **View** (read without changing) or **Use** (read and change). The Administrator role is fixed; you create the others in **Administration › Permissions**, starting from an existing role.

Checks run in the main process on every request, not only in the window: hiding a button is not authorization.

## Accounts

- The administrator creates accounts, approves registrations, changes the role, deactivates, unlocks and deletes. When an account is created or a password reset, Prumo shows a **temporary password** only once; the person sets their own password on first sign-in.
- In **General settings** you choose whether registration from the sign-in screen is open, whether it needs approval, which role new registrations get, the inactivity time and how many wrong attempts lock the account.
- Whoever forgets the password uses the recovery code; without it, Administration resets the password.
- The last administrator cannot be deleted or demoted, and nobody becomes an administrator by registering.
- Each person can change their own name and password in **My account**, in the window corner.

## What login does not do

Login controls what each person sees and changes **in the application**. The schedule worker, the tray and the MCP server keep running with this computer's Windows account, and the native Windows confirmation to run and publish is still required. Project and integration data stay local per Windows account: login does not isolate people who share the same Windows account.

## Platform agents

In **Administration › Agents**, whoever has permission turns each agent on or off for all projects, the use of Claude Code or Codex, and orchestration. These rules apply on top of each project's policies (Agents screen).

## My profile (Settings)

In the gear panel, the **My profile** tab stores what Prumo should call you, your role on the team, your experience (beginner, intermediate or advanced) and your work focus (up to 160 characters). Prumo's agents use this data on this computer to greet you, adjust the level of explanations and prioritize your focus. Claude Code and Codex only receive experience, focus and your account's role if you check **Share experience, focus and account with the external AI** (unchecked by default); even then they arrive as data, never as instructions. **My account** (name and password change) is in the same panel and in the corner of the window.
