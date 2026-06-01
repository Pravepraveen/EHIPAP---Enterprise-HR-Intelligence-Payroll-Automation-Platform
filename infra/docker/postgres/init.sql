-- ============================================================
-- EHIPAP Enterprise HR Platform - Database Initialization
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── USERS & AUTH ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'EMPLOYEE',
    is_active BOOLEAN DEFAULT TRUE,
    mfa_enabled BOOLEAN DEFAULT FALSE,
    mfa_secret VARCHAR(255),
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(500) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ─── DEPARTMENTS ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    description TEXT,
    manager_id UUID,
    parent_id UUID,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ─── EMPLOYEES ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    employee_code VARCHAR(20) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    date_of_birth DATE,
    gender VARCHAR(10),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100) DEFAULT 'India',
    pincode VARCHAR(10),
    department_id UUID REFERENCES departments(id),
    designation VARCHAR(100),
    employment_type VARCHAR(50) DEFAULT 'FULL_TIME',
    joining_date DATE NOT NULL,
    confirmation_date DATE,
    exit_date DATE,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    manager_id UUID,
    basic_salary DECIMAL(15,2) DEFAULT 0,
    pan_number VARCHAR(20),
    aadhar_number VARCHAR(20),
    bank_account VARCHAR(30),
    bank_name VARCHAR(100),
    ifsc_code VARCHAR(20),
    profile_photo_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ─── ATTENDANCE ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES employees(id),
    attendance_date DATE NOT NULL,
    check_in TIMESTAMP,
    check_out TIMESTAMP,
    status VARCHAR(20) DEFAULT 'PRESENT',
    work_hours DECIMAL(5,2),
    overtime_hours DECIMAL(5,2) DEFAULT 0,
    location VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(employee_id, attendance_date)
);

-- ─── LEAVE MANAGEMENT ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS leave_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    max_days_per_year INTEGER DEFAULT 0,
    is_paid BOOLEAN DEFAULT TRUE,
    carry_forward BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS leave_balances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES employees(id),
    leave_type_id UUID REFERENCES leave_types(id),
    year INTEGER NOT NULL,
    total_days DECIMAL(5,2) DEFAULT 0,
    used_days DECIMAL(5,2) DEFAULT 0,
    pending_days DECIMAL(5,2) DEFAULT 0,
    UNIQUE(employee_id, leave_type_id, year)
);

CREATE TABLE IF NOT EXISTS leave_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES employees(id),
    leave_type_id UUID REFERENCES leave_types(id),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_days DECIMAL(5,2) NOT NULL,
    reason TEXT,
    status VARCHAR(20) DEFAULT 'PENDING',
    approved_by UUID,
    approved_at TIMESTAMP,
    rejection_reason TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ─── SALARY & PAYROLL ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS salary_structures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES employees(id) UNIQUE,
    basic_salary DECIMAL(15,2) NOT NULL,
    hra_percent DECIMAL(5,2) DEFAULT 40,
    da_percent DECIMAL(5,2) DEFAULT 10,
    ta_amount DECIMAL(10,2) DEFAULT 1600,
    medical_allowance DECIMAL(10,2) DEFAULT 1250,
    special_allowance DECIMAL(10,2) DEFAULT 0,
    pf_employee_percent DECIMAL(5,2) DEFAULT 12,
    pf_employer_percent DECIMAL(5,2) DEFAULT 12,
    esi_employee_percent DECIMAL(5,2) DEFAULT 0.75,
    esi_employer_percent DECIMAL(5,2) DEFAULT 3.25,
    professional_tax DECIMAL(10,2) DEFAULT 200,
    effective_from DATE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payroll_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'DRAFT',
    total_employees INTEGER DEFAULT 0,
    total_gross DECIMAL(15,2) DEFAULT 0,
    total_deductions DECIMAL(15,2) DEFAULT 0,
    total_net DECIMAL(15,2) DEFAULT 0,
    processed_by UUID,
    processed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(month, year)
);

CREATE TABLE IF NOT EXISTS payslips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payroll_run_id UUID REFERENCES payroll_runs(id),
    employee_id UUID REFERENCES employees(id),
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    working_days INTEGER DEFAULT 26,
    present_days DECIMAL(5,2) DEFAULT 26,
    basic_salary DECIMAL(15,2) DEFAULT 0,
    hra DECIMAL(15,2) DEFAULT 0,
    da DECIMAL(15,2) DEFAULT 0,
    ta DECIMAL(15,2) DEFAULT 0,
    medical_allowance DECIMAL(15,2) DEFAULT 0,
    special_allowance DECIMAL(15,2) DEFAULT 0,
    gross_salary DECIMAL(15,2) DEFAULT 0,
    pf_employee DECIMAL(15,2) DEFAULT 0,
    pf_employer DECIMAL(15,2) DEFAULT 0,
    esi_employee DECIMAL(15,2) DEFAULT 0,
    esi_employer DECIMAL(15,2) DEFAULT 0,
    professional_tax DECIMAL(15,2) DEFAULT 0,
    income_tax DECIMAL(15,2) DEFAULT 0,
    total_deductions DECIMAL(15,2) DEFAULT 0,
    net_salary DECIMAL(15,2) DEFAULT 0,
    payslip_url VARCHAR(500),
    status VARCHAR(20) DEFAULT 'GENERATED',
    created_at TIMESTAMP DEFAULT NOW()
);

-- ─── RECRUITMENT ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS job_postings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200) NOT NULL,
    department_id UUID REFERENCES departments(id),
    description TEXT,
    requirements TEXT,
    location VARCHAR(200),
    employment_type VARCHAR(50),
    experience_min INTEGER DEFAULT 0,
    experience_max INTEGER DEFAULT 10,
    salary_min DECIMAL(15,2),
    salary_max DECIMAL(15,2),
    openings INTEGER DEFAULT 1,
    status VARCHAR(20) DEFAULT 'OPEN',
    posted_by UUID,
    closing_date DATE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS candidates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_posting_id UUID REFERENCES job_postings(id),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    resume_url VARCHAR(500),
    current_company VARCHAR(200),
    current_designation VARCHAR(200),
    experience_years DECIMAL(4,1),
    current_salary DECIMAL(15,2),
    expected_salary DECIMAL(15,2),
    stage VARCHAR(50) DEFAULT 'APPLIED',
    status VARCHAR(20) DEFAULT 'ACTIVE',
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ─── PERFORMANCE ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS performance_cycles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS performance_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cycle_id UUID REFERENCES performance_cycles(id),
    employee_id UUID REFERENCES employees(id),
    reviewer_id UUID,
    self_rating DECIMAL(3,1),
    manager_rating DECIMAL(3,1),
    final_rating DECIMAL(3,1),
    goals_achieved INTEGER DEFAULT 0,
    total_goals INTEGER DEFAULT 0,
    strengths TEXT,
    improvements TEXT,
    comments TEXT,
    status VARCHAR(20) DEFAULT 'PENDING',
    submitted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES employees(id),
    cycle_id UUID REFERENCES performance_cycles(id),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    target_date DATE,
    weight DECIMAL(5,2) DEFAULT 100,
    progress INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'IN_PROGRESS',
    created_at TIMESTAMP DEFAULT NOW()
);

-- ─── NOTIFICATIONS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'INFO',
    is_read BOOLEAN DEFAULT FALSE,
    action_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT NOW()
);

-- ─── AUDIT LOG ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100),
    entity_id VARCHAR(100),
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ─── INDEXES ──────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_employees_dept ON employees(department_id);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);
CREATE INDEX IF NOT EXISTS idx_employees_email ON employees(email);
CREATE INDEX IF NOT EXISTS idx_attendance_emp_date ON attendance(employee_id, attendance_date);
CREATE INDEX IF NOT EXISTS idx_leave_req_emp ON leave_requests(employee_id, status);
CREATE INDEX IF NOT EXISTS idx_payslips_emp ON payslips(employee_id, year, month);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_candidates_job ON candidates(job_posting_id, stage);

-- ─── DEMO USERS ───────────────────────────────────────────────────
-- Passwords: Admin@123 | HRManager@123 | Employee@123
-- All hashed with BCrypt strength 12
INSERT INTO users (id, username, email, password_hash, role) VALUES
  ('00000000-0000-0000-0000-000000000001','superadmin','admin@ehipap.com',
   '$2a$12$9/v4xaCJsELI2GunL6v.PeqLj08HfOh3oJ9TgWtDrB8Usx8GPVNfC','SUPER_ADMIN'),
  ('00000000-0000-0000-0000-000000000002','hrmanager','hr@ehipap.com',
   '$2a$12$r977PKnSIeVE62T1KiBUA.NgAK2Keoe5vc/CNU8CTw.XjGdE1KWJC','HR_MANAGER'),
  ('00000000-0000-0000-0000-000000000003','john.doe','john.doe@ehipap.com',
   '$2a$12$WUS.9hU4wmoRdIzrsMMHZe3ELgagnS1jO8bvlxBqdAlrfgYNOIafa','EMPLOYEE')
ON CONFLICT (username) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  role = EXCLUDED.role,
  email = EXCLUDED.email;

-- ─── DEPARTMENTS ──────────────────────────────────────────────────
INSERT INTO departments (id, name, code, description) VALUES
  ('10000000-0000-0000-0000-000000000001','Engineering','ENG','Software Engineering'),
  ('10000000-0000-0000-0000-000000000002','Human Resources','HR','HR Department'),
  ('10000000-0000-0000-0000-000000000003','Finance','FIN','Finance & Accounts'),
  ('10000000-0000-0000-0000-000000000004','Marketing','MKT','Marketing & Sales'),
  ('10000000-0000-0000-0000-000000000005','Operations','OPS','Operations')
ON CONFLICT (code) DO NOTHING;

-- ─── EMPLOYEES ────────────────────────────────────────────────────
INSERT INTO employees (id,user_id,employee_code,first_name,last_name,email,phone,
    department_id,designation,joining_date,status,basic_salary,employment_type) VALUES
  ('20000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001',
   'EMP001','Super','Admin','admin@ehipap.com','+91-9000000001',
   '10000000-0000-0000-0000-000000000002','System Administrator','2020-01-01','ACTIVE',150000,'FULL_TIME'),
  ('20000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000002',
   'EMP002','HR','Manager','hr@ehipap.com','+91-9000000002',
   '10000000-0000-0000-0000-000000000002','HR Manager','2020-03-01','ACTIVE',80000,'FULL_TIME'),
  ('20000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000003',
   'EMP003','John','Doe','john.doe@ehipap.com','+91-9000000003',
   '10000000-0000-0000-0000-000000000001','Senior Software Engineer','2021-06-01','ACTIVE',60000,'FULL_TIME'),
  ('20000000-0000-0000-0000-000000000004',NULL,
   'EMP004','Jane','Smith','jane.smith@ehipap.com','+91-9000000004',
   '10000000-0000-0000-0000-000000000001','Software Engineer','2022-01-15','ACTIVE',50000,'FULL_TIME'),
  ('20000000-0000-0000-0000-000000000005',NULL,
   'EMP005','Raj','Kumar','raj.kumar@ehipap.com','+91-9000000005',
   '10000000-0000-0000-0000-000000000003','Finance Analyst','2021-09-01','ACTIVE',55000,'FULL_TIME'),
  ('20000000-0000-0000-0000-000000000006',NULL,
   'EMP006','Priya','Sharma','priya.sharma@ehipap.com','+91-9000000006',
   '10000000-0000-0000-0000-000000000004','Marketing Manager','2020-11-01','ACTIVE',65000,'FULL_TIME'),
  ('20000000-0000-0000-0000-000000000007',NULL,
   'EMP007','Amit','Patel','amit.patel@ehipap.com','+91-9000000007',
   '10000000-0000-0000-0000-000000000001','Tech Lead','2019-05-01','ACTIVE',90000,'FULL_TIME'),
  ('20000000-0000-0000-0000-000000000008',NULL,
   'EMP008','Sneha','Gupta','sneha.gupta@ehipap.com','+91-9000000008',
   '10000000-0000-0000-0000-000000000005','Operations Manager','2020-07-01','ACTIVE',70000,'FULL_TIME'),
  ('20000000-0000-0000-0000-000000000009',NULL,
   'EMP009','Vikram','Singh','vikram.singh@ehipap.com','+91-9000000009',
   '10000000-0000-0000-0000-000000000001','DevOps Engineer','2022-03-01','ACTIVE',75000,'FULL_TIME'),
  ('20000000-0000-0000-0000-000000000010',NULL,
   'EMP010','Kavya','Nair','kavya.nair@ehipap.com','+91-9000000010',
   '10000000-0000-0000-0000-000000000003','Senior Accountant','2021-01-10','ACTIVE',58000,'FULL_TIME')
ON CONFLICT (employee_code) DO NOTHING;

-- ─── LEAVE TYPES ──────────────────────────────────────────────────
INSERT INTO leave_types (id,name,code,max_days_per_year,is_paid,carry_forward) VALUES
  ('30000000-0000-0000-0000-000000000001','Casual Leave','CL',12,TRUE,FALSE),
  ('30000000-0000-0000-0000-000000000002','Sick Leave','SL',12,TRUE,FALSE),
  ('30000000-0000-0000-0000-000000000003','Earned Leave','EL',21,TRUE,TRUE),
  ('30000000-0000-0000-0000-000000000004','Maternity Leave','ML',180,TRUE,FALSE),
  ('30000000-0000-0000-0000-000000000005','Paternity Leave','PL',15,TRUE,FALSE)
ON CONFLICT (code) DO NOTHING;

-- ─── SALARY STRUCTURES ────────────────────────────────────────────
INSERT INTO salary_structures (employee_id,basic_salary,hra_percent,da_percent,ta_amount,
    medical_allowance,special_allowance,effective_from) VALUES
  ('20000000-0000-0000-0000-000000000001',150000,40,10,3200,1250,5000,'2020-01-01'),
  ('20000000-0000-0000-0000-000000000002',80000,40,10,1600,1250,2000,'2020-03-01'),
  ('20000000-0000-0000-0000-000000000003',60000,40,10,1600,1250,1500,'2021-06-01'),
  ('20000000-0000-0000-0000-000000000004',50000,40,10,1600,1250,1000,'2022-01-15'),
  ('20000000-0000-0000-0000-000000000005',55000,40,10,1600,1250,1200,'2021-09-01'),
  ('20000000-0000-0000-0000-000000000006',65000,40,10,1600,1250,1800,'2020-11-01'),
  ('20000000-0000-0000-0000-000000000007',90000,40,10,1600,1250,3000,'2019-05-01'),
  ('20000000-0000-0000-0000-000000000008',70000,40,10,1600,1250,2000,'2020-07-01'),
  ('20000000-0000-0000-0000-000000000009',75000,40,10,1600,1250,2500,'2022-03-01'),
  ('20000000-0000-0000-0000-000000000010',58000,40,10,1600,1250,1300,'2021-01-10')
ON CONFLICT (employee_id) DO NOTHING;

-- ─── LEAVE BALANCES ───────────────────────────────────────────────
INSERT INTO leave_balances (employee_id,leave_type_id,year,total_days,used_days,pending_days)
SELECT e.id, lt.id, EXTRACT(YEAR FROM NOW())::INTEGER, lt.max_days_per_year, 0, 0
FROM employees e CROSS JOIN leave_types lt
ON CONFLICT (employee_id,leave_type_id,year) DO NOTHING;

-- ─── SAMPLE ATTENDANCE (last 30 working days) ─────────────────────
INSERT INTO attendance (employee_id,attendance_date,check_in,check_out,status,work_hours)
SELECT e.id, d.day::DATE,
    (d.day::DATE + INTERVAL '9 hours' + (random()*INTERVAL '30 minutes'))::TIMESTAMP,
    (d.day::DATE + INTERVAL '18 hours' + (random()*INTERVAL '60 minutes'))::TIMESTAMP,
    'PRESENT', 8 + random()*2
FROM employees e
CROSS JOIN generate_series(CURRENT_DATE-INTERVAL '30 days', CURRENT_DATE-INTERVAL '1 day', INTERVAL '1 day') AS d(day)
WHERE EXTRACT(DOW FROM d.day) NOT IN (0,6)
ON CONFLICT (employee_id,attendance_date) DO NOTHING;

-- ─── PAYROLL RUNS ─────────────────────────────────────────────────
INSERT INTO payroll_runs (id,month,year,status,total_employees,total_gross,total_deductions,total_net,processed_at)
VALUES
  ('50000000-0000-0000-0000-000000000001',3,2025,'PROCESSED',10,763000,91560,671440,NOW()-INTERVAL '60 days'),
  ('50000000-0000-0000-0000-000000000002',4,2025,'PROCESSED',10,763000,91560,671440,NOW()-INTERVAL '30 days'),
  ('50000000-0000-0000-0000-000000000003',5,2025,'DRAFT',10,0,0,0,NULL)
ON CONFLICT (month,year) DO NOTHING;

-- ─── SAMPLE PAYSLIPS ──────────────────────────────────────────────
INSERT INTO payslips (payroll_run_id,employee_id,month,year,working_days,present_days,
    basic_salary,hra,da,ta,medical_allowance,special_allowance,gross_salary,
    pf_employee,pf_employer,esi_employee,esi_employer,professional_tax,income_tax,
    total_deductions,net_salary,status)
SELECT
    '50000000-0000-0000-0000-000000000002',
    ss.employee_id, 4, 2025, 26, 26,
    ss.basic_salary,
    ROUND(ss.basic_salary * ss.hra_percent/100, 2),
    ROUND(ss.basic_salary * ss.da_percent/100, 2),
    ss.ta_amount,
    ss.medical_allowance,
    ss.special_allowance,
    ROUND(ss.basic_salary + ss.basic_salary*ss.hra_percent/100 + ss.basic_salary*ss.da_percent/100 + ss.ta_amount + ss.medical_allowance + ss.special_allowance, 2),
    ROUND(ss.basic_salary * ss.pf_employee_percent/100, 2),
    ROUND(ss.basic_salary * ss.pf_employer_percent/100, 2),
    ROUND((ss.basic_salary + ss.basic_salary*ss.hra_percent/100 + ss.basic_salary*ss.da_percent/100) * ss.esi_employee_percent/100, 2),
    ROUND((ss.basic_salary + ss.basic_salary*ss.hra_percent/100 + ss.basic_salary*ss.da_percent/100) * ss.esi_employer_percent/100, 2),
    ss.professional_tax,
    0,
    ROUND(ss.basic_salary*ss.pf_employee_percent/100 + (ss.basic_salary+ss.basic_salary*ss.hra_percent/100+ss.basic_salary*ss.da_percent/100)*ss.esi_employee_percent/100 + ss.professional_tax, 2),
    ROUND(ss.basic_salary + ss.basic_salary*ss.hra_percent/100 + ss.basic_salary*ss.da_percent/100 + ss.ta_amount + ss.medical_allowance + ss.special_allowance - (ss.basic_salary*ss.pf_employee_percent/100 + (ss.basic_salary+ss.basic_salary*ss.hra_percent/100+ss.basic_salary*ss.da_percent/100)*ss.esi_employee_percent/100 + ss.professional_tax), 2),
    'GENERATED'
FROM salary_structures ss;

-- ─── JOB POSTINGS ─────────────────────────────────────────────────
INSERT INTO job_postings (title,department_id,description,requirements,location,employment_type,
    experience_min,experience_max,salary_min,salary_max,openings,status,closing_date) VALUES
  ('Senior Java Developer','10000000-0000-0000-0000-000000000001',
   'We are looking for an experienced Java developer to join our engineering team.',
   'Java 11+, Spring Boot, Microservices, 5+ years experience',
   'Bangalore','FULL_TIME',5,10,800000,1500000,2,'OPEN',CURRENT_DATE+30),
  ('React Frontend Developer','10000000-0000-0000-0000-000000000001',
   'Frontend developer with React expertise needed.',
   'React, TypeScript, Redux, 3+ years experience',
   'Mumbai','FULL_TIME',3,7,600000,1200000,1,'OPEN',CURRENT_DATE+45),
  ('HR Business Partner','10000000-0000-0000-0000-000000000002',
   'HRBP to support business units.',
   'HR experience, communication skills, 4+ years',
   'Delhi','FULL_TIME',4,8,700000,1000000,1,'OPEN',CURRENT_DATE+20),
  ('DevOps Engineer','10000000-0000-0000-0000-000000000001',
   'DevOps engineer for cloud infrastructure.',
   'AWS, Docker, Kubernetes, CI/CD, 3+ years',
   'Hyderabad','FULL_TIME',3,8,700000,1300000,1,'OPEN',CURRENT_DATE+35);

-- ─── CANDIDATES ───────────────────────────────────────────────────
INSERT INTO candidates (job_posting_id,first_name,last_name,email,phone,experience_years,
    current_salary,expected_salary,stage,current_company,current_designation)
SELECT jp.id,
    fn.name, ln.name,
    lower(fn.name)||'.'||lower(ln.name)||seq.n||'@gmail.com',
    '+91-98'||(10000000+floor(random()*89999999))::TEXT,
    (2+random()*8)::DECIMAL(4,1),
    (400000+random()*800000)::DECIMAL(15,2),
    (600000+random()*1000000)::DECIMAL(15,2),
    st.stage, comp.name, desg.name
FROM job_postings jp
CROSS JOIN (VALUES ('Arjun'),('Kavya'),('Rohit'),('Deepa'),('Vikram'),('Anita'),('Suresh')) AS fn(name)
CROSS JOIN (VALUES ('Nair'),('Reddy'),('Singh'),('Mehta'),('Joshi')) AS ln(name)
CROSS JOIN (VALUES ('APPLIED'),('SCREENING'),('INTERVIEW'),('OFFER')) AS st(stage)
CROSS JOIN (VALUES ('TCS'),('Infosys'),('Wipro'),('HCL'),('Tech Mahindra')) AS comp(name)
CROSS JOIN (VALUES ('Software Engineer'),('Senior Developer'),('Tech Lead'),('Manager')) AS desg(name)
CROSS JOIN (SELECT generate_series(1,1) AS n) AS seq
LIMIT 25;

-- ─── PERFORMANCE CYCLE ────────────────────────────────────────────
INSERT INTO performance_cycles (id,name,start_date,end_date,status) VALUES
  ('40000000-0000-0000-0000-000000000001','Annual Review 2024','2024-01-01','2024-12-31','COMPLETED'),
  ('40000000-0000-0000-0000-000000000002','Annual Review 2025','2025-01-01','2025-12-31','ACTIVE')
ON CONFLICT DO NOTHING;

-- ─── NOTIFICATIONS ────────────────────────────────────────────────
INSERT INTO notifications (user_id,title,message,type) VALUES
  ('00000000-0000-0000-0000-000000000001','Welcome to EHIPAP','Welcome to the Enterprise HR Intelligence Platform!','INFO'),
  ('00000000-0000-0000-0000-000000000001','System Ready','All services are running successfully.','SUCCESS'),
  ('00000000-0000-0000-0000-000000000002','Payroll Processed','April 2025 payroll has been processed successfully.','SUCCESS'),
  ('00000000-0000-0000-0000-000000000002','New Applications','5 new candidates applied for Senior Java Developer.','INFO'),
  ('00000000-0000-0000-0000-000000000002','Leave Request Pending','3 leave requests are pending your approval.','WARNING'),
  ('00000000-0000-0000-0000-000000000003','Leave Approved','Your casual leave request has been approved.','SUCCESS'),
  ('00000000-0000-0000-0000-000000000003','Payslip Available','Your April 2025 payslip is now available.','INFO'),
  ('00000000-0000-0000-0000-000000000003','Performance Review','Your Q1 performance review is due by June 30.','WARNING');
