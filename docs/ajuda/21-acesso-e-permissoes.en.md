# Access, users and permissions

Prumo always opens on the sign-in screen. Each person has an account and a role; whoever administers the computer controls who gets in and what each one sees.

## First access

On a computer with no accounts, the sign-in screen offers **Create account**, which creates the **Administrator** account, always the first one. Enter your name, username (3 to 40 characters: lowercase letters, numbers, dot, hyphen or underscore) and password (at least 10 characters, with letters and numbers). With GitHub or Google already configured, **Create account with GitHub** (or **with Google**) does the same through the provider's authorization.

Keep the **recovery code**: it is shown only once, and should be kept outside this computer. No screen opens until the account exists.

## Roles and permissions

Each person has a **role**, and each role has a level per screen: **No access** (the screen disappears from the menu and the backend refuses its requests), **View** (read without changing) or **Use** (read and change). The Administrator role is fixed; you create the others in **Administration › Permissions**, starting from an existing role.

Checks run in the main process on every request, not only in the window: hiding a button is not authorization.

## Accounts

- The administrator creates accounts, approves registrations, changes the role, deactivates, unlocks and deletes. When an account is created or a password reset, Prumo shows a **temporary password** only once; the person sets their own password on first sign-in.
- In **General settings** you choose whether registration from the sign-in screen is open, whether it needs approval, which role new registrations get, the inactivity time and how many wrong attempts lock the account.
- Whoever forgets the password uses the recovery code; without it, Administration resets the password.
- The last administrator cannot be deleted or demoted, and nobody becomes an administrator by registering.
- Each person can change their own name and password in **My account**, in the window corner.

## Sign in with GitHub or Google

With the provider configured, the sign-in and create-account screens show **Sign in with GitHub** and **Sign in with Google**. Prumo opens the browser; you authorize and return already signed in.

- Active account: signs in directly. With GitHub, the GitHub connection is created too (read-only; writing stays off). The token technically has write permission (`repo` scope); Prumo only uses it after you enable writing and confirm. Google only identifies you and creates no connection.
- New person: the sign-up stays **pending**, with the role given to new sign-ups, and nothing is enabled until the Administration approves. After that, just sign in again.
- The account is recognized by the provider's number, not by name or e-mail, and has no Prumo password.
- Cancelling, denying or waiting 5 minutes creates no account, session or connection.

To set it up, in **Administration › General settings**: on GitHub, register an OAuth App with the callback `http://127.0.0.1/callback`; in the Google Cloud Console, create an OAuth credential of type **Desktop app**. Paste the Client ID and Client Secret in the provider's section. The secret stays in the system vault and never returns to the screen. GitHub asks for `read:user repo` (to list private repositories); Google asks for `openid email profile`.

## What login does not do

Login controls what each person sees and changes **in the application**. The schedule worker, the tray and the MCP server keep running with this computer's Windows account, and the native Windows confirmation to run and publish is still required. Project and integration data stay local per Windows account: login does not isolate people who share the same Windows account.

## Platform agents

In **Administration › Agents**, whoever has permission turns each agent on or off for all projects, the use of Claude Code or Codex, and orchestration. These rules apply to all projects: a project can restrict more, but cannot enable what is turned off here.

## My profile (Settings)

In the gear panel, the **My profile** tab stores what Prumo should call you, your role on the team, your experience (beginner, intermediate or advanced) and your work focus (up to 160 characters). Prumo's agents use this data on this computer to greet you, adjust the level of explanations and prioritize your focus. Claude Code and Codex only receive experience, focus and your account's role if you check **Share experience, focus and account with the external AI** (unchecked by default); even then they arrive as data, never as instructions. **My account** (name and password change) is in the same panel and in the corner of the window.
