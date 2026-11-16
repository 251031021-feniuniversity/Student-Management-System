# EduTrack Pro — Student Management System

A web-based Student Management System built with **PHP, MySQL, HTML, CSS and JavaScript**. It provides separate access for administrators, teachers and students, with student records, attendance, results, notices, fees and bKash payment support.

---

## 1. Project Information

| Item | Details |
|---|---|
| Project Name | EduTrack Pro — Student Management System |
| Developer | Tarek |
| Student ID | 251031021 |
| Backend | PHP |
| Frontend | HTML, CSS, JavaScript |
| Database | MySQL |
| Database Engine | InnoDB |
| Character Set | utf8mb4 |
| Payment Integration | bKash Tokenized Checkout (sandbox configuration in the supplied project) |

> The developer name and student ID above are the project details supplied for this documentation.

## 2. Project Objectives

- Store and manage student information in one database.
- Provide role-based access for administrators, teachers and students.
- Record attendance and academic results.
- Publish notices and manage student fee records.
- Allow students to submit admission/registration requests.
- Support online fee payment through bKash and generate payment invoices.
- Reduce manual record keeping and make student information easier to manage.

## 3. Technologies Used

| Technology | Purpose |
|---|---|
| HTML5 | Page structure |
| CSS3 | Layout, styling and responsive interface |
| JavaScript | Frontend interaction and API requests |
| PHP | Backend logic and API endpoints |
| MySQL | Persistent data storage |
| PDO | PHP database connection and prepared queries |
| bKash Tokenized Checkout | Online payment workflow |
| Apache `.htaccess` | Restrict direct access to selected folders |

## 4. Main Features

### Administrator
- Admin login.
- Add, update and delete student records.
- Add, update and delete teacher accounts.
- Set teacher permissions for attendance, results and notices.
- Review admission requests, approve them and assign Student IDs, or reject them.
- Add attendance and manage student attendance records.
- Add and delete academic results.
- Create notices and delete notices.
- Create fees for one student or all students.
- Record fee payments and track outstanding balances.
- View payment information and invoices.
- Update application name, branding, colours and password-change settings.
- Change the administrator password.
- Reset system data (a destructive action).

### Teacher
- Teacher login.
- View student information.
- Use only the functions permitted by the administrator.
- Mark attendance when permitted.
- Add results and manage their own result entries when permitted.
- Publish notices when permitted.

### Student
- Submit an admission/registration request.
- Log in using Student ID or email.
- View their own profile and academic information.
- View attendance and results.
- View fee information and outstanding amounts.
- Pay eligible fees through bKash.
- View and print/download a completed payment invoice.
- Change their password if the administrator allows it.

### General Interface
- Dashboard for the logged-in user.
- Light/dark theme support.
- Application branding and configurable colours.
- Charts and summary information in the dashboard.
- Separate login, registration, dashboard, payment and invoice pages.

## 5. User Roles and Permissions

| Role | Main access |
|---|---|
| Admin | Full system management |
| Teacher | Student/academic information and permission-controlled attendance, results and notices |
| Student | Own profile, attendance, results, fees and payments |

The backend checks roles and permissions. Hiding a button in the frontend is not the only access control.

## 6. Project Folder Structure

```text
project/
├── index.html
├── README.md
├── frontend/
│   ├── index.html
│   ├── login.html
│   ├── register.html
│   ├── app.html
│   ├── pay.html
│   ├── invoice.html
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   ├── app.js
│   │   ├── common.js
│   │   ├── script.js
│   │   ├── pay.js
│   │   └── invoice.js
│   └── images/
├── backend/
│   ├── index.php
│   ├── bkash_callback.php
│   ├── bkash_test.php
│   ├── controllers/
│   ├── routes/
│   │   └── api.php
│   └── server/
│       ├── config.php
│       ├── database.php
│       ├── helpers.php
│       ├── router.php
│       └── bkash.php
└── database/
    └── database.sql
```

## 7. Database Design — SQL Tables

The supplied `database/database.sql` creates **9 tables**. The backend uses these tables:

### 7.1 `users`
Stores login accounts for administrators, teachers and students.

| Column | Purpose |
|---|---|
| `uid` | Unique login ID / primary key |
| `password` | Password hash |
| `role` | Account role: admin, teacher or student |
| `name` | User name |
| `email` | Email address |
| `subject` | Teacher's subject, where applicable |
| `mobile` | Mobile number |
| `can_result` | Teacher result permission |
| `can_att` | Teacher attendance permission |
| `can_notice` | Teacher notice permission |
| `created_at` | Account creation time |

### 7.2 `students`
Stores student profile and personal information.

| Column | Purpose |
|---|---|
| `sid` | Student ID / primary key |
| `n` | Auto-increment serial number |
| `name` | Student name |
| `email` | Email |
| `class_name` | Class/program |
| `batch` | Batch |
| `mobile` | Mobile number |
| `address` | Address |
| `dob` | Date of birth |
| `img` | Profile image URL |
| `joined` | Joining date |

### 7.3 `results`
Stores student examination results.

| Column | Purpose |
|---|---|
| `id` | Result record ID |
| `sid` | Related Student ID |
| `subject` | Subject name |
| `exam` | Examination name |
| `marks` | Obtained marks |
| `total` | Total marks |
| `exam_date` | Examination/result date |
| `added_by` | User ID of the account that added the result |

### 7.4 `attendance`
Stores daily attendance records.

| Column | Purpose |
|---|---|
| `id` | Attendance record ID |
| `sid` | Related Student ID |
| `att_date` | Attendance date |
| `status` | `present` or `absent` |
| `marked_by` | Name of the person who marked attendance |

A unique key on (`sid`, `att_date`) prevents multiple attendance rows for the same student on the same date. The application updates the existing row when attendance is marked again.

### 7.5 `notices`
Stores notices published by authorized users.

| Column | Purpose |
|---|---|
| `id` | Notice ID |
| `title` | Notice title |
| `body` | Notice details |
| `priority` | low, medium or high |
| `created_at` | Publication time |
| `by_name` | Publisher name |

### 7.6 `settings`
Stores configurable application settings.

| Column | Purpose |
|---|---|
| `k` | Setting key / primary key |
| `v` | Setting value (configuration is stored as text/JSON) |

### 7.7 `registrations`
Stores public admission/registration requests before admin approval.

| Column | Purpose |
|---|---|
| `id` | Registration request ID |
| `name` | Applicant name |
| `email` | Applicant email |
| `mobile` | Mobile number |
| `class_name` | Class/program |
| `batch` | Batch |
| `address` | Address |
| `pw_hash` | Hashed password for the future account |
| `created_at` | Request time |

### 7.8 `fees`
Stores fees assigned to students and payment progress.

| Column | Purpose |
|---|---|
| `id` | Fee ID |
| `sid` | Related Student ID |
| `title` | Fee title |
| `amount` | Total fee amount |
| `paid` | Amount already paid |
| `due_date` | Payment due date |
| `paid_date` | Date a payment was recorded |

Outstanding balance is calculated as `amount - paid`.

### 7.9 `bkash_payments`
Stores bKash payment attempts and verification details.

| Column | Purpose |
|---|---|
| `id` | Payment record ID |
| `payment_id` | bKash payment ID |
| `fee_id` | Related fee record |
| `sid` | Related Student ID |
| `amount` | Payment amount |
| `status` | Payment status, initially `pending` |
| `trx_id` | bKash transaction ID |
| `payer` | Payer's bKash number |
| `created_at` | Payment creation time |

## 8. SQL Concepts Used

The database script uses the following SQL features:

- `CREATE TABLE IF NOT EXISTS` — creates a table if it does not already exist.
- `INT`, `VARCHAR`, `TEXT`, `DATE`, `DATETIME`, `TIMESTAMP`, `TINYINT` — column data types.
- `PRIMARY KEY` — uniquely identifies each row.
- `AUTO_INCREMENT` — automatically generates numeric IDs.
- `NOT NULL` — requires a value.
- `DEFAULT` — provides a default value.
- `UNIQUE KEY` — prevents duplicate values or combinations.
- `KEY` / index — supports faster lookups.
- `FOREIGN KEY` — connects related tables.
- `ON DELETE CASCADE` — removes dependent records when a referenced student or fee is deleted.
- `ON UPDATE CASCADE` — propagates updates to referenced IDs.
- `ENGINE=InnoDB` — enables transactions and foreign-key support.
- `DEFAULT CHARSET=utf8mb4` — supports Unicode text, including Bangla.

## 9. Table Relationships

- `students.sid` is referenced by `results.sid`.
- `students.sid` is referenced by `attendance.sid`.
- `students.sid` is referenced by `fees.sid`.
- `fees.id` is referenced by `bkash_payments.fee_id`.
- `users.uid` is used by the application as the login identity and is associated with student/teacher IDs through application logic.
- `registrations` holds pending applicants until an administrator approves them and creates the corresponding user and student records.

The SQL file defines foreign keys for results, attendance, fees and bKash fee records. Other associations are handled by the PHP application.

## 10. Default Admin Account

The SQL file seeds this initial administrator account:

| Login ID | Initial password |
|---|---|
| `admin` | `admin123` |

**Change the initial password immediately after the first login.** Never use the default password on a public or production website.

## 11. How the Database Is Installed

The database name and database user must first be created in the hosting control panel.

1. Open `backend/server/config.php`.
2. Set the correct database host, database name, database username and database password.
3. Create the database and user in cPanel and grant the user the required privileges.
4. Either import `database/database.sql` through phpMyAdmin, or allow the backend's database installer to create the tables on its first connection.
5. The database itself must already exist; the PHP installer creates the tables inside the configured database.

## 12. How to Import SQL Using phpMyAdmin

1. Log in to cPanel.
2. Open **phpMyAdmin**.
3. Select the database created for this project.
4. Click the **Import** tab.
5. Choose `database/database.sql`.
6. Keep the SQL format selected.
7. Click **Import** or **Go**.
8. Confirm that the nine tables appear in the database.

## 13. Application Workflow

### Admission workflow
1. Applicant opens the registration page.
2. Applicant submits their information.
3. The request is stored in `registrations`.
4. Admin reviews the request.
5. Admin approves it and assigns a Student ID, or rejects it.
6. On approval, the application creates the login account in `users` and profile in `students`.

### Attendance workflow
1. Authorized admin/teacher selects a date.
2. Attendance is submitted for students.
3. Records are inserted or updated in `attendance`.
4. Students can view their own attendance.

### Result workflow
1. Authorized user selects a student.
2. Subject, exam, marks and total marks are submitted.
3. The record is saved in `results`.
4. Students can view their own results.

### Fee and bKash workflow
1. Admin assigns a fee to one student or all students.
2. Student opens their fee information.
3. Student starts a bKash payment.
4. Backend creates a payment request with bKash.
5. bKash sends the user through its checkout process.
6. The callback handler verifies the payment with bKash.
7. A verified payment is recorded as completed and the fee payment progress is updated.
8. Student can open the invoice page and print/download the invoice.

A payment must not be treated as successful merely because the browser returns to the website. The server-side verification is important.

## 14. API Overview

The API entry point is:

```text
backend/index.php?api=ACTION
```

The route map is in `backend/routes/api.php`.

| API action | Purpose |
|---|---|
| `init` | Initial session, CSRF token and application settings |
| `login` / `logout` | Authentication |
| `register_submit` | Submit an admission request |
| `bootstrap` | Load dashboard data |
| `student_add` / `student_update` / `student_delete` | Student management |
| `student_pw` | Admin resets a student's password |
| `teacher_add` / `teacher_update` / `teacher_delete` | Teacher management |
| `teacher_pw` | Admin resets a teacher's password |
| `teacher_access` | Update teacher permissions |
| `att_save` | Save attendance |
| `result_add` / `result_delete` | Manage results |
| `notice_add` / `notice_delete` | Manage notices |
| `fee_add` / `fee_pay` / `fee_delete` | Manage fees |
| `bkash_create` | Start a student bKash payment |
| `invoice_get` | Retrieve a completed payment invoice |
| `cfg_save` | Save application settings |
| `self_pw` | Change the current user's password |
| `reset_system` | Reset selected system data |
| `request_approve` / `request_reject` | Process admission requests |

The API uses POST requests for application actions. Authenticated routes require a valid session; the backend also checks roles and permissions.

## 15. Security Measures Present in the Code

- Passwords are stored using PHP password hashing and verified with `password_verify()`.
- Database operations use PDO prepared statements.
- Session IDs are regenerated after successful login.
- Session cookies use `HttpOnly` and `SameSite=Lax`; the `Secure` flag is enabled when HTTPS is detected.
- CSRF tokens are created for the session and checked by the request router.
- Login attempts are temporarily locked after repeated failures.
- Public registration and payment actions use rate limiting.
- The public registration form includes a honeypot field.
- Server-side role and permission checks protect restricted actions.
- `.htaccess` files restrict direct access to selected backend and database folders.

## 16. Requirements

- PHP 7.4 or newer (PHP 8.x recommended).
- MySQL or MariaDB.
- PHP extensions: `pdo_mysql`, `mbstring`, and cURL for bKash connectivity.
- Apache hosting with `.htaccess` support, or equivalent server access rules.
- HTTPS is required for the bKash payment callback workflow.
- A bKash merchant account and valid merchant credentials are required for live payments.

## 17. Local / cPanel Setup

1. Install a local PHP/MySQL environment such as XAMPP, or prepare a cPanel hosting account.
2. Create a MySQL database and database user.
3. Configure database connection values in `backend/server/config.php`.
4. Import `database/database.sql` through phpMyAdmin, or let the backend installer create its tables.
5. Keep `frontend/` and `backend/` side by side because frontend scripts call `../backend/index.php`.
6. Open `frontend/login.html` through the local web server or your domain.
7. Sign in with the initial admin account and change its password.

Do not open the PHP application by double-clicking the HTML files; run it through a PHP-enabled web server.

## 18. Important Security Warning Before Publishing to GitHub

**Check `backend/server/config.php` before pushing this project to GitHub.** The supplied project archive contains database connection credentials and bKash sandbox credentials in that file. Do not publish real database passwords, API secrets, or merchant credentials in a public repository.

- Change/rotate any database password that has already been included in a shared ZIP or pushed to a repository.
- Keep production secrets outside the public repository (for example, in server environment variables or a protected server-side configuration file).
- Use a safe example configuration file for GitHub, with placeholder values only.
- Use live bKash credentials only on the server and never commit them.
- Remove temporary diagnostic files such as `backend/bkash_test.php` from a production deployment after testing.
- Use HTTPS and change the default admin password.

## 19. Limitations / Notes

- The supplied configuration is set to bKash sandbox mode; real payments require approved merchant credentials and live configuration.
- The project uses a MySQL database; it is not an SQLite project.
- Some dashboard calculations and presentation logic are implemented in frontend JavaScript, while data validation and access checks are performed in PHP.
- The actual deployment domain, production credentials and live payment status must be configured by the project owner.

## 20. Developer

**Name:** Tarek  
**Student ID:** 251031021  
**Project:** EduTrack Pro — Student Management System

---

*Documentation prepared from the supplied project source files and SQL schema.*
