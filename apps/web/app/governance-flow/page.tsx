'use client';

import Link from 'next/link';

export default function GovernanceFlowPage() {
  const steps = [
    { title: 'AI Tool', desc: 'Registered with owner and metadata' },
    { title: 'Risk Score', desc: 'Automated, explainable scoring' },
    { title: 'Policy', desc: 'Governance rules triggered' },
    { title: 'Decision', desc: 'Accept / Mitigate / Reject with rationale' },
    { title: 'Compliance Snapshot', desc: 'Point-in-time status recorded' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="max-w-5xl mx-auto px-6 py-16 space-y-8">
        <Link href="/" className="text-blue-600 hover:text-blue-800 text-sm">
          ← Back to homepage
        </Link>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Governance Flow</h1>
          <p className="text-gray-600">
            How SAI governs AI usage: from registration through risk, policy, decision, and compliance snapshots.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-5">
          {steps.map((step, idx) => (
            <div key={step.title} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-semibold text-blue-600">
                <span className="h-6 w-6 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center">
                  {idx + 1}
                </span>
                Step {idx + 1}
              </div>
              <div className="mt-2 text-lg font-semibold">{step.title}</div>
              <div className="text-sm text-gray-700">{step.desc}</div>
            </div>
          ))}
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Why it matters</h2>
          <ul className="mt-2 space-y-1 text-sm text-gray-700">
            <li>High-risk AI requires approval (management/security)</li>
            <li>No DPA → risk escalated; critical AI demands a decision</li>
            <li>Decisions recorded with owner, rationale, and expiry</li>
            <li>Compliance snapshots capture point-in-time status for auditors</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
