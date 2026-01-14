'use client';

import Link from 'next/link';
import { AppLayout } from '@/components/shared';

export default function GovernancePage() {
  return (
    <AppLayout>
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">Governance Registry</h1>
          <p className="mt-2 text-gray-600">
            Manage policies, controls, procedures, and regulations with clear ownership and lifecycle states.
          </p>
        </div>
      </div>
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-2">
          {[
            { title: "Policies", href: "/policies", desc: "Define governance intent and oversight." },
            { title: "Controls", href: "/controls", desc: "Map controls to policies and regulations." },
            { title: "Procedures", href: "/procedures", desc: "Document how controls are executed." },
            { title: "Regulations", href: "/regulations", desc: "Track regulatory obligations like NIS2." },
          ].map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:border-gray-300 hover:shadow-md transition-shadow"
            >
              <h2 className="text-lg font-semibold text-gray-900">{item.title}</h2>
              <p className="mt-1 text-sm text-gray-600">{item.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
