import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { useAuth } from '../../context/AuthContext';
import { studentAPI, aiAPI } from '../../services/api';
import PageHeader from '../../components/ui/PageHeader';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import { Target, TrendingUp, BookOpen } from 'lucide-react';

const SkillGapPage: React.FC = () => {
  const { user } = useAuth();

  const { data: profileData } = useQuery('student-profile-skills', () => studentAPI.getProfile(), {
    enabled: user?.role === 'student',
  });
  const studentId = profileData?.data?.data?.student_id;

  const { data, isLoading } = useQuery(
    ['skill-gap', studentId],
    () => aiAPI.getSkillGap(studentId!),
    { enabled: !!studentId }
  );
  const result = data?.data?.data;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Skill Gap Analysis"
        subtitle="Compare your current skills against industry requirements"
        badge={
          <span className="text-xs bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 px-2 py-0.5 rounded-full">
            AI-Powered
          </span>
        }
      />

      <div className="card p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
        <p className="text-xs text-blue-700 dark:text-blue-300">
          ℹ️ {result?.note || 'This analysis compares your current skill profile against available skills in the system. Use it as a guide, not a strict assessment.'}
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1,2,3].map(i=><div key={i} className="card p-4"><div className="skeleton h-32 rounded"/></div>)}
        </div>
      ) : result ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card p-4 text-center border-t-4 border-green-500">
              <Target size={24} className="text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {result.existingSkills?.length || 0}
              </div>
              <div className="text-sm text-gray-500 mt-1">Skills You Have</div>
            </div>
            <div className="card p-4 text-center border-t-4 border-red-500">
              <TrendingUp size={24} className="text-red-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {result.missingSkills?.length || 0}
              </div>
              <div className="text-sm text-gray-500 mt-1">Skills to Develop</div>
            </div>
            <div className="card p-4 text-center border-t-4 border-yellow-500">
              <BookOpen size={24} className="text-yellow-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {result.lowProficiencySkills?.length || 0}
              </div>
              <div className="text-sm text-gray-500 mt-1">Skills to Improve</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Current Skills */}
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Your Current Skills</h3>
              {result.existingSkills?.length ? (
                <div className="flex flex-wrap gap-2">
                  {result.existingSkills.map((s: { skill_id?: string; skill_name?: string; name?: string; proficiency_level: number }) => (
                    <div key={s.skill_id || s.name} className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 dark:bg-green-900/20 rounded-full border border-green-200 dark:border-green-800">
                      <span className="text-xs font-medium text-green-800 dark:text-green-200">{s.skill_name || s.name}</span>
                      <div className="flex gap-0.5">
                        {Array.from({length:5}).map((_,i)=>(
                          <div key={i} className={`w-1.5 h-1.5 rounded-full ${i < s.proficiency_level ? 'bg-green-500' : 'bg-green-200'}`}/>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState title="No skills recorded" description="Start adding your skills and certifications." />
              )}
            </div>

            {/* Missing Skills */}
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Skills to Develop</h3>
              {result.missingSkills?.length ? (
                <div className="space-y-2">
                  {result.missingSkills.slice(0, 8).map((s: { id?: string; name?: string; category?: string }) => (
                    <div key={s.id || s.name} className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-100 dark:border-red-900">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                      <span className="text-xs font-medium text-gray-800 dark:text-gray-200">{s.name}</span>
                      <span className="text-xs text-gray-400 ml-auto">{s.category}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-green-600">
                  <Target size={24} className="mx-auto mb-1" />
                  <p className="text-sm">All major skills covered!</p>
                </div>
              )}
            </div>
          </div>

          {/* Recommendations */}
          {result.recommendations?.length > 0 && (
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Recommended Learning Path</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {result.recommendations.map((rec: {
                  skill: string; category: string; priority: string;
                  suggestedResources: string[];
                }, i: number) => (
                  <div key={i} className="p-3 bg-violet-50 dark:bg-violet-900/20 rounded-xl border border-violet-100 dark:border-violet-900">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-violet-800 dark:text-violet-200">{rec.skill}</span>
                      <Badge variant="purple">{rec.priority}</Badge>
                    </div>
                    <p className="text-xs text-gray-500">{rec.category}</p>
                    <div className="mt-2 space-y-1">
                      {rec.suggestedResources.map((r: string, j: number) => (
                        <p key={j} className="text-xs text-violet-600 dark:text-violet-400">→ {r}</p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <EmptyState title="Unable to load skill gap analysis" description="Please ensure your student profile is complete." />
      )}
    </div>
  );
};

export default SkillGapPage;
