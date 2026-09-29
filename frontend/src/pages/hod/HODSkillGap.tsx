import React from 'react';
import { useQuery } from 'react-query';
import { hodAPI } from '../../services/api';
import PageHeader from '../../components/ui/PageHeader';

const HODSkillGap: React.FC = () => {
  const { data, isLoading } = useQuery('hod-skill-gap', () => hodAPI.getSkillGap());
  const skills = data?.data?.data?.skillCoverage || [];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Department Skill Gap" subtitle="Coverage and proficiency of skills across students" />
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr><th>Skill</th><th>Category</th><th>Coverage</th><th>Avg. Proficiency</th><th>Gap</th></tr>
          </thead>
          <tbody>
            {isLoading ? Array.from({length:6}).map((_,i)=>(<tr key={i}>{Array.from({length:5}).map((_,j)=>(<td key={j}><div className="skeleton h-4 rounded"/></td>))}</tr>)) :
            skills.map((s: { skill_name: string; category: string; coverage_pct: number; avg_proficiency: number }) => {
              const pct = parseFloat(s.coverage_pct as unknown as string || '0');
              return (
                <tr key={s.skill_name}>
                  <td className="font-medium">{s.skill_name}</td>
                  <td className="text-gray-500 text-xs">{s.category}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-24 bg-gray-100 dark:bg-gray-700 rounded-full">
                        <div className="h-1.5 rounded-full bg-primary-500" style={{width:`${pct}%`}}/>
                      </div>
                      <span className="text-xs">{pct}%</span>
                    </div>
                  </td>
                  <td>
                    <div className="flex gap-0.5">
                      {Array.from({length:5}).map((_,i)=>(
                        <div key={i} className={`w-3 h-3 rounded-full ${i < Math.round(parseFloat(s.avg_proficiency as unknown as string || '0')) ? 'bg-primary-500' : 'bg-gray-200'}`}/>
                      ))}
                    </div>
                  </td>
                  <td>
                    <span className={`text-xs font-medium ${pct < 40 ? 'text-red-600' : pct < 70 ? 'text-yellow-600' : 'text-green-600'}`}>
                      {pct < 40 ? 'Critical Gap' : pct < 70 ? 'Moderate' : 'Good'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HODSkillGap;
