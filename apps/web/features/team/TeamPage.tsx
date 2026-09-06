'use client';

import { useCallback, useEffect, useState } from 'react';
import { AppLayout, ErrorAlert, LoadingSpinner, PageHeader } from '@/components/shared';
import { api } from '@/lib/api';

type Role = 'MANAGEMENT' | 'ADMIN' | 'OPERATOR' | 'AUDITOR';

type Member = {
  id: string;
  email: string;
  name: string;
  role: Role;
  mfaEnabled: boolean;
  disabledAt: string | null;
};

type Invitation = {
  id: string;
  email: string;
  role: Role;
  expiresAt: string;
  acceptedAt: string | null;
  revokedAt: string | null;
};

const ROLES: Role[] = ['MANAGEMENT', 'ADMIN', 'OPERATOR', 'AUDITOR'];

const ROLE_HELP: Record<Role, string> = {
  MANAGEMENT: 'Oversight and reporting',
  ADMIN: 'Full administration, including people',
  OPERATOR: 'Day to day work on the inventory and risks',
  AUDITOR: 'Read and review, no changes',
};

function invitationState(invitation: Invitation): 'accepted' | 'revoked' | 'expired' | 'pending' {
  if (invitation.acceptedAt) return 'accepted';
  if (invitation.revokedAt) return 'revoked';
  if (new Date(invitation.expiresAt).getTime() < Date.now()) return 'expired';
  return 'pending';
}

const STATE_STYLES: Record<string, string> = {
  accepted: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200',
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
  revoked: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  expired: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
};

export default function TeamPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [meId, setMeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<Role>('OPERATOR');
  const [inviting, setInviting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    const [me, users, invites] = await Promise.all([
      api.get<{ id?: string }>('/api/auth/me'),
      api.get<Member[]>('/api/users'),
      api.get<Invitation[]>('/api/invitations'),
    ]);
    if (me.success && me.data?.id) setMeId(me.data.id);
    if (!users.success) setError(users.error || 'Failed to load the team');
    setMembers(users.success && Array.isArray(users.data) ? users.data : []);
    setInvitations(invites.success && Array.isArray(invites.data) ? invites.data : []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const updateMember = async (member: Member, patch: { role?: Role; disabled?: boolean }) => {
    setError('');
    const previous = members;
    setMembers((current) =>
      current.map((row) =>
        row.id === member.id
          ? {
              ...row,
              ...(patch.role ? { role: patch.role } : {}),
              ...(patch.disabled === undefined
                ? {}
                : { disabledAt: patch.disabled ? new Date().toISOString() : null }),
            }
          : row,
      ),
    );
    const res = await api.patch(`/api/users/${member.id}`, patch);
    if (!res.success) {
      setMembers(previous);
      setError(res.error || 'Failed to update that person');
    }
  };

  const invite = async () => {
    setError('');
    setNotice('');
    if (!inviteEmail.trim()) {
      setError('An email address is required');
      return;
    }
    setInviting(true);
    const res = await api.post('/api/invitations', {
      email: inviteEmail.trim(),
      role: inviteRole,
    });
    setInviting(false);
    if (!res.success) {
      setError(res.error || 'Failed to send the invitation');
      return;
    }
    setInviteEmail('');
    setNotice(`Invitation created for ${inviteEmail.trim()}.`);
    await load();
  };

  const revoke = async (invitation: Invitation) => {
    setError('');
    const res = await api.patch(`/api/invitations/${invitation.id}/revoke`, {});
    if (!res.success) {
      setError(res.error || 'Failed to revoke the invitation');
      return;
    }
    await load();
  };

  return (
    <AppLayout>
      <PageHeader title="Team" subtitle="Who has access, what they can do, and who has been invited." />

      {error ? <ErrorAlert message={error} /> : null}
      {notice ? (
        <p className="mb-4 rounded-md bg-green-50 dark:bg-green-900/20 px-3 py-2 text-sm text-green-800 dark:text-green-200">
          {notice}
        </p>
      ) : null}

      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="space-y-8">
          <section>
            <h2 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
              People ({members.length})
            </h2>
            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800 text-sm">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Name</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Email</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Role</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">MFA</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Access</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800 bg-white dark:bg-gray-900">
                  {members.map((member) => {
                    const isSelf = member.id === meId;
                    const disabled = Boolean(member.disabledAt);
                    return (
                      <tr key={member.id}>
                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                          {member.name}
                          {isSelf ? (
                            <span className="ml-2 rounded bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 text-xs text-gray-600 dark:text-gray-300">
                              you
                            </span>
                          ) : null}
                        </td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{member.email}</td>
                        <td className="px-4 py-3">
                          <select
                            value={member.role}
                            // Changing your own role is how an administrator
                            // locks themselves out of their own tenant.
                            disabled={isSelf}
                            onChange={(e) => updateMember(member, { role: e.target.value as Role })}
                            aria-label={`Role for ${member.email}`}
                            title={isSelf ? 'You cannot change your own role' : ROLE_HELP[member.role]}
                            className="rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-2 py-1 text-xs text-gray-900 dark:text-gray-100 disabled:opacity-50"
                          >
                            {ROLES.map((role) => (
                              <option key={role} value={role}>
                                {role.toLowerCase()}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                          {member.mfaEnabled ? 'On' : <span className="text-amber-700 dark:text-amber-300">Off</span>}
                        </td>
                        <td className="px-4 py-3">
                          {isSelf ? (
                            <span className="text-xs text-gray-500 dark:text-gray-400">active</span>
                          ) : (
                            <button
                              onClick={() => updateMember(member, { disabled: !disabled })}
                              className="rounded-md border border-gray-300 dark:border-gray-700 px-2 py-1 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                            >
                              {disabled ? 'Re-enable' : 'Disable'}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">Invite someone</h2>
            <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
              <div className="grid gap-4 sm:grid-cols-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 sm:col-span-2">
                  Email
                  <input
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="colleague@example.com"
                    className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
                  />
                </label>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Role
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as Role)}
                    className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
                  >
                    {ROLES.map((role) => (
                      <option key={role} value={role}>
                        {role.toLowerCase()}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{ROLE_HELP[inviteRole]}</p>
              <button
                onClick={invite}
                disabled={inviting}
                className="mt-4 rounded-md bg-gray-900 dark:bg-gray-100 px-3 py-2 text-sm font-semibold text-white dark:text-gray-900 disabled:opacity-60"
              >
                {inviting ? 'Inviting…' : 'Send invitation'}
              </button>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
              Invitations ({invitations.length})
            </h2>
            {invitations.length === 0 ? (
              <p className="rounded-lg border border-dashed border-gray-300 dark:border-gray-700 p-6 text-center text-sm text-gray-500 dark:text-gray-400">
                No invitations yet.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800 text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Email</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Role</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Expires</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Status</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-800 bg-white dark:bg-gray-900">
                    {invitations.map((invitation) => {
                      const state = invitationState(invitation);
                      return (
                        <tr key={invitation.id}>
                          <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{invitation.email}</td>
                          <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                            {invitation.role.toLowerCase()}
                          </td>
                          <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                            {new Date(invitation.expiresAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`rounded px-2 py-1 text-xs font-semibold ${STATE_STYLES[state]}`}>
                              {state}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            {state === 'pending' ? (
                              <button
                                onClick={() => revoke(invitation)}
                                className="rounded-md border border-gray-300 dark:border-gray-700 px-2 py-1 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                              >
                                Revoke
                              </button>
                            ) : null}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}
    </AppLayout>
  );
}
