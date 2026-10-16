# Access, users and permissions

Prumo always opens on the sign-in screen. A person's **role** controls which work screens they can see or change. The separate **admin mark** controls who can open Administration. It is for people who manage the system, not for everyday work.

## First access

On a computer with no accounts, the sign-in screen offers three ways to create the first account:

- **Create account**: enter a name, e-mail and password (at least 10 characters, including letters and numbers). Prumo sends a 6-digit code to your e-mail. Enter the code to create the account and sign in. It is valid for 10 minutes. If it does not arrive, check your spam folder and try **Resend code** after a minute.
- **Create account with GitHub** or **Create account with Google**: Prumo opens the browser, you authorize and come back already signed in. If the provider is not configured on this computer yet, the sign-in screen asks once for the **Client ID** and **Client Secret** (how to create them: section **Sign in with GitHub or Google**, below).

Below the card are the **language** (Portuguese or English, applied right on the sign-in screen) and **Website and docs**, which opens the official website in the browser.

The first account gets the admin mark. Later, sign in with your e-mail and password. You can also use the short login: the part of your e-mail before `@`.

Sending the code needs internet: the e-mail, the code and the language go to the Prumo sending service, which sends the message. Nothing else leaves the computer.

## Roles

Each role has a level per work screen:

- **No access**: the screen disappears from the menu and Prumo refuses its requests.
- **View**: read only.
- **Use**: read and change.

The Administrator role is fixed and can use every work screen. Create other roles in **Administration › Permissions**, starting from an existing role. Prumo checks access for every request; hiding a button is not what protects an action.

## Admin mark

Only accounts with the admin mark can open **Administration**, which includes users, permissions, platform agents, general settings and live documentation. The role does not change this: an Administrator without the mark cannot open it, while a regular role with the mark can.

- In **Administration › Users**, the **Admin** column sets or removes the mark. When creating an account, the **Admin: sees the Administration screen** box starts unchecked.
- Nobody removes their own mark, and at least one active admin account always remains.
- Sign-ups from the sign-in screen never get the mark.
- Accounts created before this rule with the Administrator role stay admin.

## Accounts

- Admins can create accounts, approve sign-ups, change roles, disable, unlock or delete accounts. When an admin creates an account or resets its password, Prumo shows a **temporary password** once. The person sets a new password at first sign-in.
- In **General settings**: open sign-up or not, approval, role for new sign-ups, inactivity time and how many wrong attempts lock the account.
- To reset a password, choose **Forgot password**, enter the account e-mail, type the code that arrives and set a new password. If the account has no e-mail (for example, an account created by an admin or through GitHub/Google), an admin must reset it.
- Each person changes their own name and password in **My account**, in the corner of the window. **Settings › My profile** also has **Reset password** (by e-mail) and **Sign out**.
- **Two-step verification:** in **My account**, turn it on so that, after the password, a code is sent to your e-mail at every sign-in. In **General settings**, an admin can require it for all accounts with e-mail. Accounts without e-mail sign in with the password only. Without the Prumo service up, whoever needs the code cannot sign in.
- **Forgot password** is always on the sign-in screen.

## Sign in with GitHub or Google

Once a provider is configured, **Sign in with GitHub** and **Sign in with Google** appear. Prumo opens the browser for you to authorize, then returns you to the app.

- Active account: signs in directly. GitHub also creates a read-only connection. Its token includes the `repo` scope, but Prumo only writes after you enable writing and confirm. Google is used only to identify you.
- New person: the account stays **pending** and uses the role for new sign-ups until an admin approves it.
- The account is recognized by the provider's number, not by name or email.
- Cancelling, denying or waiting 5 minutes creates nothing.

To configure a provider, open **Administration › General settings**. For GitHub, create an OAuth App with the callback `http://127.0.0.1/callback`. In Google Cloud Console, create an OAuth credential of type **Desktop app**. Enter the Client ID and Client Secret; the secret is stored in the system vault and is not shown again.

## What sign-in does not do

Sign-in controls what each person can see and change **in the application**. The schedule worker, tray and MCP server run as the operating-system user. System confirmation is still required to run tests or publish changes. Data stays in that user's folder, so sign-in does not separate people who share the same computer account.

## Platform agents

In **Administration › Agents**, admins can enable or disable each agent, Claude Code or Codex, and orchestration for all projects. A project can add more restrictions, but cannot enable something disabled here.

## My profile

In the gear menu, **My profile** stores how to address you, your team role, experience and focus (up to 160 characters). The profile belongs to your account: someone else signing in on this computer neither sees nor uses yours. Agents use this information to tailor their answers, and the attendance history is also yours only. Claude Code and Codex receive it only if you select **Share experience, focus and account with the external AI**. This option is off by default, and the information is sent as data, not as instructions.
