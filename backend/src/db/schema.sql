-- ============================================================
-- CampusPulse AI – Complete Database Schema
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE user_role AS ENUM ('student', 'faculty', 'mentor', 'hod', 'admin', 'principal');
CREATE TYPE gender_type AS ENUM ('male', 'female', 'other', 'prefer_not_to_say');
CREATE TYPE complaint_status AS ENUM ('submitted', 'assigned', 'in_progress', 'resolved', 'verified', 'closed');
CREATE TYPE complaint_priority AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'late', 'excused');
CREATE TYPE assignment_status AS ENUM ('draft', 'published', 'closed');
CREATE TYPE submission_status AS ENUM ('submitted', 'late', 'graded', 'resubmit');
CREATE TYPE event_status AS ENUM ('upcoming', 'ongoing', 'completed', 'cancelled');
CREATE TYPE maintenance_status AS ENUM ('operational', 'needs_maintenance', 'under_maintenance', 'decommissioned');
CREATE TYPE alert_level AS ENUM ('info', 'warning', 'critical', 'emergency');
CREATE TYPE risk_level AS ENUM ('low', 'moderate', 'high');
CREATE TYPE notification_type AS ENUM ('announcement', 'alert', 'reminder', 'ai_insight', 'complaint', 'event', 'emergency');
CREATE TYPE day_of_week AS ENUM ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday');
CREATE TYPE semester_type AS ENUM ('odd', 'even');

-- ============================================================
-- CORE USER TABLES
-- ============================================================

CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) NOT NULL UNIQUE,
    description TEXT,
    established_year INTEGER,
    hod_id UUID,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    gender gender_type,
    date_of_birth DATE,
    profile_image_url TEXT,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE,
    is_email_verified BOOLEAN DEFAULT FALSE,
    last_login TIMESTAMPTZ,
    password_changed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id UUID,
    ip_address INET,
    user_agent TEXT,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ACADEMIC STRUCTURE
-- ============================================================

CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) NOT NULL,
    code VARCHAR(20) NOT NULL UNIQUE,
    department_id UUID NOT NULL REFERENCES departments(id),
    duration_years INTEGER DEFAULT 4,
    total_semesters INTEGER DEFAULT 8,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL,
    course_id UUID NOT NULL REFERENCES courses(id),
    start_year INTEGER NOT NULL,
    end_year INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE sections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(10) NOT NULL,
    batch_id UUID NOT NULL REFERENCES batches(id),
    current_semester INTEGER NOT NULL DEFAULT 1,
    class_advisor_id UUID REFERENCES users(id),
    max_students INTEGER DEFAULT 60,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) NOT NULL,
    code VARCHAR(20) NOT NULL UNIQUE,
    department_id UUID NOT NULL REFERENCES departments(id),
    course_id UUID REFERENCES courses(id),
    semester INTEGER NOT NULL,
    credits INTEGER NOT NULL DEFAULT 3,
    hours_per_week INTEGER DEFAULT 3,
    is_lab BOOLEAN DEFAULT FALSE,
    syllabus_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    roll_number VARCHAR(30) NOT NULL UNIQUE,
    register_number VARCHAR(30) UNIQUE,
    batch_id UUID REFERENCES batches(id),
    section_id UUID REFERENCES sections(id),
    current_semester INTEGER DEFAULT 1,
    admission_date DATE,
    father_name VARCHAR(100),
    mother_name VARCHAR(100),
    guardian_phone VARCHAR(20),
    address TEXT,
    blood_group VARCHAR(5),
    is_hosteler BOOLEAN DEFAULT FALSE,
    transport_route VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE faculty (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    employee_id VARCHAR(30) NOT NULL UNIQUE,
    designation VARCHAR(100),
    qualification VARCHAR(200),
    specialization TEXT,
    joining_date DATE,
    experience_years INTEGER DEFAULT 0,
    is_mentor BOOLEAN DEFAULT FALSE,
    max_mentees INTEGER DEFAULT 20,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Set HOD reference after users table is created
ALTER TABLE departments ADD CONSTRAINT fk_departments_hod 
    FOREIGN KEY (hod_id) REFERENCES users(id) ON DELETE SET NULL;

CREATE TABLE enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id),
    subject_id UUID NOT NULL REFERENCES subjects(id),
    section_id UUID NOT NULL REFERENCES sections(id),
    semester INTEGER NOT NULL,
    academic_year VARCHAR(10) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, subject_id, academic_year)
);

CREATE TABLE faculty_subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    faculty_id UUID NOT NULL REFERENCES faculty(id),
    subject_id UUID NOT NULL REFERENCES subjects(id),
    section_id UUID NOT NULL REFERENCES sections(id),
    semester INTEGER NOT NULL,
    academic_year VARCHAR(10) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(faculty_id, subject_id, section_id, academic_year)
);

-- ============================================================
-- ATTENDANCE
-- ============================================================

CREATE TABLE timetable_slots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    section_id UUID NOT NULL REFERENCES sections(id),
    subject_id UUID NOT NULL REFERENCES subjects(id),
    faculty_id UUID NOT NULL REFERENCES faculty(id),
    day_of_week day_of_week NOT NULL,
    period_number INTEGER NOT NULL CHECK (period_number BETWEEN 1 AND 8),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    room_id UUID,
    semester INTEGER NOT NULL,
    academic_year VARCHAR(10) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE attendance_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    faculty_id UUID NOT NULL REFERENCES faculty(id),
    subject_id UUID NOT NULL REFERENCES subjects(id),
    section_id UUID NOT NULL REFERENCES sections(id),
    timetable_slot_id UUID REFERENCES timetable_slots(id),
    session_date DATE NOT NULL,
    period_number INTEGER NOT NULL,
    total_students INTEGER DEFAULT 0,
    present_count INTEGER DEFAULT 0,
    is_finalized BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(subject_id, section_id, session_date, period_number)
);

CREATE TABLE attendance_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES attendance_sessions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id),
    status attendance_status NOT NULL DEFAULT 'absent',
    marked_at TIMESTAMPTZ DEFAULT NOW(),
    remarks TEXT,
    UNIQUE(session_id, student_id)
);

-- ============================================================
-- MARKS & ASSESSMENTS
-- ============================================================

CREATE TABLE assessment_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) NOT NULL UNIQUE,
    max_marks INTEGER NOT NULL,
    weightage DECIMAL(5,2),
    description TEXT
);

CREATE TABLE marks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id),
    subject_id UUID NOT NULL REFERENCES subjects(id),
    assessment_type_id UUID NOT NULL REFERENCES assessment_types(id),
    semester INTEGER NOT NULL,
    academic_year VARCHAR(10) NOT NULL,
    marks_obtained DECIMAL(6,2),
    max_marks DECIMAL(6,2),
    grade VARCHAR(5),
    remarks TEXT,
    entered_by UUID REFERENCES users(id),
    entered_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, subject_id, assessment_type_id, semester, academic_year)
);

-- ============================================================
-- ASSIGNMENTS
-- ============================================================

CREATE TABLE assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    subject_id UUID NOT NULL REFERENCES subjects(id),
    faculty_id UUID NOT NULL REFERENCES faculty(id),
    section_id UUID NOT NULL REFERENCES sections(id),
    due_date TIMESTAMPTZ NOT NULL,
    max_marks INTEGER DEFAULT 10,
    attachment_url TEXT,
    status assignment_status DEFAULT 'published',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE assignment_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id),
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    content TEXT,
    file_url TEXT,
    marks_obtained DECIMAL(5,2),
    feedback TEXT,
    status submission_status DEFAULT 'submitted',
    graded_at TIMESTAMPTZ,
    graded_by UUID REFERENCES users(id),
    UNIQUE(assignment_id, student_id)
);

-- ============================================================
-- SYLLABUS TRACKING
-- ============================================================

CREATE TABLE syllabus_units (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subject_id UUID NOT NULL REFERENCES subjects(id),
    unit_number INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    topics TEXT[],
    total_hours INTEGER DEFAULT 5,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE syllabus_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    syllabus_unit_id UUID NOT NULL REFERENCES syllabus_units(id),
    faculty_id UUID NOT NULL REFERENCES faculty(id),
    section_id UUID NOT NULL REFERENCES sections(id),
    academic_year VARCHAR(10) NOT NULL,
    hours_completed INTEGER DEFAULT 0,
    completion_percentage DECIMAL(5,2) DEFAULT 0,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT,
    UNIQUE(syllabus_unit_id, faculty_id, section_id, academic_year)
);

-- ============================================================
-- MENTORING
-- ============================================================

CREATE TABLE mentor_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mentor_id UUID NOT NULL REFERENCES faculty(id),
    student_id UUID NOT NULL REFERENCES students(id),
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(mentor_id, student_id)
);

CREATE TABLE mentoring_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mentor_id UUID NOT NULL REFERENCES faculty(id),
    student_id UUID NOT NULL REFERENCES students(id),
    session_date DATE NOT NULL,
    duration_minutes INTEGER DEFAULT 30,
    discussion_points TEXT,
    action_items TEXT[],
    next_meeting_date DATE,
    is_private BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE mentor_follow_ups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES mentoring_sessions(id),
    mentor_id UUID NOT NULL REFERENCES faculty(id),
    student_id UUID NOT NULL REFERENCES students(id),
    task_description TEXT NOT NULL,
    due_date DATE,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SKILLS & CERTIFICATIONS
-- ============================================================

CREATE TABLE skill_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT
);

CREATE TABLE skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    category_id UUID REFERENCES skill_categories(id),
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE student_skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id),
    skill_id UUID NOT NULL REFERENCES skills(id),
    proficiency_level INTEGER CHECK (proficiency_level BETWEEN 1 AND 5) DEFAULT 1,
    verified_by UUID REFERENCES users(id),
    evidence_url TEXT,
    acquired_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, skill_id)
);

CREATE TABLE career_paths (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    department_id UUID REFERENCES departments(id),
    description TEXT,
    required_skills JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE certifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id),
    title VARCHAR(255) NOT NULL,
    issuing_organization VARCHAR(200),
    issue_date DATE,
    expiry_date DATE,
    credential_id VARCHAR(100),
    credential_url TEXT,
    certificate_file_url TEXT,
    skill_ids UUID[],
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    student_id UUID REFERENCES students(id),
    team_members UUID[],
    domain VARCHAR(100),
    technologies TEXT[],
    start_date DATE,
    end_date DATE,
    repository_url TEXT,
    demo_url TEXT,
    status VARCHAR(30) DEFAULT 'ongoing',
    guide_faculty_id UUID REFERENCES faculty(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- STUDY PLANNER
-- ============================================================

CREATE TABLE study_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id),
    title VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    exam_date DATE,
    daily_study_hours DECIMAL(4,2),
    is_ai_generated BOOLEAN DEFAULT FALSE,
    ai_generation_context JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE study_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_id UUID NOT NULL REFERENCES study_plans(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES subjects(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    scheduled_date DATE NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    priority INTEGER CHECK (priority BETWEEN 1 AND 5) DEFAULT 3,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- COMPLAINTS
-- ============================================================

CREATE TABLE complaint_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(30) NOT NULL UNIQUE,
    description TEXT,
    default_assignee_role user_role,
    sla_hours INTEGER DEFAULT 48
);

CREATE TABLE campus_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) NOT NULL,
    code VARCHAR(30),
    type VARCHAR(50),
    block VARCHAR(50),
    floor INTEGER,
    capacity INTEGER,
    description TEXT,
    map_coordinates JSONB,
    is_accessible BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE complaints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_number VARCHAR(20) NOT NULL UNIQUE,
    submitted_by UUID NOT NULL REFERENCES users(id),
    category_id UUID NOT NULL REFERENCES complaint_categories(id),
    location_id UUID REFERENCES campus_locations(id),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status complaint_status DEFAULT 'submitted',
    priority complaint_priority DEFAULT 'medium',
    assigned_to UUID REFERENCES users(id),
    attachment_urls TEXT[],
    voice_recording_url TEXT,
    ai_classification JSONB,
    is_anonymous BOOLEAN DEFAULT FALSE,
    is_duplicate BOOLEAN DEFAULT FALSE,
    parent_complaint_id UUID REFERENCES complaints(id),
    resolved_at TIMESTAMPTZ,
    resolution_notes TEXT,
    satisfaction_rating INTEGER CHECK (satisfaction_rating BETWEEN 1 AND 5),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE complaint_updates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    complaint_id UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    updated_by UUID NOT NULL REFERENCES users(id),
    old_status complaint_status,
    new_status complaint_status,
    message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- EQUIPMENT & MAINTENANCE
-- ============================================================

CREATE TABLE equipment_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT
);

CREATE TABLE equipment (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    asset_tag VARCHAR(50) UNIQUE,
    category_id UUID REFERENCES equipment_categories(id),
    location_id UUID REFERENCES campus_locations(id),
    brand VARCHAR(100),
    model VARCHAR(100),
    serial_number VARCHAR(100),
    purchase_date DATE,
    purchase_cost DECIMAL(12,2),
    warranty_expiry DATE,
    status maintenance_status DEFAULT 'operational',
    last_maintenance_date DATE,
    next_maintenance_date DATE,
    maintenance_frequency_days INTEGER DEFAULT 180,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE maintenance_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    equipment_id UUID NOT NULL REFERENCES equipment(id),
    maintenance_type VARCHAR(50),
    description TEXT,
    performed_by VARCHAR(200),
    cost DECIMAL(10,2),
    downtime_hours DECIMAL(6,2),
    issue_date DATE,
    resolved_date DATE,
    parts_replaced TEXT[],
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- EVENTS
-- ============================================================

CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_type VARCHAR(50),
    department_id UUID REFERENCES departments(id),
    organized_by UUID NOT NULL REFERENCES users(id),
    venue_id UUID REFERENCES campus_locations(id),
    start_datetime TIMESTAMPTZ NOT NULL,
    end_datetime TIMESTAMPTZ NOT NULL,
    registration_deadline TIMESTAMPTZ,
    max_participants INTEGER,
    status event_status DEFAULT 'upcoming',
    banner_url TEXT,
    qr_code_url TEXT,
    is_college_wide BOOLEAN DEFAULT FALSE,
    target_roles user_role[],
    target_departments UUID[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE event_registrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    registered_at TIMESTAMPTZ DEFAULT NOW(),
    attendance_marked BOOLEAN DEFAULT FALSE,
    attendance_marked_at TIMESTAMPTZ,
    qr_scanned BOOLEAN DEFAULT FALSE,
    certificate_issued BOOLEAN DEFAULT FALSE,
    UNIQUE(event_id, user_id)
);

CREATE TABLE event_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id),
    user_id UUID NOT NULL REFERENCES users(id),
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    feedback_text TEXT,
    ai_sentiment VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(event_id, user_id)
);

-- ============================================================
-- CLUBS
-- ============================================================

CREATE TABLE clubs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) NOT NULL UNIQUE,
    description TEXT,
    category VARCHAR(50),
    faculty_advisor_id UUID REFERENCES faculty(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE club_memberships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID NOT NULL REFERENCES clubs(id),
    student_id UUID NOT NULL REFERENCES students(id),
    role VARCHAR(50) DEFAULT 'member',
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(club_id, student_id)
);

-- ============================================================
-- ANNOUNCEMENTS & NOTIFICATIONS
-- ============================================================

CREATE TABLE announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    created_by UUID NOT NULL REFERENCES users(id),
    target_roles user_role[],
    target_departments UUID[],
    target_sections UUID[],
    target_batches UUID[],
    is_college_wide BOOLEAN DEFAULT FALSE,
    is_urgent BOOLEAN DEFAULT FALSE,
    attachment_url TEXT,
    published_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    reference_id UUID,
    reference_type VARCHAR(50),
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    action_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- MEETINGS
-- ============================================================

CREATE TABLE meeting_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    meeting_date TIMESTAMPTZ NOT NULL,
    department_id UUID REFERENCES departments(id),
    organized_by UUID NOT NULL REFERENCES users(id),
    attendees UUID[],
    transcript_url TEXT,
    audio_url TEXT,
    raw_notes TEXT,
    ai_summary JSONB,
    ai_action_items JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE meeting_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    meeting_id UUID NOT NULL REFERENCES meeting_records(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    assigned_to UUID REFERENCES users(id),
    due_date DATE,
    priority complaint_priority DEFAULT 'medium',
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SUSTAINABILITY
-- ============================================================

CREATE TABLE sustainability_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    record_date DATE NOT NULL,
    department_id UUID REFERENCES departments(id),
    location_id UUID REFERENCES campus_locations(id),
    electricity_kwh DECIMAL(10,2),
    water_litres DECIMAL(12,2),
    waste_kg DECIMAL(10,2),
    recycled_kg DECIMAL(10,2),
    paper_reams DECIMAL(8,2),
    recorded_by UUID REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- AI & INTELLIGENCE TABLES
-- ============================================================

CREATE TABLE risk_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id),
    risk_level risk_level NOT NULL,
    risk_factors JSONB NOT NULL,
    recommendation TEXT,
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    acknowledged_by UUID REFERENCES users(id),
    acknowledged_at TIMESTAMPTZ,
    resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMPTZ,
    follow_up_notes TEXT,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE ai_insights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    insight_type VARCHAR(50) NOT NULL,
    target_type VARCHAR(50),
    target_id UUID,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    data_snapshot JSONB,
    severity alert_level DEFAULT 'info',
    is_acknowledged BOOLEAN DEFAULT FALSE,
    acknowledged_by UUID REFERENCES users(id),
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE emergency_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    alert_type VARCHAR(50),
    severity alert_level DEFAULT 'critical',
    created_by UUID NOT NULL REFERENCES users(id),
    affected_locations UUID[],
    target_roles user_role[],
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    deactivated_at TIMESTAMPTZ
);

-- ============================================================
-- INDEXES
-- ============================================================

-- Users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_department ON users(department_id);
CREATE INDEX idx_users_deleted_at ON users(deleted_at) WHERE deleted_at IS NULL;

-- Students
CREATE INDEX idx_students_user_id ON students(user_id);
CREATE INDEX idx_students_roll_number ON students(roll_number);
CREATE INDEX idx_students_batch ON students(batch_id);
CREATE INDEX idx_students_section ON students(section_id);

-- Attendance
CREATE INDEX idx_attendance_sessions_date ON attendance_sessions(session_date);
CREATE INDEX idx_attendance_sessions_subject ON attendance_sessions(subject_id);
CREATE INDEX idx_attendance_records_student ON attendance_records(student_id);
CREATE INDEX idx_attendance_records_session ON attendance_records(session_id);
CREATE INDEX idx_attendance_records_status ON attendance_records(status);

-- Marks
CREATE INDEX idx_marks_student ON marks(student_id);
CREATE INDEX idx_marks_subject ON marks(subject_id);
CREATE INDEX idx_marks_semester ON marks(semester);

-- Assignments
CREATE INDEX idx_assignments_subject ON assignments(subject_id);
CREATE INDEX idx_assignments_faculty ON assignments(faculty_id);
CREATE INDEX idx_assignments_due_date ON assignments(due_date);
CREATE INDEX idx_submissions_student ON assignment_submissions(student_id);
CREATE INDEX idx_submissions_assignment ON assignment_submissions(assignment_id);

-- Complaints
CREATE INDEX idx_complaints_status ON complaints(status);
CREATE INDEX idx_complaints_submitted_by ON complaints(submitted_by);
CREATE INDEX idx_complaints_category ON complaints(category_id);
CREATE INDEX idx_complaints_priority ON complaints(priority);
CREATE INDEX idx_complaints_created_at ON complaints(created_at);

-- Events
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_start_datetime ON events(start_datetime);
CREATE INDEX idx_event_registrations_user ON event_registrations(user_id);

-- Notifications
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read) WHERE is_read = FALSE;

-- Risk Alerts
CREATE INDEX idx_risk_alerts_student ON risk_alerts(student_id);
CREATE INDEX idx_risk_alerts_active ON risk_alerts(is_active) WHERE is_active = TRUE;

-- AI Insights
CREATE INDEX idx_ai_insights_type ON ai_insights(insight_type);
CREATE INDEX idx_ai_insights_generated_at ON ai_insights(generated_at);

-- ============================================================
-- TRIGGER: updated_at auto-update
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON departments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sections_updated_at BEFORE UPDATE ON sections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_faculty_updated_at BEFORE UPDATE ON faculty FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_marks_updated_at BEFORE UPDATE ON marks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_assignments_updated_at BEFORE UPDATE ON assignments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_complaints_updated_at BEFORE UPDATE ON complaints FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_equipment_updated_at BEFORE UPDATE ON equipment FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_meeting_records_updated_at BEFORE UPDATE ON meeting_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
