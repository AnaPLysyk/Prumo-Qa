# Access, users and permissions

Prumo **always opens on the sign-in screen** and does not let you use anything without signing in. Each person has their own account and role; whoever administers the computer controls who gets in and what each one sees.

## First access

The first time Prumo opens on a computer, no account exists yet. The screen asks you to create the **Administrator** account, which is always the first one:

1. Enter your name, username (3 to 40 characters: lowercase letters, numbers, dot, hyphen or underscore) and a password of at least 10 characters, mixing letters and numbers. If GitHub or Google is already configured, **Create account with GitHub** (or **with Google**) does the same through the provider's authorization.
2. Keep the **recovery code**, shown only once, outside this computer.

Until that account is created no screen opens and no request is served. After it, Prumo always opens on sign-in and asks for login.

## Roles and permissions

Each person has a **role**, and each role has a level per screen: **No access** (the screen disappears from the menu and the backend refuses its requests), **View** (read without changing) or **Use** (read and change). The Administrator role is fixed; you create the others in **Administration › Permissions**, starting from an existing role.

Checks run in the main process on every request, not only in the window: hiding a button is not authorization.

## Accounts

- The administrator creates accounts, approves registrations, changes the role, deactivates, unlocks and deletes. When an account is created or a password reset, Prumo shows a **temporary password** only once; the person sets their own password on first sign-in.
- In **General settings** you choose whether registration from the sign-in screen is open, whether it needs approval, which role new registrations get, the inactivity time and how many wrong attempts lock the account.
- Whoever forgets the password uses the recovery code; without it, Administration resets the password.
- The last administrator cannot be deleted or demoted, and nobody becomes an administrator by registering.
- Each person can change their own name and password in **My account**, in the window corner.

## Sign in and sign up with GitHub or Google

When the Administration has configured it, the sign-in and **Create account** screens show **Sign in with GitHub** and **Sign in with Google**. Clicking opens the provider in your browser; you authorize there and return to Prumo already signed in, with no code or password to type.

- **People with an active account** sign in directly. With GitHub, the GitHub connection is also created automatically (read-only; writing stays off until you enable it). Google is only used to sign in: no connection is created.
- **People without an account** are registered as **pending**, with the role given to new sign-ups, and **nothing is enabled** until the Administration approves. Once approved, just sign in again through the provider.
- **First access, no account yet:** **Create account with GitHub** (or **with Google**) creates the first account, an Administrator, from the provider authorization. This needs the provider's app to be configured on this computer already.
- The account is recognized by the provider's number, never by name or e-mail. Accounts created this way have no Prumo password.
- Cancelling, denying the authorization or letting 5 minutes pass creates no account, session or connection.

**How to set it up (Administration › General settings).** On GitHub, register an OAuth App at github.com/settings/developers with the callback `http://127.0.0.1/callback`; in the Google Cloud Console, create an OAuth credential of type **Desktop app**. Paste the **Client ID** and **Client Secret** in the provider's section. The secret stays in the system vault and never returns to the screen. Without this setup the button does not appear. GitHub asks for `read:user repo` access (to list private repositories) and Google for `openid email profile`.

## What login does not do

Login controls what each person sees and changes **in the application**. The schedule worker, the tray and the MCP server keep running with this computer's Windows account, and the native Windows confirmation to run and publish is still required. Project and integration data stay local per Windows account: login does not isolate people who share the same Windows account.

## Platform agents

In **Administration › Agents**, whoever has permission turns each agent on or off for all projects, the use of Claude Code or Codex, and orchestration. These rules apply on top of each project's policies (Agents screen).

## My profile (Settings)

In the gear panel, the **My profile** tab stores what Prumo should call you, your role on the team, your experience (beginner, intermediate or advanced) and your work focus (up to 160 characters). Prumo's agents use this data on this computer to greet you, adjust the level of explanations and prioritize your focus. Claude Code and Codex only receive experience, focus and your account's role if you check **Share experience, focus and account with the external AI** (unchecked by default); even then they arrive as data, never as instructions. **My account** (name and password change) is in the same panel and in the corner of the window.
