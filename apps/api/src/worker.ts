import { logger } from './utils';
import { ScheduledReportsService } from './modules/reports';
import { verifyRecentAttachments } from './services/attachments/verify-attachments';

async function main() {
  logger.info('✅ Worker starting');

  try {
    await ScheduledReportsService.initializeAllReports();
    logger.info('✅ Scheduled reports initialized');
  } catch (e) {
    logger.error('Worker failed to initialize scheduled reports', e);
  }

  if (process.env.ATTACHMENTS_VERIFY_ENABLED === 'true') {
    const lookbackHours = Number(process.env.ATTACHMENTS_VERIFY_LOOKBACK_HOURS || '24');
    const limit = Number(process.env.ATTACHMENTS_VERIFY_LIMIT || '200');
    const intervalMs = Number(process.env.ATTACHMENTS_VERIFY_INTERVAL_MS || String(60 * 60 * 1000));

    const run = async () => {
      try {
        const out = await verifyRecentAttachments({ lookbackHours, limit });
        logger.info('✅ Attachment verification run complete', out);
      } catch (e) {
        logger.error('Attachment verification run failed', e);
      }
    };

    // run once on startup, then on interval
    await run();
    setInterval(() => void run(), intervalMs).unref();
  }

  // Keep process alive; cron triggers run inside ScheduledReportsService.
  setInterval(() => undefined, 60_000).unref();
}

main().catch((e) => {
  logger.error('Worker crashed', e);
  process.exitCode = 1;
});

