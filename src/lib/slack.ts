/**
 * Slack Client
 *
 * Sends formatted messages to Slack channels via the Web API (chat.postMessage).
 * Supports threaded replies for structured daily digests.
 * Supports multiple channels via optional channelId parameter.
 *
 * Required env vars:
 *   SLACK_BOT_TOKEN                  — Bot User OAuth Token (xoxb-...)
 *   SLACK_DM_ALERTS_CHANNEL_ID       — Channel ID for #dm-campaign-alerts (operational health)
 *   SLACK_BUSINESS_ALERTS_CHANNEL_ID — Channel ID for #dm-business-alerts (business results)
 *
 * Falls back to legacy webhook (SLACK_DM_ALERTS_WEBHOOK_URL) if bot token is not set.
 */

const BOT_TOKEN = process.env.SLACK_BOT_TOKEN || '';
const DM_ALERTS_CHANNEL = process.env.SLACK_DM_ALERTS_CHANNEL_ID || '';
const BUSINESS_ALERTS_CHANNEL = process.env.SLACK_BUSINESS_ALERTS_CHANNEL_ID || '';
const DM_ALERTS_WEBHOOK = process.env.SLACK_DM_ALERTS_WEBHOOK_URL || '';

export function isSlackConfigured(): boolean {
  return (BOT_TOKEN.length > 0 && DM_ALERTS_CHANNEL.length > 0) || DM_ALERTS_WEBHOOK.length > 0;
}

export function isBusinessAlertsConfigured(): boolean {
  return BOT_TOKEN.length > 0 && BUSINESS_ALERTS_CHANNEL.length > 0;
}

export function isThreadingSupported(): boolean {
  return BOT_TOKEN.length > 0 && DM_ALERTS_CHANNEL.length > 0;
}

/**
 * Post a message to a Slack channel. Returns the message `ts` (for threading).
 * @param payload  Message content
 * @param channelId  Optional channel override (defaults to #dm-campaign-alerts)
 */
export async function sendSlackMessage(payload: SlackMessage, channelId?: string): Promise<string | null> {
  const channel = channelId || DM_ALERTS_CHANNEL;
  if (BOT_TOKEN && channel) {
    return postViaWebApi(payload, undefined, channel);
  }
  // Fallback to legacy webhook (no threading, returns null)
  if (DM_ALERTS_WEBHOOK) {
    const ok = await postViaWebhook(payload);
    return ok ? 'webhook' : null;
  }
  console.log('[Slack] Not configured — missing SLACK_BOT_TOKEN + channel ID or SLACK_DM_ALERTS_WEBHOOK_URL');
  return null;
}

/**
 * Post a threaded reply to an existing message.
 * Requires Web API (bot token). Returns the reply `ts` or null.
 * @param channelId  Optional channel override (defaults to #dm-campaign-alerts)
 */
export async function sendSlackThreadReply(
  threadTs: string,
  payload: SlackMessage,
  channelId?: string,
): Promise<string | null> {
  const channel = channelId || DM_ALERTS_CHANNEL;
  if (!BOT_TOKEN || !channel) {
    console.log('[Slack] Threading requires SLACK_BOT_TOKEN + channel ID');
    return null;
  }

  return postViaWebApi(payload, threadTs, channel);
}

/** Get the business alerts channel ID */
export function getBusinessAlertsChannelId(): string {
  return BUSINESS_ALERTS_CHANNEL;
}

// ---------------------------------------------------------------------------
// Web API (chat.postMessage)
// ---------------------------------------------------------------------------

async function postViaWebApi(
  payload: SlackMessage,
  threadTs?: string,
  channel?: string,
): Promise<string | null> {
  try {
    const body: Record<string, unknown> = {
      channel: channel || DM_ALERTS_CHANNEL,
      text: payload.text,
      unfurl_links: payload.unfurl_links ?? false,
    };

    if (payload.blocks) {
      body.blocks = payload.blocks;
    }
    if (threadTs) {
      body.thread_ts = threadTs;
    }

    const res = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${BOT_TOKEN}`,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json() as { ok: boolean; ts?: string; error?: string };

    if (!data.ok) {
      console.error(`[Slack] Web API error: ${data.error}`);
      return null;
    }

    return data.ts || null;
  } catch (err) {
    console.error('[Slack] Failed to send via Web API:', err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Legacy webhook (fallback)
// ---------------------------------------------------------------------------

async function postViaWebhook(payload: SlackMessage): Promise<boolean> {
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
    console.error('[Slack] Failed to send via webhook:', err);
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
