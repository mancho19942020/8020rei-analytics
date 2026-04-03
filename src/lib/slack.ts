/**
 * Slack Webhook Client
 *
 * Sends formatted messages to Slack channels via Incoming Webhooks.
 * Used by the DM Campaign alert system to notify #dm-campaign-alerts.
 */

const DM_ALERTS_WEBHOOK = process.env.SLACK_DM_ALERTS_WEBHOOK_URL || '';

export function isSlackConfigured(): boolean {
  return DM_ALERTS_WEBHOOK.length > 0;
}

/**
 * Send a message to the #dm-campaign-alerts Slack channel.
 */
export async function sendSlackMessage(payload: SlackMessage): Promise<boolean> {
  if (!DM_ALERTS_WEBHOOK) {
    console.log('[Slack] Not configured — missing SLACK_DM_ALERTS_WEBHOOK_URL');
    return false;
  }

  try {
    const res = await fetch(DM_ALERTS_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      console.error(`[Slack] Webhook failed: ${res.status} ${await res.text()}`);
      return false;
    }

    return true;
  } catch (err) {
    console.error('[Slack] Failed to send message:', err);
    return false;
  }
}

// ---------------------------------------------------------------------------
// Slack Block Kit types (subset)
// ---------------------------------------------------------------------------

export interface SlackMessage {
  text: string; // Fallback text for notifications
  blocks?: SlackBlock[];
  unfurl_links?: boolean;
}

export type SlackBlock =
  | SlackHeaderBlock
  | SlackSectionBlock
  | SlackDividerBlock
  | SlackContextBlock;

interface SlackHeaderBlock {
  type: 'header';
  text: { type: 'plain_text'; text: string; emoji?: boolean };
}

interface SlackSectionBlock {
  type: 'section';
  text: { type: 'mrkdwn'; text: string };
}

interface SlackDividerBlock {
  type: 'divider';
}

interface SlackContextBlock {
  type: 'context';
  elements: { type: 'mrkdwn'; text: string }[];
}
