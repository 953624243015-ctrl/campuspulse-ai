import React from 'react';
import { useQuery } from 'react-query';
import { useAuth } from '../../context/AuthContext';
import { studentAPI } from '../../services/api';
import PageHeader from '../../components/ui/PageHeader';
import EmptyState from '../../components/ui/EmptyState';
import { Target } from 'lucide-react';

const levels = ['', 'Beginner', 'Elementary', 'Intermediate', 'Advanced', 'Expert'];

const StudentSkills: React.FC = () => {
  const { user } = useAuth();
  const { data, isLoading } = useQuery('my-skills', () => studentAPI.getSkills());
  const skills = data?.data?.data?.skills || [];

  // Group by category
  const grouped: Record<string, typeof skills> = {};
  skills.forEach((s: { category_name: string }) => {
    const cat = s.category_name || 'Other';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(s);
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="My Skills"
        subtitle="Your current skill profile and proficiency levels"
        actions={
          <button
            className="btn-primary"
            onClick={() => window.location.href = '/skill-gap'}
          >
            View Skill Gap Analysis
          </button>
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="card p-4"><div className="skeleton h-24 rounded" /></div>)}
        </div>
      ) : skills.length === 0 ? (
        <EmptyState
          icon={<Target size={40} className="text-gray-300" />}
          title="No skills recorded yet"
          description="Skills are added when verified by faculty or when you complete certifications."
        />
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([category, catSkills]) => (
            <div key={category} className="card p-5">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">{category}</h3>
              <div className="space-y-3">
                {catSkills.map((s: { skill_id: string; skill_name: string; proficiency_level: number; acquired_date?: string }) => (
                  <div key={s.skill_id} className="flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{s.skill_name}</span>
                        <span className="text-xs text-gray-500">{levels[s.proficiency_level] || 'Unknown'}</span>
                      </div>
                      <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-2 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 transition-all duration-500"
                          style={{ width: `${(s.proficiency_level / 5) * 100}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex-shrink-0 flex gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div
                          key={i}
                          className={`w-3 h-3 rounded-full ${
                            i < s.proficiency_level ? 'bg-primary-500' : 'bg-gray-200 dark:bg-gray-700'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentSkills;
