'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

import { api } from '@/lib/api';
import type { Tool, ToolDecisionLog } from '@/types';
import { AppLayout, RiskBadge, CommentsSection } from '@/components/shared';

interface RiskFactor {
  dataType: number;
  userCount: number;
  controls: number;
  frequency: number;
}

export default function ToolDetailPage() {
  const router = useRouter();
  const params = useParams();
  const toolId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [tool, setTool] = useState<Tool | null>(null);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [decisionLogs, setDecisionLogs] = useState<ToolDecisionLog[]>([]);
  const [applicablePolicies, setApplicablePolicies] = useState<any[]>([]);
  const [toolOwner, setToolOwner] = useState<any>(null);

  useEffect(() => {
    const loadTool = async () => {
      try {
        if (typeof window === 'undefined') return;
        
        const { redirectToLoginIfNoSession } = await import('@/lib/auth');
        if (redirectToLoginIfNoSession(router)) return;

        const result = await api.get<Tool>(`/api/inventory/${toolId}`);
        
        if (!result.success) {
          if (result.error?.includes('404') || result.error?.includes('not found')) {
            setError('Tool not found');
          } else if (result.error?.includes('401') || result.error?.includes('unauthorized')) {
            router.push('/auth/login');
            return;
          } else {
            throw new Error(result.error || 'Failed to load tool');
          }
          setLoading(false);
          return;
        }

        const toolData = result.data || null;
        if (toolData) {
          // Set tool owner if available
          if ((toolData as any).User) {
            setToolOwner((toolData as any).User);
          }
          
          // Set applicable policies if available
          if ((toolData as any).applicablePolicies) {
            setApplicablePolicies((toolData as any).applicablePolicies);
          }
          
          // hydrate governance profile from API if available
          try {
            const gov = await api.get<{ toolId: string } & ReturnType<typeof getGovernanceProfile>>(
              `/api/inventory/${toolId}/governance`
            );
            if (gov.success && gov.data) {
              setTool({
                ...toolData,
                decisionStatus: (gov.data as any).decisionStatus,
                decisionOwner: (gov.data as any).decisionOwner,
                decisionOwnerRole: (gov.data as any).decisionOwnerRole,
                decisionRationale: (gov.data as any).decisionRationale,
                decisionExpiresAt: (gov.data as any).decisionExpiresAt,
                reviewDate: (gov.data as any).reviewDate,
                applicablePolicies: (gov.data as any).applicablePolicies || applicablePolicies.map((p: any) => p.name),
                complianceStatus: (gov.data as any).complianceStatus,
              });
              return;
            }
          } catch {
            // fall back silently to local profile
          }
          // load decision logs
          try {
            const logs = await api.get<ToolDecisionLog[]>(`/api/inventory/${toolId}/decisions`);
            if (logs.success && logs.data) {
              setDecisionLogs(logs.data);
            }
          } catch {
            // ignore
          }
          setTool(toolData);
        } else {
          setTool(null);
        }
      } catch (err) {
        setError((err as any).message || 'Failed to load tool');
      } finally {
        setLoading(false);
      }
    };

    if (toolId) {
      loadTool();
    }
  }, [toolId, router]);

  const handleDelete = async () => {
    try {
      if (typeof window === 'undefined') return;
      
      const result = await api.delete(`/api/inventory/${toolId}`);
      
      if (!result.success) {
        if (result.error?.includes('401') || result.error?.includes('unauthorized')) {
          router.push('/auth/login');
          return;
        }
        throw new Error(result.error || 'Failed to delete tool');
      }

      router.push('/inventory');
    } catch (err) {
      setError((err as any).message || 'Failed to delete tool');
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'Critical':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'High':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'Low':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

const GOVERNANCE_PROFILES: Record<
  string,
  {
    decisionStatus: string;
    decisionOwner: string;
    decisionOwnerRole: string;
    decisionRationale: string;
    decisionExpiresAt?: string;
    reviewDate?: string;
    applicablePolicies: string[];
    complianceStatus: string;
  }
> = {
  'GenAI Copilot': {
    decisionStatus: 'Accepted with expiry',
    decisionOwner: 'Maya Chen',
    decisionOwnerRole: 'Management',
    decisionRationale: 'Controls in place, limited scope, reviewed quarterly',
    decisionExpiresAt: '2026-06-01',
    reviewDate: '2026-03-01',
    applicablePolicies: ['AI Usage Policy', 'High-Risk Approval', 'Data Handling (PII)'],
    complianceStatus: 'Compliant with review scheduled',
  },
  'ImageGen Pro': {
    decisionStatus: 'Rejected',
    decisionOwner: 'Security Council',
    decisionOwnerRole: 'Security',
    decisionRationale: 'No DPA, high data sensitivity, unacceptable risk',
    applicablePolicies: ['AI Usage Policy', 'High-Risk Approval'],
    complianceStatus: 'Non-compliant until mitigated',
  },
  'DataInsights LLM': {
    decisionStatus: 'Mitigate',
    decisionOwner: 'Risk Committee',
    decisionOwnerRole: 'Management',
    decisionRationale: 'Requires additional monitoring and DLP controls',
    reviewDate: '2026-04-15',
    applicablePolicies: ['AI Usage Policy', 'Data Residency', 'Monitoring & Logging'],
    complianceStatus: 'In mitigation with active monitoring',
  },
  'VoiceBot Assist': {
    decisionStatus: 'Accepted',
    decisionOwner: 'Operations',
    decisionOwnerRole: 'Management',
    decisionRationale: 'Low-risk, no sensitive data, logging enabled',
    applicablePolicies: ['AI Usage Policy'],
    complianceStatus: 'Compliant',
  },
  'AutoClassifier': {
    decisionStatus: 'Pending',
    decisionOwner: 'Awaiting owner assignment',
    decisionOwnerRole: 'Unassigned',
    decisionRationale: 'Decision required before production use',
    applicablePolicies: ['AI Usage Policy', 'High-Risk Approval'],
    complianceStatus: 'Decision required',
  },
};

const getGovernanceProfile = (tool: Tool) => {
  return (
    GOVERNANCE_PROFILES[tool.name] || {
      decisionStatus: 'Pending',
      decisionOwner: 'Unassigned',
      decisionOwnerRole: 'Unassigned',
      decisionRationale: 'Decision required before production use',
      applicablePolicies: ['AI Usage Policy'],
      complianceStatus: 'Decision required',
    }
  );
};

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </AppLayout>
    );
  }

  if (error || !tool) {
    return (
      <AppLayout>
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <Link href="/inventory" className="text-blue-600 hover:text-blue-900 mb-4 block">
            ← Back to Inventory
          </Link>
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm font-medium text-red-800">{error || 'Tool not found'}</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-start">
            <div>
              <Link href="/inventory" className="text-blue-600 hover:text-blue-900 text-sm">
                ← Back to Inventory
              </Link>
              <h1 className="mt-2 text-3xl font-bold text-gray-900">{tool.name}</h1>
              <p className="mt-1 text-gray-600">
                {tool.vendor && <span>{tool.vendor} • </span>}
                {tool.category}
              </p>
            </div>
            <div className="flex gap-2">
              {!editing && (
                <>
                  <button
                    onClick={() => setEditing(true)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-4 py-2 border border-red-300 rounded-md text-sm font-medium text-red-700 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* Risk Summary Card */}
        <div className={`rounded-lg border-2 ${getRiskColor(tool.riskLevel)} p-6 mb-8`}>
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold">Risk Level: {tool.riskLevel}</h2>
              <p className="mt-1 text-sm opacity-75">Risk Score: {tool.riskScore}/100</p>
            </div>
            <div className="text-4xl font-bold opacity-20">{tool.riskScore}</div>
          </div>
        </div>

        {/* Governance flow: AI → Risk → Policy → Decision → Compliance */}
        {(() => {
          const governance = getGovernanceProfile(tool);

          const enforcementFindings = [
            {
              rule: 'High risk → management approval required',
              passes:
                tool.riskLevel === 'High' || tool.riskLevel === 'Critical'
                  ? governance.decisionOwnerRole === 'Management'
                  : true,
            },
            {
              rule: 'No DPA → risk escalated',
              passes: tool.hasDPA || tool.riskLevel !== 'High',
            },
            {
              rule: 'Critical risk → decision mandatory',
              passes: tool.riskLevel !== 'Critical' ? true : governance.decisionStatus !== 'Pending',
            },
          ];

          return (
            <div className="mb-8 space-y-8">
              <div className="grid gap-4 md:grid-cols-5">
                {[
                  { title: 'AI Tool', detail: tool.name },
                  { title: 'Risk Score', detail: `${tool.riskScore}/100 (${tool.riskLevel})` },
                  { title: 'Policy', detail: (governance.applicablePolicies || []).join(', ') || 'AI Usage Policy' },
                  { title: 'Decision', detail: governance.decisionStatus },
                  { title: 'Compliance', detail: governance.complianceStatus || 'Pending decision' },
                ].map((item) => (
                  <div key={item.title} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="text-sm font-semibold text-gray-700">{item.title}</div>
                    <div className="mt-2 text-sm text-gray-900">{item.detail}</div>
                  </div>
                ))}
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="text-sm font-semibold text-gray-700">Decision & Accountability</div>
                  <div className="mt-2 text-sm text-gray-900">{governance.decisionStatus}</div>
                  <div className="mt-1 text-sm text-gray-700">
                    Owner: {governance.decisionOwner} ({governance.decisionOwnerRole})
                  </div>
                  <div className="mt-1 text-sm text-gray-700">Rationale: {governance.decisionRationale}</div>
                  {governance.decisionExpiresAt && (
                    <div className="mt-1 text-sm text-gray-700">
                      Decision expiry: {new Date(governance.decisionExpiresAt).toLocaleDateString()}
                    </div>
                  )}
                  {governance.reviewDate && (
                    <div className="mt-1 text-sm text-gray-700">
                      Review date: {new Date(governance.reviewDate).toLocaleDateString()}
                    </div>
                  )}
                </div>

                <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="text-sm font-semibold text-gray-700">Applicable Policies</div>
                  <ul className="mt-2 space-y-2 text-sm text-gray-700">
                    {applicablePolicies.length > 0 ? (
                      applicablePolicies.map((policy: any) => (
                        <li key={policy.id} className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-blue-500" />
                            <span className="font-medium">{policy.name}</span>
                          </div>
                          {policy.description && (
                            <div className="text-xs text-gray-500 ml-4">{policy.description}</div>
                          )}
                          {policy.controls && policy.controls.length > 0 && (
                            <div className="text-xs text-gray-500 ml-4">
                              Controls: {policy.controls.map((c: any) => c.name).join(', ')}
                            </div>
                          )}
                        </li>
                      ))
                    ) : (
                      <li className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-gray-400" />
                        {(governance.applicablePolicies || ['AI Usage Policy']).join(', ')}
                      </li>
                    )}
                  </ul>
                </div>

                <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="text-sm font-semibold text-gray-700">Enforcement Rules</div>
                  <ul className="mt-2 space-y-2 text-sm text-gray-700">
                    {enforcementFindings.map((f) => (
                      <li key={f.rule} className="flex items-center gap-2">
                        <span
                          className={`inline-flex h-2 w-2 rounded-full ${
                            f.passes ? 'bg-green-500' : 'bg-red-500'
                          }`}
                        />
                        <span>{f.rule}</span>
                      </li>
                    ))}
                  </ul>
              </div>
            </div>

            {/* Decision history */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900">Decision history</h3>
              <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm space-y-3">
                {decisionLogs.length === 0 ? (
                  <p className="text-sm text-gray-700">No decisions recorded yet.</p>
                ) : (
                  decisionLogs.map((log) => (
                    <div key={log.id} className="border-b border-gray-100 pb-2 last:border-b-0">
                      <div className="flex items-center justify-between text-sm text-gray-800">
                        <span className="font-semibold">{log.decision}</span>
                        <span className="text-gray-500">{new Date(log.createdAt).toLocaleString()}</span>
                      </div>
                      {log.rationale && <div className="text-sm text-gray-700 mt-1">Rationale: {log.rationale}</div>}
                      {log.owner && (
                        <div className="text-xs text-gray-600 mt-1">
                          By: {log.owner.name} ({log.owner.email})
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
      );
    })()}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Delete Tool?</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete "{tool.name}"? This action cannot be undone.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Details Grid */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-8">
            {/* Basic Info */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
              <div className="space-y-4">
                {tool.description && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <p className="mt-1 text-gray-600">{tool.description}</p>
                  </div>
                )}
                {tool.url && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">URL</label>
                    <a href={tool.url} target="_blank" rel="noopener noreferrer" className="mt-1 text-blue-600 hover:text-blue-900">
                      {tool.url}
                    </a>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  {/* Status field removed - not in Tool type */}
                </div>
              </div>
            </div>

            {/* Risk Score Calculation */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Score Calculation</h3>
              <div className="space-y-3 text-sm">
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">How Risk Score is Calculated:</h4>
                  <div className="space-y-2 text-blue-800">
                    <div>
                      <span className="font-medium">1. Data Type Risk:</span> Average risk from data types
                      <ul className="ml-4 mt-1 list-disc space-y-1 text-xs">
                        <li>PII: 30 points</li>
                        <li>Financial: 25 points</li>
                        <li>IP: 20 points</li>
                        <li>Proprietary: 15 points</li>
                        <li>Public: 5 points</li>
                      </ul>
                    </div>
                    <div>
                      <span className="font-medium">2. User Count Risk:</span> Up to 20 points
                      <div className="ml-4 mt-1 text-xs">Formula: (Users / 100) × 20 (max 20)</div>
                    </div>
                    <div>
                      <span className="font-medium">3. Frequency Risk:</span>
                      <ul className="ml-4 mt-1 list-disc space-y-1 text-xs">
                        <li>Daily: 10 points</li>
                        <li>Weekly: 5 points</li>
                        <li>Rarely: 2 points</li>
                      </ul>
                    </div>
                    <div>
                      <span className="font-medium">4. Control Mitigation:</span> -2 points per control
                      <div className="ml-4 mt-1 text-xs">Each security control reduces risk by 2 points</div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-blue-300">
                      <span className="font-semibold">Total Score:</span> Data Type + User Count + Frequency + Control Mitigation
                      <div className="mt-2 text-xs">
                        <strong>Risk Levels:</strong> Critical (&gt;75), High (50-75), Medium (25-50), Low (&lt;25)
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-md p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-700">Current Risk Score:</span>
                    <RiskBadge level={tool.riskLevel} />
                  </div>
                  <div className="text-xs text-gray-600">
                    Score: <strong>{tool.riskScore}/100</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Data & Usage */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Data & Usage</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data Types
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {tool.dataTypes.map((type) => (
                      <span
                        key={type}
                        className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm"
                      >
                        {type}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Users</label>
                    <p className="mt-1 text-2xl font-bold text-gray-900">{tool.users}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Frequency</label>
                    <p className="mt-1 text-2xl font-bold text-gray-900">{tool.frequency}</p>
                  </div>
                </div>
                {tool.notes && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Notes</label>
                    <p className="mt-1 text-gray-600">{tool.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Security Controls */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Controls</h3>
              <div className="space-y-3">
                {tool.controls.length === 0 ? (
                  <p className="text-gray-600 text-sm">No controls configured</p>
                ) : (
                  tool.controls.map((control) => (
                    <div key={control} className="flex items-center gap-2">
                      <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-gray-700">{control}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Compliance */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Compliance</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">DPA Signed</span>
                  {tool.hasDPA ? (
                    <span className="inline-block px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                      ✓ Yes
                    </span>
                  ) : (
                    <span className="inline-block px-2 py-1 text-xs bg-red-100 text-red-800 rounded">
                      ✗ No
                    </span>
                  )}
                </div>
                {tool.dataResidency && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Data Residency</label>
                    <p className="mt-1 text-gray-600 text-sm">{tool.dataResidency}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Owner Information */}
            {toolOwner && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Tool Owner</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Name:</span> {toolOwner.name}
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Email:</span> {toolOwner.email}
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Role:</span> {toolOwner.role}
                  </div>
                </div>
              </div>
            )}

            {/* Metadata */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Metadata</h3>
              <div className="space-y-3 text-sm text-gray-600">
                <div>
                  <span className="font-medium text-gray-700">Created:</span> {new Date(tool.createdAt).toLocaleDateString()}
                </div>
                <div>
                  <span className="font-medium text-gray-700">Updated:</span> {new Date(tool.updatedAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <CommentsSection
          targetType="tool"
          targetId={toolId}
          currentUserId={toolOwner?.id}
        />
      </div>
    </AppLayout>
  );
}
