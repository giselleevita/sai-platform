type Org = {
  id: string;
  name: string;
  region: string;
};

const defaultOrgs: Org[] = [
  { id: 'org-acme-eu', name: 'Acme Manufacturing', region: 'EU' },
  { id: 'org-northstar-us', name: 'Northstar Health', region: 'US' },
  { id: 'org-orbit-uk', name: 'Orbit Fintech', region: 'UK' },
];

type OrgSwitcherProps = {
  activeOrgId?: string;
};

export function OrgSwitcher({ activeOrgId }: OrgSwitcherProps) {
  const selectedId = activeOrgId && defaultOrgs.some((o) => o.id === activeOrgId)
    ? activeOrgId
    : defaultOrgs[0].id;

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="org-switcher" className="text-sm text-gray-600">
        Organization
      </label>
      <select
        id="org-switcher"
        defaultValue={selectedId}
        className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
      >
        {defaultOrgs.map((org) => (
          <option key={org.id} value={org.id}>
            {org.name} ({org.region})
          </option>
        ))}
      </select>
    </div>
  );
}
