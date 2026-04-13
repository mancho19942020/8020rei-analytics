/**
 * PCM Validation Routes
 *
 * Serves reconciliation data comparing our Aurora data against PostcardMania's API.
 * All PCM API interactions happen through the reconciliation service (background job),
 * not during request handling.
 */

import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { PcmReconciliationService } from '../services/pcm-reconciliation.js';

let reconciliationService: PcmReconciliationService | null = null;

export async function pcmValidationRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions
) {
  // Lazy-init and start the reconciliation service
  fastify.addHook('onRequest', async () => {
    if (!reconciliationService) {
      reconciliationService = new PcmReconciliationService();
      reconciliationService.start();
    }
  });

  /**
   * GET /summary
   * Full reconciliation summary — used by the overview widget
   */
  fastify.get('/summary', async (_request, reply) => {
    const summary = reconciliationService?.getSummary();

    if (!summary) {
      return reply.code(200).send({
        success: true,
        data: null,
        message: 'Reconciliation has not run yet. It will start automatically.',
        timestamp: new Date().toISOString(),
      });
    }

    return {
      success: true,
      data: summary,
      timestamp: new Date().toISOString(),
    };
  });

  /**
   * GET /domain-breakdown
   * Per-domain reconciliation data — used by domain table widget
   */
  fastify.get('/domain-breakdown', async (_request, reply) => {
    const summary = reconciliationService?.getSummary();

    if (!summary) {
      return reply.code(200).send({
        success: true,
        data: [],
        timestamp: new Date().toISOString(),
      });
    }

    return {
      success: true,
      data: summary.domainBreakdown,
      timestamp: new Date().toISOString(),
    };
  });

  /**
   * GET /designs
   * PCM design catalog — shows what templates are available
   */
  fastify.get('/designs', async (_request, reply) => {
    const summary = reconciliationService?.getSummary();

    if (!summary) {
      return reply.code(200).send({
        success: true,
        data: [],
        timestamp: new Date().toISOString(),
      });
    }

    return {
      success: true,
      data: summary.pcmDesigns,
      timestamp: new Date().toISOString(),
    };
  });

  /**
   * GET /status-comparison
   * Status distribution comparison between Aurora and PCM
   */
  fastify.get('/status-comparison', async (_request, reply) => {
    const summary = reconciliationService?.getSummary();

    if (!summary) {
      return reply.code(200).send({
        success: true,
        data: { aurora: {}, pcm: {} },
        timestamp: new Date().toISOString(),
      });
    }

    return {
      success: true,
      data: {
        pcm: summary.pcmStatusDistribution,
        aurora: {
          totalSends: summary.auroraTotalSends,
          totalDelivered: summary.auroraTotalDelivered,
        },
      },
      timestamp: new Date().toISOString(),
    };
  });

  /**
   * POST /trigger
   * Manually trigger a reconciliation run (for debugging/admin)
   */
  fastify.post('/trigger', async (_request, reply) => {
    if (!reconciliationService?.isConfigured()) {
      return reply.code(503).send({
        success: false,
        error: 'PCM reconciliation service is not configured',
      });
    }

    const summary = await reconciliationService.triggerManual();

    return {
      success: true,
      data: summary,
      timestamp: new Date().toISOString(),
    };
  });
}
