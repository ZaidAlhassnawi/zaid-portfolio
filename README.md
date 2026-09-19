# Zaid Hani Alhasnawi - Dynamic Portfolio

A standalone, professional portfolio website integrated with **Supabase**, designed to provide a dynamic public portfolio and a secure administration dashboard.

The project includes:

* A fully responsive public interface in English.
* Dynamic loading of profile information, skills, projects, work experience, education, certificates, and social links from the database.
* Secure administrator authentication using Supabase Auth.
* Password recovery through email without deleting or recreating the administrator account.
* An administration dashboard for creating, updating, and deleting projects, skills, and certificates.
* The ability to associate skills with projects.
* Certificate file uploads directly to Supabase Storage.
* Ready-to-deploy configuration for GitHub Pages.

---

## 1. Supabase Connection Setup

Open the following file:

`assets/js/config.js`

Then add your Supabase **Project URL** and either the **Publishable Key** or **anon key**:

```js
export const SUPABASE_CONFIG = Object.freeze({
  url: "https://YOUR_PROJECT.supabase.co",
  publishableKey: "YOUR_PUBLISHABLE_KEY",
  storageBucket: "portfolio-assets",
});
```

Use only the public client key.

Never include any of the following in the project:

* `service_role` key
* PostgreSQL database password
* Database connection string

It is normal for the public Supabase key to be visible in a GitHub repository.

Application security must rely on properly configured **Row Level Security (RLS)** policies rather than attempting to hide the public client key.

---

## 2. Running the Project Locally

Do not open `index.html` directly by double-clicking it because the project uses JavaScript **ES Modules**.

Instead, run the project through a local web server.

### Using VS Code

Install the **Live Server** extension.

Then right-click:

`index.html`

and select:

`Open with Live Server`

### Using Python

From inside the project directory, run:

```bash
python -m http.server 5500
```

Then open:

```text
http://localhost:5500
```

Administrator login page:

```text
http://localhost:5500/admin/login.html
```

Password recovery page:

```text
http://localhost:5500/admin/reset-password.html
```

---

## 3. Required Supabase Security Configuration

Before deploying the portfolio, make sure the following security measures are configured correctly:

1. Disable public sign-ups in Supabase Auth.
2. Maintain only the intended administrator account.
3. Enable Row Level Security on all public tables.
4. Allow public visitors to perform `SELECT` operations only on records intended to be publicly visible.
5. Allow `INSERT`, `UPDATE`, and `DELETE` operations only for authenticated and authorized users.
6. Keep the `portfolio-assets` Storage bucket publicly readable only where required.
7. Restrict Storage upload, update, and delete operations to paths beginning with the authenticated user's User ID.
8. Never include the `service_role` key, database password, or database connection string in the project files or GitHub repository.

The following script can be executed from the Supabase SQL Editor:

```text
sql/security-audit.sql
```

It performs a read-only audit of the current RLS configuration and security policies without modifying application data.

---

## 4. How the Administration Dashboard Works

### `admin/login.html`

The login page sends the administrator's email address and password directly to Supabase Auth over HTTPS.

Supabase then creates an authenticated session and automatically handles session renewal.

### `admin/dashboard.html`

Before displaying administration data, the dashboard verifies that a valid authenticated session exists.

All database modification requests are sent to Supabase and are independently validated again by the configured RLS policies.

### `admin/reset-password.html`

The password recovery page allows the administrator to request a password reset email.

After the recovery link has been verified, the administrator can securely define a new password without deleting the existing account.

Hiding the administration dashboard URL is not considered a security mechanism.

The actual security boundary is provided by **Supabase Auth, Row Level Security policies, and Storage policies**.

---

## 5. Uploading Certificates

From the Dashboard, navigate to:

`Certificates → Add Certificate`

When a file is selected:

* Supported formats are:

  * JPEG
  * PNG
  * WEBP
  * PDF
* Maximum file size: **5 MB**
* The file is uploaded to the following Storage path:

```text
USER_ID/certificates/unique-file-name.pdf
```

The resulting Storage path is saved in:

```text
certificates.image_path
```

This approach keeps certificate files organized under the authenticated administrator's Storage namespace.

---

## 6. Deploying to GitHub Pages

To deploy the portfolio using GitHub Pages:

1. Create a new GitHub repository, for example:

   `zaid-portfolio`

2. Upload the contents of this project directory to the `main` branch.

3. Open the repository's:

   `Settings → Pages`

4. Under the deployment source, select:

   `Deploy from a branch`

5. Select:

   * Branch: `main`
   * Folder: `/root`

6. Save the configuration.

GitHub Pages will generate a public URL for the portfolio.

If future authentication features require external redirects, add the GitHub Pages URL to the allowed redirect URLs in the Supabase Auth configuration.

The current email-and-password login flow does not require an external redirect URL.

---

## 7. Main Project Files

```text
index.html
    Public portfolio interface

admin/login.html
    Administrator login page

admin/dashboard.html
    Administration dashboard

admin/reset-password.html
    Password recovery and password update page

assets/js/config.js
    Public Supabase connection configuration

assets/js/supabase-client.js
    Supabase client initialization

assets/js/portfolio.js
    Loads and renders public portfolio data

assets/js/login.js
    Handles administrator authentication

assets/js/reset-password.js
    Handles password recovery and password updates

assets/js/dashboard.js
    Handles CRUD operations and certificate uploads

assets/css/main.css
    Public portfolio styling

assets/css/admin.css
    Administration dashboard styling

sql/security-audit.sql
    Read-only Supabase security audit script
```

---

## Important Note

The current administration dashboard manages the following portfolio sections:

* Projects
* Skills
* Certificates

Other sections, including profile information, work experience, education, and additional portfolio content, are currently loaded directly from the Supabase database.

Administration forms for these sections can be added later using the same architecture and CRUD pattern already implemented in the dashboard.
