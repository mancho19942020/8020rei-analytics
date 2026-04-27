/**
 * Email-based access control for internal tools.
 * Design Kit button is only visible to platform contributors.
 */

const DESIGN_KIT_AUTHORIZED_EMAILS: string[] = [
  'german@8020rei.com',
  'camilo.rico@8020rei.com',
  'juliana@8020rei.com',
  'nicolas.hernandez@8020rei.com',
  'johan.mujica@8020rei.com',
];

export function canAccessDesignKit(email: string | null | undefined): boolean {
  if (!email) return false;
  return DESIGN_KIT_AUTHORIZED_EMAILS.includes(email.toLowerCase());
}

/**
 * Platform Analytics tab is only visible to German (product owner).
 */
const PLATFORM_ANALYTICS_AUTHORIZED_EMAILS: string[] = [
  'german@8020rei.com',
];

export function canAccessPlatformAnalytics(email: string | null | undefined): boolean {
  if (!email) return false;
  return PLATFORM_ANALYTICS_AUTHORIZED_EMAILS.includes(email.toLowerCase());
}

/**
 * DM Campaign Alerts sub-tab is only visible to German while it's piloting.
 * Restrict to product-owner email until the experience is validated.
 */
const DM_ALERTS_AUTHORIZED_EMAILS: string[] = [
  'german@8020rei.com',
];

export function canAccessDmAlerts(email: string | null | undefined): boolean {
  if (!email) return false;
  return DM_ALERTS_AUTHORIZED_EMAILS.includes(email.toLowerCase());
}
