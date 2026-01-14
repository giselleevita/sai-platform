'use client';

import { useMemo } from 'react';
import { AppLayout } from '@/components/shared';
import type { ComplianceSnapshot, Tool } from '@/types';

const demoTools: Tool[] = [
  {
    id: 'demo-1',
    name: 'GenAI Copilot',
    category: 'LLM',
    vendor: 'OpenAI',
    riskLevel: 'High',
    riskScore: 82,
    users: 120,
    frequency: 'Daily',
    dataTypes: ['PII', 'Proprietary'],
    controls: ['DLP', 'MFA'],
    hasDPA: true,
    dataResidency: 'EU',
    notes: 'Limited scope, quarterly review',
    companyId: 'demo-company',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    decisionStatus: 'Accepted with expiry',
    decisionOwner: 'Maya Chen',
    decisionRationale: 'Controls in place, limited scope',
    decisionExpiresAt: '2026-06-01',
  },
  {
    id: 'demo-2',
    name: 'ImageGen Pro',
    category: 'LLM',
    vendor: 'Stability',
    riskLevel: 'Critical',
    riskScore: 91,
    users: 40,
    frequency: 'Weekly',
    dataTypes: ['IP', 'Proprietary'],
    controls: ['MFA'],
    hasDPA: false,
    dataResidency: 'US',
    notes: 'Requires DPA before use',
    companyId: 'demo-company',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    decisionStatus: 'Rejected',
    decisionOwner: 'Security Council',
    decisionRationale: 'No DPA, sensitive data',
  },
  {
    id: 'demo-3',
    name: 'DataInsights LLM',
    category: 'Analytics',
    vendor: 'Databricks',
    riskLevel: 'Medium',
    riskScore: 64,
    users: 85,
    frequency: 'Daily',
    dataTypes: ['Financial', 'Proprietary'],
    controls: ['Logging', 'Access reviews'],
    hasDPA: true,
    companyId: 'demo-company',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    decisionStatus: 'Mitigate',
    decisionOwner: 'Risk Committee',
    decisionRationale: 'Needs enhanced monitoring',
    reviewDate: '2026-04-15',
  },
  {
    id: 'demo-4',
    name: 'VoiceBot Assist',
    category: 'Other',
    vendor: 'Twilio',
    riskLevel: 'Low',
    riskScore: 32,
    users: 55,
    frequency: 'Weekly',
    dataTypes: ['Public'],
    controls: ['Audit logging'],
    hasDPA: true,
    companyId: 'demo-company',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    decisionStatus: 'Accepted',
    decisionOwner: 'Operations',
    decisionRationale: 'Low risk, logging enabled',
  },
  {
    id: 'demo-5',
    name: 'AutoClassifier',
    category: 'Analytics',
    vendor: 'Custom',
    riskLevel: 'High',
    riskScore: 78,
    users: 65,
    frequency: 'Daily',
    dataTypes: ['PII', 'Financial'],
    controls: ['Access reviews'],
    hasDPA: false,
    companyId: 'demo-company',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    decisionStatus: 'Pending',
    decisionOwner: 'Unassigned',
    decisionRationale: 'Decision required before production use',
  },
];

const calculateSnapshot = (tools: Tool[]): ComplianceSnapshot => {
  const total = tools.length || 1;
  const withDecision = tools.filter((t) => t.decisionStatus && t.decisionStatus !== 'Pending').length;
  const percentCompliant = Math.round((withDecision / total) * 100);

  const highRiskUnresolved = tools.filter(
    (t) =>
      (t.riskLevel === 'High' || t.riskLevel === 'Critical') &&
      (!t.decisionStatus || t.decisionStatus === 'Pending' || t.decisionStatus === 'Rejected')
  ).length;

  const missingDecisions = tools.filter((t) => !t.decisionStatus || t.decisionStatus === 'Pending').length;

  const overdueReviews = tools.filter((t) => {
    if (!t.reviewDate) return false;
    return new Date(t.reviewDate) < new Date();
  }).length;

  return {
    timestamp: new Date().toISOString(),
    percentCompliant,
    highRiskUnresolved,
    missingDecisions,
    overdueReviews,
  };
};

export default function CompliancePage() {
  const snapshot = useMemo(() => calculateSnapshot(demoTools), []);
  const highRisk = demoTools.filter((t) => t.riskLevel === 'High' || t.riskLevel === 'Critical');
  const missingDecisions = demoTools.filter((t) => !t.decisionStatus || t.decisionStatus === 'Pending');
  const overdue = demoTools.filter((t) => t.reviewDate && new Date(t.reviewDate) < new Date());

  return (
    <AppLayout>
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">Compliance Snapshot</h1>
          <p className="text-gray-600">Immutable, time-based snapshot of AI governance status.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Snapshot metrics */}
        <section className="grid gap-4 md:grid-cols-4">
          {[
            { title: '% compliant AI tools', value: `${snapshot.percentCompliant}%` },
            { title: 'High-risk unresolved', value: snapshot.highRiskUnresolved },
            { title: 'Missing decisions', value: snapshot.missingDecisions },
            { title: 'Overdue reviews', value: snapshot.overdueReviews },
          ].map((card) => (
            <div key={card.title} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <div className="text-sm font-semibold text-gray-700">{card.title}</div>
              <div className="mt-2 text-2xl font-bold text-gray-900">{card.value}</div>
            </div>
          ))}
        </section>

        {/* High-risk unresolved */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-gray-900">High-risk unresolved tools</h2>
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm space-y-2">
            {highRisk.length === 0 ? (
              <p className="text-sm text-gray-700">No unresolved high-risk tools.</p>
            ) : (
              highRisk.map((t) => (
                <div key={t.id} className="flex items-center justify-between text-sm text-gray-800">
                  <span>{t.name}</span>
                  <span className="text-gray-600">{t.decisionStatus || 'No decision'}</span>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Missing decisions */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-gray-900">Missing decisions</h2>
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm space-y-2">
            {missingDecisions.length === 0 ? (
              <p className="text-sm text-gray-700">All tools have recorded decisions.</p>
            ) : (
              missingDecisions.map((t) => (
                <div key={t.id} className="flex items-center justify-between text-sm text-gray-800">
                  <span>{t.name}</span>
                  <span className="text-gray-600">Decision required</span>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Overdue reviews */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-gray-900">Overdue reviews</h2>
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm space-y-2">
            {overdue.length === 0 ? (
              <p className="text-sm text-gray-700">No overdue reviews.</p>
            ) : (
              overdue.map((t) => (
                <div key={t.id} className="flex items-center justify-between text-sm text-gray-800">
                  <span>{t.name}</span>
                  <span className="text-gray-600">Review overdue</span>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Export note */}
        <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="text-sm text-gray-700">
            Snapshots are immutable, time-based, and exportable for auditors. Timestamp:{' '}
            {new Date(snapshot.timestamp).toLocaleString()}
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
