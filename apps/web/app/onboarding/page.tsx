'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/shared';

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [completed, setCompleted] = useState(false);

  const steps = [
    {
      title: 'Welcome to SAI Platform',
      content: (
        <div className="space-y-4">
          <p className="text-gray-600">
            SAI Platform helps you manage AI tool risks, ensure compliance, and maintain governance.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">What you can do:</h4>
            <ul className="list-disc list-inside text-blue-800 space-y-1">
              <li>Track all AI tools used in your organization</li>
              <li>Assess and manage risks</li>
              <li>Ensure compliance with regulations</li>
              <li>Generate comprehensive reports</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      title: 'Add Your First AI Tool',
      content: (
        <div className="space-y-4">
          <p className="text-gray-600">
            Start by adding AI tools your organization uses. Each tool will be automatically assessed for risk.
          </p>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-700">
              <strong>Tip:</strong> Include all AI tools, even internal ones. The more complete your inventory, the better your risk assessment.
            </p>
          </div>
          <button
            onClick={() => {
              router.push('/inventory/add');
              setCompleted(true);
            }}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Add Your First Tool
          </button>
        </div>
      ),
    },
    {
      title: 'Review Risks',
      content: (
        <div className="space-y-4">
          <p className="text-gray-600">
            Review and manage risks associated with your AI tools. High-risk tools require immediate attention.
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <strong>Important:</strong> Critical and High risks should be reviewed by management and may require additional controls.
            </p>
          </div>
          <button
            onClick={() => {
              router.push('/risks');
              setCompleted(true);
            }}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            View Risk Register
          </button>
        </div>
      ),
    },
    {
      title: 'Set Up Policies',
      content: (
        <div className="space-y-4">
          <p className="text-gray-600">
            Create policies and controls to govern AI tool usage in your organization.
          </p>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-800">
              <strong>Best Practice:</strong> Start with an AI Usage Policy, then add specific controls for high-risk scenarios.
            </p>
          </div>
          <button
            onClick={() => {
              router.push('/policies');
              setCompleted(true);
            }}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Go to Policies
          </button>
        </div>
      ),
    },
    {
      title: 'Generate Reports',
      content: (
        <div className="space-y-4">
          <p className="text-gray-600">
            Generate comprehensive reports for stakeholders, auditors, and compliance reviews.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg p-3">
              <h4 className="font-semibold text-sm mb-1">Risk Assessment</h4>
              <p className="text-xs text-gray-600">Comprehensive risk analysis</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-3">
              <h4 className="font-semibold text-sm mb-1">Compliance</h4>
              <p className="text-xs text-gray-600">Compliance status report</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-3">
              <h4 className="font-semibold text-sm mb-1">Executive Summary</h4>
              <p className="text-xs text-gray-600">High-level overview</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-3">
              <h4 className="font-semibold text-sm mb-1">Custom Reports</h4>
              <p className="text-xs text-gray-600">Build your own</p>
            </div>
          </div>
          <button
            onClick={() => {
              router.push('/reports');
              setCompleted(true);
            }}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Go to Reports
          </button>
        </div>
      ),
    },
  ];

  const handleNext = () => {
    if (step < steps.length) {
      setStep(step + 1);
    } else {
      setCompleted(true);
    }
  };

  const handleSkip = () => {
    localStorage.setItem('onboarding_completed', 'true');
    router.push('/dashboard');
  };

  if (completed) {
    localStorage.setItem('onboarding_completed', 'true');
    return (
      <AppLayout>
        <div className="max-w-2xl mx-auto py-12 px-4">
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="text-6xl mb-4">✅</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Onboarding Complete!</h1>
            <p className="text-gray-600 mb-6">
              You're all set! Start exploring the platform and managing your AI tools.
            </p>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto py-12 px-4">
        <div className="bg-white rounded-lg shadow p-8">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Step {step} of {steps.length}
              </span>
              <span className="text-sm text-gray-500">
                {Math.round((step / steps.length) * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(step / steps.length) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Step Content */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{steps[step - 1].title}</h2>
            <div className="text-gray-600">{steps[step - 1].content}</div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between">
            <button
              onClick={handleSkip}
              className="px-4 py-2 text-gray-600 hover:text-gray-900"
            >
              Skip Onboarding
            </button>
            <div className="flex gap-3">
              {step > 1 && (
                <button
                  onClick={() => setStep(step - 1)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Previous
                </button>
              )}
              <button
                onClick={handleNext}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                {step === steps.length ? 'Finish' : 'Next'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
