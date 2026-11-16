-- ============================================================
-- EduTrack Pro — database schema
-- Import via phpMyAdmin (optional) — the backend also runs this
-- file automatically the first time it connects.
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
  uid        VARCHAR(50)  NOT NULL PRIMARY KEY,
  password   VARCHAR(255) NOT NULL,
  role       VARCHAR(10)  NOT NULL,
  name       VARCHAR(150) NOT NULL,
  email      VARCHAR(150) NULL,
  subject    VARCHAR(100) NULL,
  mobile     VARCHAR(30)  NULL,
  can_result TINYINT(1)   NOT NULL DEFAULT 1,
  can_att    TINYINT(1)   NOT NULL DEFAULT 1,
  can_notice TINYINT(1)   NOT NULL DEFAULT 1,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_email (email),
  KEY idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS students (
  sid        VARCHAR(50)  NOT NULL PRIMARY KEY,
  n          INT          NOT NULL AUTO_INCREMENT,
  name       VARCHAR(150) NOT NULL,
  email      VARCHAR(150) NULL,
  class_name VARCHAR(100) NULL,
  batch      VARCHAR(30)  NULL,
  mobile     VARCHAR(30)  NULL,
  address    TEXT         NULL,
  dob        DATE         NULL,
  img        TEXT         NULL,
  joined     DATE         NOT NULL,
  UNIQUE KEY uq_n (n)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS results (
  id         INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
  sid        VARCHAR(50)  NOT NULL,
  subject    VARCHAR(120) NOT NULL,
  exam       VARCHAR(120) NOT NULL,
  marks      INT          NOT NULL,
  total      INT          NOT NULL,
  exam_date  DATE         NOT NULL,
  added_by   VARCHAR(50)  NULL,
  KEY idx_sid (sid),
  CONSTRAINT fk_res_stu FOREIGN KEY (sid) REFERENCES students(sid) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS attendance (
  id         INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
  sid        VARCHAR(50)  NOT NULL,
  att_date   DATE         NOT NULL,
  status     VARCHAR(10)  NOT NULL,
  marked_by  VARCHAR(150) NULL,
  UNIQUE KEY uq_att (sid, att_date),
  KEY idx_date (att_date),
  CONSTRAINT fk_att_stu FOREIGN KEY (sid) REFERENCES students(sid) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS notices (
  id         INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
  title      VARCHAR(255) NOT NULL,
  body       TEXT         NOT NULL,
  priority   VARCHAR(10)  NOT NULL DEFAULT 'medium',
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  by_name    VARCHAR(150) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS settings (
  k VARCHAR(50) NOT NULL PRIMARY KEY,
  v TEXT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS registrations (
  id         INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(150) NOT NULL,
  email      VARCHAR(150) NOT NULL,
  mobile     VARCHAR(30)  NULL,
  class_name VARCHAR(100) NULL,
  batch      VARCHAR(30)  NULL,
  address    TEXT         NULL,
  pw_hash    VARCHAR(255) NOT NULL,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS fees (
  id         INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
  sid        VARCHAR(50)  NOT NULL,
  title      VARCHAR(150) NOT NULL,
  amount     INT          NOT NULL,
  paid       INT          NOT NULL DEFAULT 0,
  due_date   DATE         NULL,
  paid_date  DATE         NULL,
  KEY idx_fee_sid (sid),
  CONSTRAINT fk_fee_stu FOREIGN KEY (sid) REFERENCES students(sid) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS bkash_payments (
  id         INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
  payment_id VARCHAR(60)  NOT NULL,
  fee_id     INT          NOT NULL,
  sid        VARCHAR(50)  NOT NULL,
  amount     INT          NOT NULL,
  status     VARCHAR(12)  NOT NULL DEFAULT 'pending',
  trx_id     VARCHAR(40)  NULL,
  payer      VARCHAR(20)  NULL,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_pay (payment_id),
  KEY idx_bk_fee (fee_id),
  CONSTRAINT fk_bk_fee FOREIGN KEY (fee_id) REFERENCES fees(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Default admin (ID: admin / Password: admin123) — change it after first login!
INSERT IGNORE INTO users (uid, password, role, name, email)
VALUES ('admin', '$2y$10$IICHg8y3y0ZLpVdjmbr.Nu7.FbUmwmdnzUzOI.DMORytFtutIICIy', 'admin', 'System Admin', 'admin@edu.bd');
