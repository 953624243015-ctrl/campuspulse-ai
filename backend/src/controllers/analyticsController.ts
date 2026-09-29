import { Response } from 'express';
import axios from 'axios';
import { AuthenticatedRequest } from '../types';
import { query } from '../db/pool';
import { sendSuccess, sendError } from '../utils/response';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

// GET /api/ai/risk-alerts
export const getRiskAlerts = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const deptFilter = req.user!.role === 'hod' ? req.user!.departmentId : null;

    let sql = `
      SELECT ra.id, ra.risk_level, ra.risk_factors, ra.recommendation,
             ra.generated_at, ra.acknowledged_at, ra.follow_up_notes, ra.is_active,
             u.first_name, u.last_name, s.roll_number, s.id as student_id,
             d.name as dept_name, sec.name as section_name
      FROM risk_alerts ra
      JOIN students s ON ra.student_id = s.id
      JOIN users u ON s.user_id = u.id
      LEFT JOIN departments d ON u.department_id = d.id
      LEFT JOIN sections sec ON s.section_id = sec.id
      WHERE ra.is_active = TRUE
    `;
    const params: unknown[] = [];

    if (deptFilter) {
      sql += ` AND u.department_id = $1`;
      params.push(deptFilter);
    }

    sql += ` ORDER BY CASE ra.risk_level WHEN 'high' THEN 1 WHEN 'moderate' THEN 2 ELSE 3 END, ra.generated_at DESC`;

    const result = await query(sql, params);
    sendSuccess(res, result.rows);
  } catch {
    sendError(res, 'Failed to fetch risk alerts', 500);
  }
};

// POST /api/ai/study-plan/generate
export const generateStudyPlan = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const sr = await query('SELECT id, current_semester FROM students WHERE user_id = $1', [req.user!.userId]);
    if (!sr.rows.length) { sendError(res, 'Student not found', 404); return; }

    const { examDate, dailyStudyHours, weakTopics, subjects } = req.body;

    // Get enrolled subjects
    const enrolledSubjects = await query(
      `SELECT sub.id, sub.name, sub.code, sub.credits
       FROM enrollments e
       JOIN subjects sub ON e.subject_id = sub.id
       WHERE e.student_id = $1 AND e.semester = $2 AND e.is_active = TRUE`,
      [sr.rows[0].id, sr.rows[0].current_semester]
    );

    // Get marks to identify weak subjects
    const marks = await query(
      `SELECT sub.code, ROUND(AVG(m.marks_obtained / NULLIF(m.max_marks,0) * 100)::numeric,1) as avg_pct
       FROM marks m JOIN subjects sub ON m.subject_id = sub.id
       WHERE m.student_id = $1 AND m.semester = $2
       GROUP BY sub.code`,
      [sr.rows[0].id, sr.rows[0].current_semester]
    );

    try {
      const aiResponse = await axios.post(`${AI_SERVICE_URL}/study-plan/generate`, {
        studentId: sr.rows[0].id,
        semester: sr.rows[0].current_semester,
        subjects: subjects || enrolledSubjects.rows,
        marksData: marks.rows,
        examDate,
        dailyStudyHours: dailyStudyHours || 4,
        weakTopics: weakTopics || [],
      }, { timeout: 10000 });

      sendSuccess(res, aiResponse.data);
    } catch {
      // Fallback: generate a basic plan without AI service
      const startDate = new Date();
      const endDate = examDate ? new Date(examDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      const tasks: unknown[] = [];

      const subList = subjects || enrolledSubjects.rows;
      let taskDate = new Date(startDate);

      while (taskDate < endDate) {
        const dayOfWeek = taskDate.getDay();
        if (dayOfWeek !== 0) { // skip Sunday
          const subIndex = Math.floor(Math.random() * subList.length);
          const sub = subList[subIndex];
          tasks.push({
            title: `Study: ${sub.name || sub.code}`,
            scheduledDate: taskDate.toISOString().split('T')[0],
            durationMinutes: (dailyStudyHours || 4) * 60 / subList.length,
            priority: 3,
            isCompleted: false,
          });
        }
        taskDate.setDate(taskDate.getDate() + 1);
      }

      sendSuccess(res, {
        title: `Study Plan - Semester ${sr.rows[0].current_semester}`,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        dailyStudyHours: dailyStudyHours || 4,
        isAiGenerated: false,
        tasks: tasks.slice(0, 60),
        note: 'Basic plan generated. AI service unavailable for optimized scheduling.',
      });
    }
  } catch {
    sendError(res, 'Failed to generate study plan', 500);
  }
};

// GET /api/ai/skill-gap/:studentId
export const getSkillGapAnalysis = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const studentId = req.params.studentId;

    const studentSkills = await query(
      `SELECT sk.id, sk.name, ss.proficiency_level, sc.name as category
       FROM student_skills ss
       JOIN skills sk ON ss.skill_id = sk.id
       LEFT JOIN skill_categories sc ON sk.category_id = sc.id
       WHERE ss.student_id = $1`,
      [studentId]
    );

    // Industry expected skills (using career paths or all skills as target)
    const allSkills = await query(
      `SELECT sk.id, sk.name, sc.name as category
       FROM skills sk
       LEFT JOIN skill_categories sc ON sk.category_id = sc.id
       WHERE sk.is_active = TRUE ORDER BY sc.name, sk.name`
    );

    const studentSkillIds = new Set(studentSkills.rows.map((s: { id: string }) => s.id));
    const missingSkills = allSkills.rows.filter((s: { id: string }) => !studentSkillIds.has(s.id));

    const profMap: Record<string, number> = {};
    studentSkills.rows.forEach((s: { id: string; proficiency_level: number }) => {
      profMap[s.id] = s.proficiency_level;
    });

    const lowProficiency = studentSkills.rows.filter((s: { proficiency_level: number }) => s.proficiency_level < 3);

    sendSuccess(res, {
      existingSkills: studentSkills.rows,
      missingSkills: missingSkills.slice(0, 15),
      lowProficiencySkills: lowProficiency,
      recommendations: missingSkills.slice(0, 5).map((s: { name: string; category: string }) => ({
        skill: s.name,
        category: s.category,
        suggestedResources: [`Search for "${s.name} tutorial"`, `Coursera: ${s.name} for beginners`],
        priority: 'medium',
      })),
      note: 'Skill gap analysis is based on your current skill profile vs. available skills in the system. Career-specific gap analysis can be refined by selecting a target career path.',
    });
  } catch {
    sendError(res, 'Failed to fetch skill gap analysis', 500);
  }
};

// POST /api/ai/campus-assistant
export const campusAssistant = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { message, language = 'en' } = req.body;
    if (!message) { sendError(res, 'message is required', 400); return; }

    const role = req.user!.role;
    const userId = req.user!.userId;
    const lowerMsg = message.toLowerCase();

    let response = '';

    // Contextual Q&A based on message content
    if (lowerMsg.includes('attendance') || lowerMsg.includes('present') || lowerMsg.includes('absent')) {
      if (role === 'student') {
        const sr = await query('SELECT id, current_semester FROM students WHERE user_id = $1', [userId]);
        if (sr.rows.length) {
          const att = await query(
            `SELECT ROUND(
               (COUNT(ar.id) FILTER (WHERE ar.status IN ('present','late'))::numeric /
                NULLIF(COUNT(ar.id), 0)) * 100, 1
             ) as pct
             FROM attendance_records ar
             JOIN attendance_sessions ases ON ar.session_id = ases.id
             JOIN subjects sub ON ases.subject_id = sub.id
             WHERE ar.student_id = $1 AND sub.semester = $2`,
            [sr.rows[0].id, sr.rows[0].current_semester]
          );
          const pct = att.rows[0]?.pct || 0;
          response = `Your current overall attendance for Semester ${sr.rows[0].current_semester} is ${pct}%. ${parseFloat(pct) < 75 ? '⚠️ This is below the 75% minimum. Please attend classes regularly.' : '✅ Good attendance! Keep it up.'}`;
        }
      } else {
        response = 'Attendance reports are available in the Faculty/HOD dashboard under Analytics.';
      }
    } else if (lowerMsg.includes('mentor') || lowerMsg.includes('advisor')) {
      if (role === 'student') {
        const sr = await query('SELECT id FROM students WHERE user_id = $1', [userId]);
        const mentor = await query(
          `SELECT u.first_name, u.last_name, u.email, u.phone
           FROM mentor_assignments ma
           JOIN faculty f ON ma.mentor_id = f.id
           JOIN users u ON f.user_id = u.id
           WHERE ma.student_id = $1 AND ma.is_active = TRUE`,
          [sr.rows[0]?.id]
        );
        if (mentor.rows.length) {
          const m = mentor.rows[0];
          response = `Your mentor is ${m.first_name} ${m.last_name}. You can reach them at ${m.email}${m.phone ? ` or ${m.phone}` : ''}.`;
        } else {
          response = 'No mentor has been assigned to you yet. Please contact your department admin.';
        }
      }
    } else if (lowerMsg.includes('library') || lowerMsg.includes('book')) {
      response = 'The library is located in Block C, Ground Floor. Timings: 8:00 AM – 8:00 PM on working days. For book availability, visit the library portal or contact the librarian.';
    } else if (lowerMsg.includes('lab') && (lowerMsg.includes('cse') || lowerMsg.includes('computer'))) {
      response = 'CSE Lab 1 and CSE Lab 2 are located in Block A, 2nd Floor. CSE Lab 1 is accessible Mon–Sat 9 AM–5 PM. For after-hours access, contact the lab incharge.';
    } else if (lowerMsg.includes('leave') || lowerMsg.includes('absent')) {
      response = 'To apply for leave:\n1. Log in to the portal\n2. Go to Attendance → Apply Leave\n3. Submit your leave request with reason and dates\n4. Your class advisor and faculty will be notified automatically.';
    } else if (lowerMsg.includes('complaint') || lowerMsg.includes('issue') || lowerMsg.includes('problem')) {
      response = 'To report a complaint:\n1. Go to the Complaints section in your dashboard\n2. Click "Submit Complaint"\n3. Select category (Wi-Fi, Classroom, Lab, etc.)\n4. Describe the issue\n5. You can also attach a photo or use voice recording\n\nYour complaint will receive a ticket number for tracking.';
    } else if (lowerMsg.includes('event') || lowerMsg.includes('workshop') || lowerMsg.includes('seminar')) {
      const events = await query(
        `SELECT title, start_datetime, event_type
         FROM events WHERE status = 'upcoming' AND start_datetime > NOW()
         ORDER BY start_datetime LIMIT 3`
      );
      if (events.rows.length) {
        const list = events.rows.map((e: { title: string; event_type: string; start_datetime: string }) =>
          `• ${e.title} (${e.event_type}) – ${new Date(e.start_datetime).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`
        ).join('\n');
        response = `Upcoming events:\n${list}\n\nVisit the Events section for full details and registration.`;
      } else {
        response = 'No upcoming events currently. Check the Events section for the latest updates.';
      }
    } else if (lowerMsg.includes('cafeteria') || lowerMsg.includes('food') || lowerMsg.includes('canteen')) {
      response = 'The cafeteria is located in Block D, Ground Floor. Timings: 8:00 AM – 6:00 PM. It serves breakfast, lunch, and snacks.';
    } else if (lowerMsg.includes('medical') || lowerMsg.includes('doctor') || lowerMsg.includes('sick')) {
      response = 'The Medical Room is in Block C, Ground Floor. A nurse is available 9 AM – 5 PM. For emergencies outside these hours, contact security or call 108.';
    } else if (lowerMsg.includes('maintenance') || lowerMsg.includes('repair') || lowerMsg.includes('broken')) {
      response = 'To report a maintenance issue:\n1. Go to Complaints → Submit Complaint\n2. Select category (Electrical, Equipment, etc.)\n3. Mention the location clearly\n\nUrgent issues are given high priority and addressed within 12–24 hours.';
    } else if (lowerMsg.includes('timetable') || lowerMsg.includes('schedule') || lowerMsg.includes('class')) {
      response = 'Your timetable is available in the Dashboard under "My Timetable". It shows all your classes, faculty, room numbers, and timings by day.';
    } else {
      response = `I can help you with information about:\n• Attendance & timetable\n• Your mentor details\n• Library & lab locations\n• Leave application process\n• Complaints & maintenance\n• Upcoming events\n• Cafeteria & medical room\n\nPlease ask a specific question and I'll do my best to help!`;
    }

    sendSuccess(res, {
      message: response,
      language,
      timestamp: new Date().toISOString(),
      role,
    });
  } catch {
    sendError(res, 'Campus assistant error', 500);
  }
};

// GET /api/ai/insights
export const getAIInsights = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const result = await query(
      `SELECT id, insight_type, target_type, title, description, severity,
              is_acknowledged, generated_at, data_snapshot
       FROM ai_insights
       WHERE (expires_at IS NULL OR expires_at > NOW())
       ORDER BY
         CASE severity WHEN 'critical' THEN 1 WHEN 'warning' THEN 2 ELSE 3 END,
         generated_at DESC
       LIMIT 20`
    );
    sendSuccess(res, result.rows);
  } catch {
    sendError(res, 'Failed to fetch insights', 500);
  }
};

// GET /api/ai/meeting-summary (POST)
export const generateMeetingSummary = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { meetingId, rawNotes, transcript } = req.body;
    if (!rawNotes && !transcript) {
      sendError(res, 'rawNotes or transcript required', 400); return;
    }

    const text = rawNotes || transcript;

    try {
      const aiResponse = await axios.post(`${AI_SERVICE_URL}/meeting/summarize`, {
        text, meetingId,
      }, { timeout: 15000 });
      sendSuccess(res, aiResponse.data);
    } catch {
      // Fallback: basic extraction
      const lines = text.split('\n').filter((l: string) => l.trim());
      const actionLines = lines.filter((l: string) =>
        l.toLowerCase().includes('action') || l.toLowerCase().includes('task') || l.toLowerCase().includes('will')
      );
      sendSuccess(res, {
        summary: `Meeting notes contain ${lines.length} points. AI summarization service unavailable.`,
        keyPoints: lines.slice(0, 5),
        actionItems: actionLines.slice(0, 5).map((l: string, i: number) => ({
          id: i + 1, description: l.trim(), assignedTo: null, dueDate: null,
        })),
        note: 'Automated extraction. Review and verify all action items.',
      });
    }
  } catch {
    sendError(res, 'Failed to generate meeting summary', 500);
  }
};
