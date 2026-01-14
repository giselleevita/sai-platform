'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function Home() {
  const [showAuditorView, setShowAuditorView] = useState(false);
  return (
    <div className="bg-gray-50 text-gray-900">
      {/* Hero */}
      <section className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-16 lg:flex lg:items-center lg:gap-12">
          <div className="flex-1 space-y-6">
            <div className="space-y-3">
              <h1 className="text-4xl font-bold leading-tight sm:text-5xl">
                Govern every AI decision — with accountability, risk control, and audit-ready proof.
              </h1>
              <p className="text-lg text-gray-600">
                SAI is an enterprise AI governance platform that helps organizations assess AI risk, enforce policies, and
                prove compliance with regulations like the EU AI Act and NIS2.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/demo"
                className="inline-flex items-center justify-center rounded-md bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
              >
                Request demo
              </Link>
              <Link
                href="/governance-flow"
                className="inline-flex items-center justify-center rounded-md border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                See governance flow
              </Link>
              <Link
                href="/auth/login"
                className="inline-flex items-center justify-center rounded-md border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50"
              >
                Log in
              </Link>
            </div>
          </div>
          <div className="mt-10 flex-1 lg:mt-0">
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">AI Tool → Risk Score → Policy → Decision → Compliance Snapshot</h3>
              <div className="space-y-4">
                {[
                  { title: 'AI Tool', desc: 'Registered with owner and metadata' },
                  { title: 'Risk Score', desc: 'Automated, explainable scoring' },
                  { title: 'Policy', desc: 'Governance rules triggered' },
                  { title: 'Decision', desc: 'Accept / Mitigate / Reject with rationale' },
                  { title: 'Compliance Snapshot', desc: 'Point-in-time status recorded' },
                ].map((step, idx) => (
                  <div key={step.title} className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white font-semibold">
                      {idx + 1}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{step.title}</div>
                      <div className="text-sm text-gray-600">{step.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-b border-gray-200 bg-gray-900 text-white">
        <div className="mx-auto max-w-6xl px-6 py-4 flex flex-wrap items-center justify-between gap-3 text-sm font-medium">
          <span>Built for EU AI Act, NIS2, ISO 27001</span>
          <span>Enterprise RBAC</span>
          <span>Immutable audit trails</span>
          <span>Designed for regulators and auditors</span>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-6 py-16 space-y-16">
        {/* Problem statement */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold">AI adoption without governance is a compliance risk.</h2>
          <ul className="list-disc space-y-2 pl-5 text-gray-700">
            <li>AI tools are adopted without oversight</li>
            <li>No consistent risk assessment</li>
            <li>Decisions are undocumented</li>
            <li>No ownership or accountability</li>
            <li>Regulators ask questions you can’t answer</li>
          </ul>
        </section>

        {/* Core capabilities */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold">SAI Core Capabilities</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: 'AI Risk Assessment',
                items: ['Automated, explainable risk scoring', 'Data sensitivity, usage, controls'],
                icon: '🧠',
              },
              {
                title: 'Policy Enforcement',
                items: ['High-risk AI requires approval', 'Opinionated governance rules', 'No policy = escalation'],
                icon: '📜',
              },
              {
                title: 'Decision Accountability',
                items: ['Accept / Mitigate / Reject', 'Owner, rationale, expiry', 'Full decision history'],
                icon: '👤',
              },
              {
                title: 'Compliance Readiness',
                items: ['Real-time AI compliance status', 'High-risk AI overview', 'Point-in-time snapshots'],
                icon: '📊',
              },
            ].map((card) => (
              <div key={card.title} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2 text-lg font-semibold">
                  <span>{card.icon}</span> {card.title}
                </div>
                <ul className="mt-3 space-y-1 text-sm text-gray-700">
                  {card.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section id="governance-flow" className="space-y-6">
          <h2 className="text-2xl font-bold">How it works</h2>
          <div className="grid gap-4 md:grid-cols-5">
            {[
              { title: 'Register AI tool', desc: 'Owner and metadata captured' },
              { title: 'Risk score calculated', desc: 'Based on sensitivity, usage, controls' },
              { title: 'Policy triggered', desc: 'Governance rules applied by risk' },
              { title: 'Decision logged', desc: 'Accept / Mitigate / Reject with rationale' },
              { title: 'Compliance updated', desc: 'Point-in-time status recorded' },
            ].map((step, idx) => (
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
        </section>

        {/* Who it's for */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold">Who it’s for</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                title: 'Compliance Teams',
                bullets: ['Clear governance', 'Audit-ready documentation', 'Defined ownership'],
              },
              {
                title: 'Security Teams',
                bullets: ['Risk visibility', 'Policy enforcement', 'Incident traceability'],
              },
              {
                title: 'Management',
                bullets: ['Clear accountability', 'Board-level reporting', 'Decision transparency'],
              },
            ].map((col) => (
              <div key={col.title} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                <div className="text-lg font-semibold">{col.title}</div>
                <ul className="mt-3 space-y-1 text-sm text-gray-700">
                  {col.bullets.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Differentiation */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Why SAI is different</h2>
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-left">
                <tr>
                  <th className="px-4 py-3 font-semibold text-gray-700">SAI Platform</th>
                  <th className="px-4 py-3 font-semibold text-gray-700">Typical AI Usage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {[
                  ['Documented decisions', 'Ad-hoc approvals'],
                  ['Risk-based governance', 'Tool sprawl'],
                  ['Policy enforcement', 'Best-effort rules'],
                  ['Compliance snapshots', 'Manual reporting'],
                ].map(([left, right]) => (
                  <tr key={left}>
                    <td className="px-4 py-3 text-gray-900">{left}</td>
                    <td className="px-4 py-3 text-gray-600">{right}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Final CTA */}
        <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="space-y-3 text-center">
            <h3 className="text-2xl font-bold">AI governance is not optional. Be ready.</h3>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                href="/demo"
                className="inline-flex items-center justify-center rounded-md bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
              >
                Request demo
              </Link>
              <Link
                href="/governance-flow"
                className="inline-flex items-center justify-center rounded-md border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                View governance flow
              </Link>
            </div>
          </div>
        </section>

        {/* Auditor view modal */}
        {showAuditorView && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4">
            <div className="w-full max-w-4xl rounded-lg bg-white p-6 shadow-xl">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Auditor Mode (read-only)</h3>
                  <p className="text-sm text-gray-600">
                    Read-only access with time-limited links so auditors can verify evidence integrity without friction.
                  </p>
                </div>
                <button
                  onClick={() => setShowAuditorView(false)}
                  className="rounded-md border border-gray-300 px-3 py-1 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <h4 className="text-sm font-semibold text-gray-800">Evidence Record</h4>
                  <p className="text-sm text-gray-700 mt-2">File: SOC2-Controls.pdf</p>
                  <p className="text-xs text-gray-600">Hash: a3f9…c12e</p>
                  <p className="text-xs text-gray-600">Status: Locked</p>
                  <p className="text-xs text-gray-600">Owner: Compliance</p>
                </div>
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <h4 className="text-sm font-semibold text-gray-800">Audit Log</h4>
                  <ul className="mt-2 space-y-1 text-xs text-gray-700">
                    <li>2026-01-12 10:14Z — Hash verified</li>
                    <li>2026-01-12 10:10Z — Evidence locked by Compliance</li>
                    <li>2026-01-12 09:58Z — Uploaded by Owner</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
