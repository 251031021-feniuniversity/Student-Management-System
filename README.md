# EduTrack Pro — Student Management System

PHP + MySQL backend, plain HTML/CSS/JS frontend. Runs on any cPanel hosting.

## Folder structure

```
project/
├── index.html                  redirects to frontend/index.html
├── frontend/
│   ├── index.html              redirects to login.html
│   ├── login.html
│   ├── register.html           admission request -> admin "Requests" tab
│   ├── app.html                dashboard (admin / teacher / student, after login)
│   ├── css/style.css
│   ├── js/script.js            public pages (login, register, contact)
│   ├── js/app.js               dashboard application
│   └── images/
├── backend/
│   ├── index.php               API entry point  (backend/index.php?api=ACTION)
│   ├── server/                 config.php (DB credentials), database.php, helpers.php, router.php
│   ├── routes/api.php          action -> controller map
│   └── controllers/            Auth, Data, Student, Teacher, Attendance, Result,
│                               Notice, Fee, Settings, Admission
└── database/
    └── database.sql            full schema + default admin
```

## Deploy on cPanel

1. **Database** — cPanel > MySQL Databases: create the database and user and give the user ALL PRIVILEGES.
2. **Config** — open `backend/server/config.php` and set `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASS`.
3. **Upload** — File Manager > `public_html` > Upload `project.zip` > Extract.
   Put the folders directly in `public_html` (site at `https://yourdomain.com/frontend/`) or in a subfolder.
   The root `index.html` redirects visitors to `frontend/`.
4. **PHP version** — cPanel > Select PHP Version: use PHP 7.4 or newer and enable `pdo_mysql` and `mbstring`.
5. **Tables** — created automatically on the first visit (the backend runs `database/database.sql`).
   You can also import that file manually in phpMyAdmin.
6. Open `https://yourdomain.com/frontend/login.html`.

> `frontend/` and `backend/` must stay side by side because the frontend calls `../backend/index.php`.
> The `.htaccess` files in `backend/server`, `backend/routes`, `backend/controllers` and `database` block direct web access.

## Default login

| ID | Password |
|----|----------|
| `admin` | `admin123` |

**Change it immediately:** Dashboard > Settings > Admin Password.
If you forget it, run this once (then delete the file):

```php
<?php
$pdo = new PDO('mysql:host=localhost;dbname=DB_NAME;charset=utf8mb4','DB_USER','DB_PASS');
$pdo->prepare("UPDATE users SET password=? WHERE uid='admin'")->execute([password_hash('NewPass123', PASSWORD_DEFAULT)]);
echo 'Done';
```

## Features

- Roles: admin, teacher (per-teacher permissions for results / attendance / notices), student.
- Students, teachers, bulk attendance, results with auto grade + GPA, **fees (bill one/all students, record payments, due tracking)**, notices, charts, dark/light theme, school name setting.
- Public admission requests (admin approves and assigns Student ID).
- Students/teachers can log in with their ID **or** email.

## bKash payment (students pay fees online)

Credentials are in `backend/server/config.php` (`BKASH_*`) — currently the **sandbox** ones.
Student: My Fees (or My Profile) > **Pay with bKash** > `pay.html` (all student + fee info, **Pay Now**) > bKash page (number, OTP, PIN are entered there) > `invoice.html` (**Download PDF** / Print). The fee is marked paid only after the server verifies with bKash (`backend/bkash_callback.php`).
Sandbox test wallets (bKash docs): 01770618575, 01929918378, 01770618576, 01877722345, 01619777282, 01619777283 — **OTP 123456, PIN 12121**. If one wallet says "Your wallet is locked" (too many wrong PINs), just use another one. Failure-test wallets: 01823074817 (insufficient balance), 01823074818 (debit block). For live: use merchant credentials and `https://tokenized.pay.bka.sh/v1.2.0-beta`. Needs PHP cURL and HTTPS.

**bKash not working?** Log in as admin, then open `backend/bkash_test.php` in the browser. It checks cURL, HTTPS, token grant and create-payment, and prints the exact reason. **Delete that file afterwards.** Detailed errors are also written to the PHP error log (cPanel > Errors / `error_log`).

### Payment notes

- Folder names must not contain spaces (e.g. use `school`, not `Student Management System`) — bKash rejects such callback URLs. The site must be on **https**.
- A payment becomes `completed` only after the server confirms it with bKash. If bKash cannot be reached during verification the payment stays `pending` and is verified again when the student reopens the callback / retries.
- Failed payments show bKash's reason on the pay page (e.g. *Insufficient Balance*, *Your wallet is locked*).
- "Your wallet is locked" comes from bKash's shared sandbox wallets — just try another sandbox wallet (PIN 12121, OTP 123456).
- A fee with a completed/pending bKash payment cannot be deleted (keeps invoices safe).

## Security notes

- Passwords are bcrypt-hashed; admin can reset but never view them.
- All API calls are POST + CSRF token; permissions are enforced on the server.
- Login lock after 5 wrong attempts; public forms are rate-limited and have a honeypot field.
- Do not share `backend/server/config.php`. Use HTTPS (cPanel > SSL/TLS Status > AutoSSL).

## API (backend/index.php?api=...)

Public: `init`, `login`, `logout`, `register_submit`.
Logged-in: `bootstrap`, `student_*`, `teacher_*`, `att_save`, `result_*`, `fee_*`, `notice_*`, `cfg_save`, `self_pw`, `reset_system`, `request_approve`, `request_reject`.
