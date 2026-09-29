import React from 'react';
import { useQuery } from 'react-query';
import { useAuth } from '../../context/AuthContext';
import { studentAPI } from '../../services/api';
import PageHeader from '../../components/ui/PageHeader';
import StatCard from '../../components/ui/StatCard';
import Badge from '../../components/ui/Badge';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
} from 'recharts';
import {
  Activity, Users, Award, BookOpen, ClipboardList, Target, AlertTriangle,
} from 'lucide-react';

const DigitalTwin: React.FC = () => {
  const { user } = useAuth();

  // For students, use their own ID; staff would pass a param
  const { data: profileData } = useQuery('my-profile', () => studentAPI.getProfile(), {
    enabled: user?.role === 'student',
  });
  const studentId = profileData?.data?.data?.student_id;

  const { data, isLoading } = useQuery(
    ['digital-twin', studentId],
    () => studentAPI.getDigitalTwin(studentId!),
    { enabled: !!studentId }
  );
  const twin = data?.data?.data;

  const radarData = twin ? [
    { subject: 'Attendance', value: twin.academic.attendancePct },
    { subject: 'Marks',      value: twin.academic.marksPct },
    { subject: 'Assignments',value: twin.academic.assignmentCompletionRate },
    { subject: 'Skills',     value: Math.min(twin.skills.total * 10, 100) },
    { subject: 'Events',     value: Math.min(twin.engagement.eventsAttended * 20, 100) },
  ] : [];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Student Digital Twin"
        subtitle="A holistic view of your academic journey and engagement"
        badge={
          <span className="text-xs bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 px-2 py-0.5 rounded-full font-medium">
            AI-Powered
          </span>
        }
      />

      <div className="card p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
        <p className="text-xs text-blue-700 dark:text-blue-300">
          ℹ️ {twin?.note || 'This Digital Twin is a support tool to help identify improvement areas — not a ranking system.'}
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map((i) => <div key={i} className="card p-4"><div className="skeleton h-20 rounded" /></div>)}
        </div>
      ) : twin ? (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Attendance"
              value={`${twin.academic.attendancePct}%`}
              icon={<ClipboardList size={20} />}
              iconColor={twin.academic.attendancePct >= 75 ? 'text-green-600' : 'text-red-600'}
              iconBg={twin.academic.attendancePct >= 75 ? 'bg-green-50' : 'bg-red-50'}
            />
            <StatCard
              label="Avg. Marks"
              value={`${twin.academic.marksPct}%`}
              icon={<BookOpen size={20} />}
              iconColor="text-blue-600"
              iconBg="bg-blue-50"
            />
            <StatCard
              label="Engagement Score"
              value={twin.engagement.score}
              icon={<Activity size={20} />}
              iconColor="text-violet-600"
              iconBg="bg-violet-50"
              subtitle="out of 100"
            />
            <StatCard
              label="Skills Recorded"
              value={twin.skills.total}
              icon={<Target size={20} />}
              iconColor="text-orange-600"
              iconBg="bg-orange-50"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Radar Chart */}
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Performance Radar</h3>
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                  <Radar dataKey="value" fill="#3b82f6" fillOpacity={0.3} stroke="#3b82f6" strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Engagement & Skills */}
            <div className="space-y-4">
              <div className="card p-5">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Engagement</h3>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Events',   value: twin.engagement.eventsAttended,  icon: <Users size={14} /> },
                    { label: 'Clubs',    value: twin.engagement.clubsJoined,       icon: <Award size={14} /> },
                    { label: 'Certs',    value: twin.engagement.certificationsEarned, icon: <Award size={14} /> },
                  ].map((item) => (
                    <div key={item.label} className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                      <div className="flex justify-center text-primary-600 mb-1">{item.icon}</div>
                      <div className="text-lg font-bold text-gray-900 dark:text-white">{item.value}</div>
                      <div className="text-xs text-gray-500">{item.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Skills */}
              <div className="card p-5">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Top Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {twin.skills.items?.slice(0, 8).map((s: { skill_name: string; proficiency_level: number }) => (
                    <Badge key={s.skill_name} variant="blue">{s.skill_name}</Badge>
                  ))}
                  {twin.skills.total === 0 && (
                    <p className="text-xs text-gray-400">No skills recorded yet</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Risk Alert */}
          {twin.riskAlert && (
            <div className="card p-5 border-l-4 border-red-500 bg-red-50 dark:bg-red-900/20">
              <div className="flex items-start gap-3">
                <AlertTriangle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-800 dark:text-red-200">
                    Support Alert – {twin.riskAlert.risk_level?.toUpperCase()} Risk
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {twin.riskAlert.recommendation}
                  </p>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="card p-12 text-center text-gray-400">
          Digital Twin data unavailable. Please ensure your profile is complete.
        </div>
      )}
    </div>
  );
};

export default DigitalTwin;
