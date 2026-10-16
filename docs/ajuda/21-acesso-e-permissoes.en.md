# Access, users and permissions

Prumo always opens on the sign-in screen. I kept two things apart: the **role** says which work screens each person sees and changes; the **admin mark** says who gets into Administration. The mark is for whoever looks after the system, not for day-to-day use.

## First access

On a computer with no accounts, the sign-in screen shows **Create Administrator account**. Enter your name, username (3 to 40 characters: lowercase letters, numbers, dot, hyphen or underscore) and password (at least 10 characters, with letters and numbers). With GitHub or Google configured, **Create account with GitHub** (or **with Google**) does the same through the provider's authorization.

This first account is born with the admin mark. Keep the **recovery code**: it is shown only once and should be kept outside this computer.

## Roles

Each role has a level per work screen:

- **No access**: the screen disappears from the menu and Prumo refuses its requests.
- **View**: read only.
- **Use**: read and change.

The Administrator role is fixed and uses every work screen. You create the others in **Administration › Permissions**, starting from an existing role. The check happens on every request, in the main process; hiding a button is not the authorization.

## Admin mark

Only accounts with the admin mark see the **Administration** screen (users, permissions, platform agents, general settings, living documentation). The role does not change that: an Administrator role without the mark does not get in, and a regular role with the mark does.

- In **Administration › Users**, the **Admin** column sets or removes the mark. When creating an account, the **Admin: sees the Administration screen** box starts unchecked.
- Nobody removes their own mark, and at least one active admin account always remains.
- Sign-ups from the sign-in screen never get the mark.
- Accounts created before this rule with the Administrator role stay admin.

## Accounts

- Admins create accounts, approve sign-ups, change the role, disable, unlock and delete. When creating an account or resetting a password, Prumo shows a **temporary password** once; the person sets their own on first access.
- In **General settings**: open sign-up or not, approval, role for new sign-ups, inactivity time and how many wrong attempts lock the account.
- Forgot the password: use the recovery code; without it, an admin resets it.
- Each person changes their own name and password in **My account**, in the corner of the window.

## Sign in with GitHub or Google

With the provider configured, **Sign in with GitHub** and **Sign in with Google** appear. Prumo opens the browser; you authorize and come back signed in.

- Active account: signs in directly. Through GitHub, the GitHub connection is created too, read-only. The token has the `repo` scope, but Prumo only writes after you enable writing and confirm. Google only identifies you.
- New person: the sign-up stays **pending**, with the role for new sign-ups, until an admin approves.
- The account is recognized by the provider's number, not by name or email.
- Cancelling, denying or waiting 5 minutes creates nothing.

To configure, in **Administration › General settings**: on GitHub, an OAuth App with the callback `http://127.0.0.1/callback`; in Google Cloud Console, an OAuth credential of type **Desktop app**. Paste the Client ID and Client Secret; the secret stays in the system vault and never comes back to the screen.

## What sign-in does not do

Sign-in controls what each person sees and changes **in the application**. The schedule worker, the tray and the MCP server run as the operating system user, and the system confirmation to run and publish is still required. Data stays in that user's folder: sign-in does not isolate people who share the same computer user.

## Platform agents

In **Administration › Agents**, admins turn each agent, the use of Claude Code or Codex and orchestration on or off for all projects. A project can restrict further, never allow what is off here.

## My profile

In the gear menu, **My profile** keeps how to address you, your role on the team, your experience and your focus (up to 160 characters). The agents use this on this computer to adjust their answers. Claude Code and Codex only receive it if you check **Share experience, focus and account with the external AI** (unchecked by default), and even then as data, never as an instruction.
