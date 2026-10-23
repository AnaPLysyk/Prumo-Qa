# Access, users and permissions

Prumo always opens on the sign-in screen. A person's **role** controls which work screens they see or change. The **admin mark** controls who opens Administration, which is for people who manage the system, not for everyday work.

## First access

On a computer with no accounts, the sign-in screen offers **Create account**, **Continue with GitHub** and **Continue with Google**.

- **Create account**: enter name, e-mail and password (at least 10 characters, with letters and numbers). Prumo sends a 6-digit code to your e-mail; enter it to create the account and sign in. The code is valid for 10 minutes. If it does not arrive, check spam and use **Resend code** after a minute.
- **GitHub or Google**: you authorize in the browser. Sign-in never asks for a client ID, secret or token. On GitHub, authorization includes a short code typed in the browser.

The first account gets the admin mark. If it was created with e-mail, sign in with e-mail and password (or the short login); if it was created with GitHub or Google, sign in again through the same provider.

Below the card are the **language** (Portuguese or English, applied right on the sign-in screen) and **Website and docs**, which opens the official website in the browser.

Sending the code needs internet: the e-mail, the code and the language go to the Prumo sending service, which sends the message. Nothing else leaves the computer.

## Sign in with GitHub or Google

The sign-in card shows the installed version, keeps e-mail and password and adds **Continue with GitHub** and **Continue with Google**.

- GitHub asks only for `read:user`, never `repo`, and does not create repository connections. To use repositories, link them after signing in, in **Projects**.
- Google can supply a verified e-mail, but equal e-mails do not merge accounts automatically.
- New sign-ups follow the approval policy: they wait when approval is required and sign in directly when it is not. New installations have approval off.
- Social sign-in is not a second MFA factor.

Administration configures the OAuth credentials once, in **Administration › General settings**. Without them, the button says the provider is unavailable and e-mail sign-in keeps working.

## Roles

Each role has a level per work screen:

- **No access**: the screen disappears from the menu and Prumo refuses its requests.
- **View**: read only.
- **Use**: read and change.

The Administrator role is fixed and uses every work screen. Create other roles in **Administration › Permissions**, from an existing role. Prumo checks access on every request; hiding a button does not protect an action.

## Admin mark

Only accounts with the admin mark open **Administration**, which includes users, permissions, platform agents, general settings and live documentation. The role does not change this: an Administrator without the mark cannot enter, and a regular-role account with the mark can.

- In **Administration › Users**, the **Admin** column sets or removes the mark. When creating an account, the **Admin: sees the Administration screen** box starts unchecked.
- Nobody removes their own mark, and at least one active admin account always remains.
- Sign-ups from the sign-in screen never get the mark.
- Accounts created before this rule with the Administrator role stay admin.

## Accounts

- Admins create accounts, approve sign-ups, change roles, and disable, unlock or delete accounts. When an admin creates an account or resets a password, Prumo shows a **temporary password** once; the person sets their own at first sign-in.
- In **General settings**: open sign-up or not, approval, role for new sign-ups, inactivity time and how many wrong attempts lock the account.
- **Forgot password** is always on the sign-in screen: enter the account e-mail, type the code that arrives and set a new password. If the account has no e-mail (created by an admin or through GitHub/Google), an admin must reset it.
- **My account** opens from the photo in the top corner, with the tabs **Profile**, **My profile** and **Security**. In **Profile** you change your name and photo. In **Security** you change the password, set up two-step verification (when available) and reset the password by e-mail. **My profile** is described below.
- **Two-step verification:** turned on in **My account**, it sends a code to your e-mail at every sign-in, after the password. In **General settings**, an admin can require it for all accounts with e-mail. Accounts without e-mail sign in with the password only. Without the Prumo service up, whoever needs the code cannot sign in.

## What sign-in does not do

Sign-in controls what each person sees and changes **in the application**. The schedule worker, the tray and the MCP server run as the operating-system user, and system confirmation is still required to run tests or publish changes. Data stays in that user's folder, so sign-in does not separate people who share the same computer account.

## Platform agents

In **Administration › Agents**, admins turn each agent (Claude Code, Codex and orchestration) on or off for all projects. A project can add more restrictions, but cannot enable something disabled here.

## My profile

In **My account › My profile** you set how you want to be addressed, your team role, your experience and your focus (up to 160 characters). Prumo stores this on your account: someone else signing in on this computer neither sees nor uses your profile, and the attendance history is also yours only. Agents use this information to tailor their answers. Claude Code and Codex receive it only if you select **Share experience, focus and account with the external AI**, which is off by default; when shared, it is treated as data, not as instructions.
