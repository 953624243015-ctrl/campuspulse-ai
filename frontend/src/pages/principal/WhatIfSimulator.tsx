import React, { useState } from 'react';
import { useMutation } from 'react-query';
import { Zap, Loader2, Info } from 'lucide-react';
import { principalAPI } from '../../services/api';
import PageHeader from '../../components/ui/PageHeader';

const scenarios = [
  {
    id: 'attendance_threshold_change',
    label: 'Change Attendance Threshold',
    description: 'Simulate the impact of changing the minimum attendance requirement.',
    params: [{ key: 'newThreshold', label: 'New Threshold (%)', type: 'number', default: 75 }],
  },
  {
    id: 'classroom_unavailable',
    label: 'Classroom Unavailability',
    description: 'Simulate the impact of a classroom becoming unavailable.',
    params: [{ key: 'locationId', label: 'Location ID (UUID)', type: 'text', default: '' }],
  },
  {
    id: 'custom',
    label: 'Custom Scenario',
    description: 'Describe a custom scenario for analysis.',
    params: [{ key: 'description', label: 'Scenario Description', type: 'text', default: '' }],
  },
];

const WhatIfSimulator: React.FC = () => {
  const [selectedScenario, setSelectedScenario] = useState(scenarios[0]);
  const [params, setParams] = useState<Record<string, string | number>>(
    Object.fromEntries(scenarios[0].params.map(p => [p.key, p.default]))
  );
  const [result, setResult] = useState<Record<string, unknown> | null>(null);

  const mutation = useMutation(
    () => principalAPI.runWhatIf({ scenario: selectedScenario.id, parameters: params }),
    { onSuccess: (res) => setResult(res.data.data) }
  );

  const handleScenarioChange = (scenario: typeof scenarios[0]) => {
    setSelectedScenario(scenario);
    setParams(Object.fromEntries(scenario.params.map(p => [p.key, p.default])));
    setResult(null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="What-If Simulator"
        subtitle="Run scenario analysis to understand potential impacts before making decisions"
        badge={
          <span className="text-xs bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 px-2 py-0.5 rounded-full font-medium">
            Scenario Analysis
          </span>
        }
      />

      <div className="card p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 flex items-start gap-3">
        <Info size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-700 dark:text-amber-300">
          All results are <strong>scenario estimates</strong> based on current data — not guaranteed predictions.
          Use these insights to support, not replace, informed decision-making.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scenario Selection */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Select Scenario</h3>
          {scenarios.map((sc) => (
            <button
              key={sc.id}
              onClick={() => handleScenarioChange(sc)}
              className={`w-full text-left p-3 rounded-xl border transition-all ${
                selectedScenario.id === sc.id
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'card hover:shadow-card-hover'
              }`}
            >
              <p className={`text-sm font-medium ${selectedScenario.id === sc.id ? 'text-primary-700 dark:text-primary-300' : 'text-gray-900 dark:text-white'}`}>
                {sc.label}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">{sc.description}</p>
            </button>
          ))}
        </div>

        {/* Parameters & Run */}
        <div className="card p-5 space-y-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Parameters</h3>
          {selectedScenario.params.map((p) => (
            <div key={p.key}>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{p.label}</label>
              <input
                type={p.type}
                className="input"
                value={params[p.key] as string}
                onChange={(e) => setParams(prev => ({
                  ...prev,
                  [p.key]: p.type === 'number' ? +e.target.value : e.target.value,
                }))}
              />
            </div>
          ))}
          <button
            className="btn-primary w-full justify-center"
            onClick={() => mutation.mutate()}
            disabled={mutation.isLoading}
          >
            {mutation.isLoading
              ? <><Loader2 size={16} className="animate-spin" /> Simulating...</>
              : <><Zap size={16} /> Run Simulation</>
            }
          </button>
        </div>

        {/* Result */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Simulation Result</h3>
          {result ? (
            <div className="space-y-3">
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
                  {result.description as string}
                </p>
              </div>

              {result.affectedStudents !== undefined && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-center">
                  <div className="text-3xl font-bold text-red-600">{result.affectedStudents as number}</div>
                  <div className="text-xs text-gray-500 mt-1">Students potentially affected</div>
                </div>
              )}

              {result.affectedSlots !== undefined && (
                <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg text-center">
                  <div className="text-3xl font-bold text-orange-600">{result.affectedSlots as number}</div>
                  <div className="text-xs text-gray-500 mt-1">Timetable slots affected</div>
                </div>
              )}

              <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs text-gray-500">
                ⚠️ {result.disclaimer as string}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400">
              <Zap size={32} className="mb-2 opacity-30" />
              <p className="text-sm">Run a simulation to see results</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WhatIfSimulator;
