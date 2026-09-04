/**
 * Seeds a demo tenant.
 *
 * Written for the public demo instance, where a visitor who lands on empty
 * tables learns nothing. Re-running is safe: every record is upserted on a
 * deterministic key, so the nightly reset is just this script again.
 *
 *   npm run db:seed --workspace @sai/api
 *
 * Risk scores are produced by the real scoring engine rather than typed in,
 * so the numbers on screen match what the platform would calculate for the
 * same input, model version included.
 */
import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { calculateRiskScore } from '@sai/risk-scoring';

const prisma = new PrismaClient();

const DEMO_COMPANY_EMAIL = 'demo@sai-platform.example';
const DEMO_USER_EMAIL = process.env.DEMO_USER_EMAIL || 'demo@sai-platform.example';
const DEMO_USER_PASSWORD = process.env.DEMO_USER_PASSWORD || 'demo-password-123';

type ToolSeed = {
  name: string;
  category: 'LLM' | 'CodeGen' | 'RPA' | 'Analytics' | 'Other';
  vendor: string;
  dataTypes: ('PII' | 'Financial' | 'IP' | 'Proprietary' | 'Public')[];
  users: number;
  frequency: 'Daily' | 'Weekly' | 'Rarely';
  controls: string[];
  hasDPA: boolean;
};

// A spread rather than a uniform set: the demo should show a Critical tool, a
// couple of Low ones, and an unclassified tool that the scoring engine treats
// as unassessed rather than safe.
const TOOLS: ToolSeed[] = [
  { name: 'Candidate screening assistant', category: 'LLM', vendor: 'Internal', dataTypes: ['PII'], users: 240, frequency: 'Daily', controls: ['MFA'], hasDPA: false },
  { name: 'Invoice reconciliation bot', category: 'RPA', vendor: 'UiPath', dataTypes: ['Financial', 'PII'], users: 120, frequency: 'Daily', controls: ['MFA', 'Encryption'], hasDPA: true },
  { name: 'Support ticket summariser', category: 'LLM', vendor: 'OpenAI', dataTypes: ['PII'], users: 85, frequency: 'Daily', controls: ['MFA', 'Encryption', 'Logging'], hasDPA: true },
  { name: 'Contract clause extractor', category: 'LLM', vendor: 'Anthropic', dataTypes: ['IP', 'Proprietary'], users: 30, frequency: 'Weekly', controls: ['MFA', 'Encryption', 'Access Review'], hasDPA: true },
  { name: 'Code completion', category: 'CodeGen', vendor: 'GitHub', dataTypes: ['IP'], users: 60, frequency: 'Daily', controls: ['SSO', 'Logging'], hasDPA: true },
  { name: 'Marketing copy generator', category: 'LLM', vendor: 'Jasper', dataTypes: ['Public'], users: 12, frequency: 'Weekly', controls: ['SSO'], hasDPA: false },
  { name: 'Churn prediction model', category: 'Analytics', vendor: 'Internal', dataTypes: ['PII', 'Financial'], users: 8, frequency: 'Weekly', controls: ['Encryption', 'Access Review', 'Logging'], hasDPA: true },
  { name: 'Meeting transcription', category: 'Other', vendor: 'Otter', dataTypes: ['PII', 'Proprietary'], users: 310, frequency: 'Daily', controls: [], hasDPA: false },
  { name: 'Sales forecast dashboard', category: 'Analytics', vendor: 'Internal', dataTypes: ['Financial'], users: 25, frequency: 'Weekly', controls: ['SSO', 'Logging'], hasDPA: true },
  { name: 'Translation service', category: 'Other', vendor: 'DeepL', dataTypes: ['Proprietary'], users: 40, frequency: 'Rarely', controls: ['Encryption'], hasDPA: true },
  { name: 'Internal knowledge search', category: 'LLM', vendor: 'Glean', dataTypes: [], users: 150, frequency: 'Daily', controls: ['SSO'], hasDPA: false },
  { name: 'Image background removal', category: 'Other', vendor: 'Remove.bg', dataTypes: ['Public'], users: 5, frequency: 'Rarely', controls: [], hasDPA: false },
];

const CONTROLS = [
  { name: 'Access reviews for AI tools', description: 'Quarterly review of who can reach each registered tool.' },
  { name: 'Data protection agreements', description: 'A signed DPA is held for every vendor processing personal data.' },
  { name: 'Human oversight of automated decisions', description: 'A named reviewer signs off decisions that affect a person.' },
  { name: 'Post-market monitoring', description: 'Model behaviour and incidents are reviewed on a monthly cadence.' },
];

const RISKS = [
  { title: 'Personal data sent to a vendor without a DPA', category: 'Privacy', likelihood: 4, impact: 5 },
  { title: 'Shadow AI tools adopted outside the inventory', category: 'Governance', likelihood: 4, impact: 3 },
  { title: 'Screening model produces biased shortlists', category: 'Fairness', likelihood: 3, impact: 5 },
  { title: 'Vendor changes model version without notice', category: 'Supply chain', likelihood: 3, impact: 3 },
];

const INCIDENTS = [
  { title: 'Transcription tool retained recordings past policy', severity: 'HIGH', description: 'Recordings older than 30 days were still retrievable from the vendor console.' },
  { title: 'Code assistant suggested a licensed snippet', severity: 'MEDIUM', description: 'Flagged during review; snippet removed before merge.' },
];

const GPAI = [
  { provider: 'MLFLOW' as const, displayName: 'Support summariser', modelFamily: 'llama-3-8b-instruct', transparencySummary: 'Summarises support threads. Trained by the provider on public web data. Not used for decisions about individuals.', euDeclarationRef: 'EU-DEC-2026-0412' },
  { provider: 'SAGEMAKER' as const, displayName: 'Churn scorer', modelFamily: 'xgboost-1.7', transparencySummary: 'Predicts renewal likelihood from account telemetry. Reviewed quarterly against outcome data.', euDeclarationRef: null },
  { provider: 'VERTEX_AI' as const, displayName: 'Document classifier', modelFamily: 'gemini-flash', transparencySummary: null, euDeclarationRef: null },
];

async function main() {
  const company = await prisma.company.upsert({
    where: { email: DEMO_COMPANY_EMAIL },
    update: {},
    create: {
      name: 'Northwind Demo',
      email: DEMO_COMPANY_EMAIL,
      industry: 'Software',
      country: 'Denmark',
    },
  });

  const user = await prisma.user.upsert({
    where: { email: DEMO_USER_EMAIL },
    update: { companyId: company.id },
    create: {
      email: DEMO_USER_EMAIL,
      name: 'Demo User',
      password: await bcrypt.hash(DEMO_USER_PASSWORD, 10),
      role: UserRole.ADMIN,
      companyId: company.id,
    },
  });

  await prisma.userCompanyMembership.upsert({
    where: { userId_companyId: { userId: user.id, companyId: company.id } },
    update: { role: UserRole.ADMIN },
    create: { userId: user.id, companyId: company.id, role: UserRole.ADMIN },
  });

  // Tools, scored by the real engine so the demo shows what the platform
  // would actually calculate.
  let tools = 0;
  for (const seed of TOOLS) {
    const score = calculateRiskScore({
      name: seed.name,
      category: seed.category,
      dataTypes: seed.dataTypes,
      users: seed.users,
      frequency: seed.frequency,
      controls: seed.controls,
    });

    const existing = await prisma.aITool.findFirst({
      where: { companyId: company.id, name: seed.name },
    });

    const data = {
      companyId: company.id,
      name: seed.name,
      category: seed.category,
      vendor: seed.vendor,
      dataTypes: seed.dataTypes,
      users: seed.users,
      frequency: seed.frequency,
      controls: seed.controls,
      riskScore: score.score,
      riskLevel: score.level,
      hasDPA: seed.hasDPA,
      ownerId: user.id,
    };

    const tool = existing
      ? await prisma.aITool.update({ where: { id: existing.id }, data })
      : await prisma.aITool.create({ data });

    const history = await prisma.riskScore.findFirst({ where: { toolId: tool.id } });
    if (!history) {
      await prisma.riskScore.create({
        data: {
          companyId: company.id,
          toolId: tool.id,
          score: score.score,
          level: score.level,
          factors: score.factors,
          recommendations: score.recommendations,
          modelVersion: score.modelVersion,
        },
      });
    }
    tools += 1;
  }

  const controlIds: string[] = [];
  for (const control of CONTROLS) {
    const existing = await prisma.control.findFirst({
      where: { companyId: company.id, name: control.name },
    });
    const row = existing
      ? existing
      : await prisma.control.create({
          data: {
            companyId: company.id,
            name: control.name,
            description: control.description,
            status: 'ACTIVE',
            ownerId: user.id,
          },
        });
    controlIds.push(row.id);
  }

  let evidence = 0;
  for (const [index, controlId] of controlIds.entries()) {
    const existing = await prisma.evidence.findFirst({ where: { companyId: company.id, controlId } });
    if (!existing) {
      await prisma.evidence.create({
        data: {
          companyId: company.id,
          controlId,
          source: 'Manual upload',
          // A demo with every item approved teaches nothing about the queue.
          status: index === 0 ? 'APPROVED' : index === 1 ? 'SUBMITTED' : index === 2 ? 'EXPIRED' : 'MISSING',
        },
      });
      evidence += 1;
    }
  }

  let risks = 0;
  for (const risk of RISKS) {
    const existing = await prisma.risk.findFirst({ where: { companyId: company.id, title: risk.title } });
    if (!existing) {
      await prisma.risk.create({ data: { companyId: company.id, ...risk } });
      risks += 1;
    }
  }

  let incidents = 0;
  for (const incident of INCIDENTS) {
    const existing = await prisma.incident.findFirst({ where: { companyId: company.id, title: incident.title } });
    if (!existing) {
      await prisma.incident.create({
        data: {
          companyId: company.id,
          title: incident.title,
          severity: incident.severity,
          description: incident.description,
        },
      });
      incidents += 1;
    }
  }

  let models = 0;
  for (const model of GPAI) {
    const existing = await prisma.mLIntegration.findFirst({
      where: { companyId: company.id, displayName: model.displayName },
    });
    if (!existing) {
      await prisma.mLIntegration.create({
        data: {
          companyId: company.id,
          provider: model.provider,
          displayName: model.displayName,
          status: 'ACTIVE',
          config: {
            modelFamily: model.modelFamily,
            transparencySummary: model.transparencySummary,
            euDeclarationRef: model.euDeclarationRef,
          },
        },
      });
      models += 1;
    }
  }

  console.log(
    [
      `Seeded ${company.name} (${company.id})`,
      `  sign in: ${DEMO_USER_EMAIL} / ${DEMO_USER_PASSWORD}`,
      `  tools: ${tools}`,
      `  controls: ${controlIds.length}, evidence created: ${evidence}`,
      `  risks created: ${risks}, incidents created: ${incidents}`,
      `  general-purpose models created: ${models}`,
    ].join('\n')
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
