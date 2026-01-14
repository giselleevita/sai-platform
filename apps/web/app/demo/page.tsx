'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function DemoPage() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    company: '',
    role: '',
    notes: '',
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link href="/" className="text-blue-600 hover:text-blue-800 text-sm">
          ← Back to homepage
        </Link>
        <h1 className="mt-4 text-3xl font-bold">Request a demo</h1>
        <p className="mt-2 text-gray-600">
          We’ll walk you through AI governance flows: risk assessment, policy enforcement, decisions, and compliance snapshots.
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-4 bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Company</label>
              <input
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Role</label>
              <input
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Notes (optional)</label>
            <textarea
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              rows={3}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-md bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            Submit demo request
          </button>

          {submitted && (
            <p className="text-sm text-green-700 mt-2">
              Thanks! We’ll reach out shortly to schedule your demo.
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
