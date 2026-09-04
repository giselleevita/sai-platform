'use client';

import { useState } from 'react';
import { AppLayout, ErrorAlert, PageHeader } from '@/components/shared';
import { api } from '@/lib/api';

type Tier = 'high-risk' | 'limited-risk' | 'minimal-risk';

type AssessmentResult = {
  systemName: string;
  status: 'conformant' | 'partially-conformant' | 'non-conformant';
  score: number;
  gaps: string[];
  nextActions: string[];
};

const TIERS: { value: Tier; label: string; help: string }[] = [
  {
    value: 'high-risk',
    label: 'High risk',
    help: 'Risk management, technical documentation, human oversight and post-market monitoring are all required.',
  },
  {
    value: 'limited-risk',
    label: 'Limited risk',
    help: 'Human oversight and post-market monitoring are required.',
  },
  {
    value: 'minimal-risk',
    label: 'Minimal risk',
    help: 'No controls are required under the Act. The assessment records that judgement.',
  },
];

const CONTROLS = [
  { key: 'hasRiskManagement', label: 'Risk management system', tiers: ['high-risk'] },
  { key: 'hasTechnicalDocumentation', label: 'Technical documentation', tiers: ['high-risk'] },
  { key: 'hasHumanOversight', label: 'Human oversight', tiers: ['high-risk', 'limited-risk'] },
  { key: 'hasMonitoringPlan', label: 'Post-market monitoring plan', tiers: ['high-risk', 'limited-risk'] },
] as const;

const STATUS_STYLES: Record<AssessmentResult['status'], string> = {
  conformant: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200',
  'partially-conformant': 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
  'non-conformant': 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200',
};

export default function ConformityPage() {
  const [systemName, setSystemName] = useState('');
  const [tier, setTier] = useState<Tier>('high-risk');
  const [controls, setControls] = useState<Record<string, boolean>>({
    hasRiskManagement: false,
    hasTechnicalDocumentation: false,
    hasHumanOversight: false,
    hasMonitoringPlan: false,
  });
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const selectedTier = TIERS.find((t) => t.value === tier);

  const assess = async () => {
    setError('');
    if (!systemName.trim()) {
      setError('System name is required');
      return;
    }
    setLoading(true);
    const res = await api.post<AssessmentResult>('/api/conformity/assess', {
      systemName: systemName.trim(),
      euAiActTier: tier,
      ...controls,
    });
    setLoading(false);
    if (!res.success || !res.data) {
      setError(res.error || 'Failed to run the assessment');
      setResult(null);
      return;
    }
    setResult(res.data);
  };

  return (
    <AppLayout>
      <PageHeader
        title="Conformity"
        subtitle="Check an AI system against the controls its EU AI Act tier requires."
      />

      {error ? <ErrorAlert message={error} /> : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Assessment</h2>

          <label className="mt-4 block text-sm font-medium text-gray-700 dark:text-gray-300">
            System name
            <input
              value={systemName}
              onChange={(e) => setSystemName(e.target.value)}
              placeholder="Candidate screening model"
              className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
            />
          </label>

          <fieldset className="mt-4">
            <legend className="text-sm font-medium text-gray-700 dark:text-gray-300">Risk tier</legend>
            <div className="mt-2 space-y-2">
              {TIERS.map((option) => (
                <label key={option.value} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <input
                    type="radio"
                    name="tier"
                    value={option.value}
                    checked={tier === option.value}
                    onChange={() => setTier(option.value)}
                    className="mt-1"
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
            {selectedTier ? (
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{selectedTier.help}</p>
            ) : null}
          </fieldset>

          <fieldset className="mt-4">
            <legend className="text-sm font-medium text-gray-700 dark:text-gray-300">Controls in place</legend>
            <div className="mt-2 space-y-2">
              {CONTROLS.map((control) => {
                const required = (control.tiers as readonly string[]).includes(tier);
                return (
                  <label
                    key={control.key}
                    className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"
                  >
                    <input
                      type="checkbox"
                      checked={Boolean(controls[control.key])}
                      onChange={(e) =>
                        setControls((prev) => ({ ...prev, [control.key]: e.target.checked }))
                      }
                    />
                    <span>{control.label}</span>
                    {required ? (
                      <span className="rounded bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 text-xs text-gray-600 dark:text-gray-300">
                        required
                      </span>
                    ) : null}
                  </label>
                );
              })}
            </div>
          </fieldset>

          <button
            onClick={assess}
            disabled={loading}
            className="mt-5 rounded-md bg-gray-900 dark:bg-gray-100 px-3 py-2 text-sm font-semibold text-white dark:text-gray-900 disabled:opacity-60"
          >
            {loading ? 'Assessing…' : 'Run assessment'}
          </button>
        </section>

        <section className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Result</h2>

          {!result ? (
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
              Run an assessment to see the gaps and the actions that would close them.
            </p>
          ) : (
            <div className="mt-4 space-y-4">
              <div className="flex items-center gap-3">
                <span className={`rounded px-2 py-1 text-xs font-semibold ${STATUS_STYLES[result.status]}`}>
                  {result.status.replace('-', ' ')}
                </span>
                <span className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{result.score}%</span>
              </div>

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Gaps
                </h3>
                {result.gaps.length === 0 ? (
                  <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                    No required control is missing for this tier.
                  </p>
                ) : (
                  <ul className="mt-1 list-disc pl-5 text-sm text-gray-700 dark:text-gray-300">
                    {result.gaps.map((gap) => (
                      <li key={gap}>{gap.replace(/_/g, ' ')}</li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Next actions
                </h3>
                <ul className="mt-1 list-disc pl-5 text-sm text-gray-700 dark:text-gray-300">
                  {result.nextActions.map((action) => (
                    <li key={action}>{action}</li>
                  ))}
                </ul>
              </div>

              <p className="text-xs text-gray-500 dark:text-gray-400">
                The assessment is a checklist against the controls this tier requires. It is not legal advice and it
                does not inspect the system itself.
              </p>
            </div>
          )}
        </section>
      </div>
    </AppLayout>
  );
}
