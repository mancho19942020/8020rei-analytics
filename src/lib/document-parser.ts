/**
 * Document Parser for Engagement Call Reports
 *
 * Extracts structured client insights (pain points + opportunities)
 * from engagement call documents stored in Google Drive.
 *
 * These documents follow specific formats from UX research reports:
 * - Google Docs: Numbered sections (2.1, 3.1) with headings per client
 * - Word Docs: Separator-delimited blocks with client names as titles
 *
 * Each client section typically contains:
 * - Observed usage pattern / workflow
 * - Key insights / explicit needs
 * - Pain points (labeled as "Implicit pain points", "Implicit friction", etc.)
 * - Opportunities / product bets
 */

export interface ClientInsight {
  clientName: string;
  participant?: string; // Contact person name
  date?: string; // Date of the engagement call
  csName?: string; // Customer Success rep name
  painPoints: string[];
  opportunities: string[];
}

export interface ParsedDocument {
  clients: ClientInsight[];
  clientNames: string[];
  researchOwner?: string;
  dateRange?: string;
}

// Sub-section headings that indicate pain points
const PAIN_SECTION_PATTERNS = [
  /implicit\s*pain\s*point/i,
  /implicit\s*friction/i,
  /key\s*explicit\s*need/i,
  /latent.*need/i,
  /friction.*risk/i,
  /pain\s*point/i,
  /challenge/i,
];

// Sub-section headings that indicate opportunities
const OPPORTUNITY_SECTION_PATTERNS = [
  /opportunit/i,
  /product\s*bet/i,
  /recommendation/i,
];

// Patterns to skip (not client sections)
const NON_CLIENT_PATTERNS = [
  /^(customer\s+engagement|ux\s+research|engagement\s+calls?\s+analysis)/i,
  /^research\s+(context|scope|owner|type)/i,
  /^(high-level\s+)?executive\s+summary/i,
  /^cross[\s-]call\s+pattern/i,
  /^cross[\s-]interview/i,
  /^(key\s+)?opportunity\s+area/i,
  /^(general\s+)?opportunities$/i,
  /^strategic\s+(implication|takeaway)/i,
  /^recommendation/i,
  /^final\s+takeaway/i,
  /^research[\s-]driven\s+opportunit/i,
  /^appendix/i,
  /^asana[\s-]ready/i,
  /^action\s+item/i,
  /^cross[\s-]call\s+theme/i,
  /^methodology/i,
  /^interview\s+(summar|analys)/i,
  /^call[\s-]by[\s-]call/i,
  /^shared\s+usage/i,
  /^recurring\s+friction/i,
  /^what\s+customers\s+consistently/i,
  /^where\s+friction/i,
  /^platform\s+perception/i,
  /^ui\s+usage/i,
  /^automation\s+is/i,
  /^context\s*&?\s*goal/i,
  /^observed\s+(usage|behavior|workflow)/i,
  /^key\s+(insight|explicit)/i,
  /^how\s+they\s+use/i,
  /^why\s+feedback/i,
  /^ux\s+(research\s+)?takeaway/i,
  /^ux\s*\/?\s*product\s+insight/i,
  /^core\s+insight/i,
  /^signal\s+strength/i,
  /^(advanced|delegated|operational)\s/i,
  /^\d+\.\s*(research|interview|cross|key|strategic|final|recommendation)/i,
];

// Top-level section headings that indicate end of client sections (used for boundary stopping)
// These are distinct from NON_CLIENT_PATTERNS which prevent false client name matching.
const GLOBAL_SECTION_PATTERNS = [
  /^(customer\s+engagement|ux\s+research|engagement\s+calls?\s+analysis)/i,
  /^(high-level\s+)?executive\s+summary/i,
  /^cross[\s-]call\s+(pattern|theme)/i,
  /^cross[\s-]interview/i,
  /^(key\s+)?opportunity\s+area/i,
  /^(general\s+)?opportunities$/i,
  /^strategic\s+(implication|takeaway)/i,
  /^final\s+takeaway/i,
  /^research[\s-]driven\s+opportunit/i,
  /^appendix/i,
  /^asana[\s-]ready/i,
  /^interview\s+(summar|analys)/i,
  /^call[\s-]by[\s-]call/i,
  /^recurring\s+friction/i,
  /^recommendation/i,
  /^methodology/i,
  /^\d+\.\s*(research|interview|cross|key|strategic|final|recommendation)/i,
];

/**
 * Strip HTML tags and decode entities
 */
function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/?(p|div|li|tr)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&ne;/g, '≠')
    .replace(/&rarr;/g, '→')
    .replace(/&larr;/g, '←')
    .replace(/&ldquo;/g, '"')
    .replace(/&rdquo;/g, '"')
    .replace(/&lsquo;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&aacute;/g, 'á')
    .replace(/&Aacute;/g, 'Á')
    .replace(/&eacute;/g, 'é')
    .replace(/&hellip;/g, '…')
    .replace(/&#\d+;/g, '') // Remove remaining numeric entities
    .replace(/&\w+;/g, '') // Remove any remaining named entities
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Extract bullet points from an HTML fragment
 */
function extractBulletPoints(html: string): string[] {
  const points: string[] = [];

  // Extract from <li> tags
  const liRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
  let match;
  while ((match = liRegex.exec(html)) !== null) {
    const text = stripHtml(match[1]).trim();
    if (text && text.length > 8) {
      points.push(text);
    }
  }

  // If no <li> found, try plain text lines (for Word docs without list markup)
  if (points.length === 0) {
    const text = stripHtml(html);
    const lines = text.split('\n');
    for (const line of lines) {
      const cleaned = line.replace(/^[\s•\-–—*]+/, '').trim();
      if (cleaned && cleaned.length > 8) {
        points.push(cleaned);
      }
    }
  }

  return points;
}

/**
 * Check if a heading matches a client section pattern
 * Patterns:
 *   - "2.1 Client Name", "3.1 Client Name — Archetype"
 *   - "Call 1: Client Name", "Call 7: SBD Housing Solutions"
 */
function extractClientFromHeading(heading: string): string | null {
  // Pattern 1: "X.Y Client Name" or "X.Y Client Name (date)" or "X.Y Client Name / Person"
  const numbered = heading.match(/^\d+\.\d+\s+(.+)/);
  if (numbered) {
    let name = numbered[1]
      .replace(/\s*—\s*$/, '') // Remove trailing dash
      .replace(/\s*\(.*$/, '') // Remove parenthetical like "(Jan 12)"
      .replace(/\s*\/\s*[A-Z][a-z]+\s+[A-Z][a-z]+$/, '') // Remove "/ Person Name" but keep if it's part of company
      .trim();

    // Skip if it matches a non-client pattern
    if (NON_CLIENT_PATTERNS.some((p) => p.test(name))) {
      return null;
    }

    return name || null;
  }

  // Pattern 2: "Call N: Client Name"
  const callMatch = heading.match(/^Call\s+\d+:\s*(.+)/i);
  if (callMatch) {
    const name = callMatch[1].trim();
    if (!NON_CLIENT_PATTERNS.some((p) => p.test(name))) {
      return name || null;
    }
  }

  return null;
}

/**
 * Extract metadata (Contact, Date, CSM) from bold-label table format
 * Pattern: <strong>Client</strong> Name \n <strong>Contact</strong> Person \n ...
 */
function extractMetadataFromBoldLabels(contentHtml: string): {
  participant?: string;
  date?: string;
  csName?: string;
} {
  const result: { participant?: string; date?: string; csName?: string } = {};

  // Look for bold label followed by text: <strong>Label</strong> Value
  // or in table cells: <td><strong>Label</strong></td><td>Value</td>
  const text = stripHtml(contentHtml);
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // "Contact" or "Contact:" followed by name on same or next line
    if (/^Contact$/i.test(line) && i + 1 < lines.length) {
      result.participant = lines[i + 1].trim();
    } else if (/^Contact:\s*(.+)/i.test(line)) {
      result.participant = line.replace(/^Contact:\s*/i, '').trim();
    }
    // "Date" label
    if (/^Date$/i.test(line) && i + 1 < lines.length) {
      result.date = lines[i + 1].trim();
    } else if (/^Date:\s*(.+)/i.test(line)) {
      result.date = line.replace(/^Date:\s*/i, '').trim();
    }
    // "CSM" label
    if (/^CSM$/i.test(line) && i + 1 < lines.length) {
      result.csName = lines[i + 1].trim();
    } else if (/^CSM:\s*(.+)/i.test(line)) {
      result.csName = line.replace(/^CSM:\s*/i, '').trim();
    }
  }

  return result;
}

/**
 * Check if a heading is a sub-section within a client section
 */
function isPainSection(heading: string): boolean {
  return PAIN_SECTION_PATTERNS.some((p) => p.test(heading));
}

function isOpportunitySection(heading: string): boolean {
  return OPPORTUNITY_SECTION_PATTERNS.some((p) => p.test(heading));
}

interface HtmlSection {
  heading: string;
  headingLevel: number;
  content: string;
  startIndex: number;
}

/**
 * Parse HTML document into sections based on headings
 */
function parseHtmlSections(html: string): HtmlSection[] {
  const sections: HtmlSection[] = [];
  const headingRegex = /<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi;
  const headings: { level: number; text: string; index: number }[] = [];

  let headingMatch;
  while ((headingMatch = headingRegex.exec(html)) !== null) {
    headings.push({
      level: parseInt(headingMatch[1]),
      text: stripHtml(headingMatch[2]).trim(),
      index: headingMatch.index,
    });
  }

  for (let i = 0; i < headings.length; i++) {
    const start = headings[i].index;
    const end = i + 1 < headings.length ? headings[i + 1].index : html.length;
    sections.push({
      heading: headings[i].text,
      headingLevel: headings[i].level,
      content: html.substring(start, end),
      startIndex: start,
    });
  }

  return sections;
}

/**
 * Extract participant name from content near a client heading
 */
function extractParticipant(content: string): string | undefined {
  const text = stripHtml(content);
  const participantMatch = text.match(/Participant:\s*(.+)/i);
  if (participantMatch) return participantMatch[1].trim();
  return undefined;
}

/**
 * Extract CS name from content near a client heading
 */
function extractCSName(content: string): string | undefined {
  const text = stripHtml(content);
  const csMatch = text.match(/CS:\s*(\w+)/i);
  if (csMatch) return csMatch[1].trim();
  return undefined;
}

/**
 * Extract date from content or heading
 */
function extractDate(heading: string, content: string): string | undefined {
  // Try heading first: "2.1 I Buy Georgia (Jan 12)"
  const headingDate = heading.match(/\(([A-Z][a-z]+\s+\d+)\)/);
  if (headingDate) return headingDate[1];

  // Try content: "Date: January 20"
  const text = stripHtml(content);
  const dateMatch = text.match(/Date:\s*(.+)/i);
  if (dateMatch) return dateMatch[1].trim();

  return undefined;
}

/**
 * Extract pain points and opportunities from a block of HTML content
 * by scanning for bold-text sub-section labels within the content.
 *
 * Many documents use bold text (not headings) for sub-section labels like:
 * "Implicit pain points", "Key insights from UX questions", etc.
 * This function splits the content by these labels and extracts bullets.
 */
function extractInsightsFromContent(
  contentHtml: string
): { painPoints: string[]; opportunities: string[] } {
  const painPoints: string[] = [];
  const opportunities: string[] = [];

  // Split content by bold-text labels or heading-level sub-sections
  // Look for patterns like: <strong>Label</strong> or <b>Label</b> or <h4>Label</h4>
  const sectionSplitRegex = /(?:<(?:strong|b|h[3-6])[^>]*>)([\s\S]*?)(?:<\/(?:strong|b|h[3-6])>)/gi;
  const labels: { text: string; index: number }[] = [];

  let labelMatch;
  while ((labelMatch = sectionSplitRegex.exec(contentHtml)) !== null) {
    const labelText = stripHtml(labelMatch[1]).trim();
    if (labelText.length > 3 && labelText.length < 80) {
      labels.push({ text: labelText, index: labelMatch.index });
    }
  }

  // Process each label and extract the content after it until the next label
  for (let i = 0; i < labels.length; i++) {
    const label = labels[i];
    const nextLabelIndex = i + 1 < labels.length ? labels[i + 1].index : contentHtml.length;
    const sectionContent = contentHtml.substring(label.index, nextLabelIndex);

    if (isPainSection(label.text)) {
      const bullets = extractBulletPoints(sectionContent);
      painPoints.push(...bullets);
    } else if (isOpportunitySection(label.text)) {
      const bullets = extractBulletPoints(sectionContent);
      opportunities.push(...bullets);
    }
  }

  return { painPoints, opportunities };
}

/**
 * Get the full HTML content for a client section, including all sub-sections
 * until the next client section or top-level section begins.
 *
 * Doc 1 pattern: H3 "3.1 Leave The Key" followed by H3 "Advanced / Power user mindset"
 * then H4 sub-sections. The archetype H3 belongs to the same client.
 */
function getFullClientContent(
  sections: HtmlSection[],
  clientSectionIndex: number,
  clientHeadingLevel: number
): string {
  let content = sections[clientSectionIndex].content;

  for (let i = clientSectionIndex + 1; i < sections.length; i++) {
    const section = sections[i];

    if (section.headingLevel < clientHeadingLevel) {
      // Higher-level heading (e.g., H2 when client is H3) — always stop
      break;
    }

    if (section.headingLevel === clientHeadingLevel) {
      // Same level heading — check if it's a new client or just a descriptor
      const nextClient = extractClientFromHeading(section.heading);
      if (nextClient) break;
      // Check if it's a numbered top-level section (e.g., "4. Cross-call patterns")
      if (/^\d+\.\s/.test(section.heading) && !section.heading.match(/^\d+\.\d+/)) break;
      // Check if it's a known non-client section (Opportunities, Executive Summary, etc.)
      if (GLOBAL_SECTION_PATTERNS.some(p => p.test(section.heading))) break;
      if (/opportunit/i.test(section.heading)) break;
      // Otherwise it might be an archetype label like "Advanced / Power user mindset"
      // or "Delegated / defensive user" — include it as part of the client section
      content += section.content;
      continue;
    }

    // Lower-level heading (sub-section) — include
    content += section.content;
  }

  return content;
}

/**
 * Parse documents with HTML headings (Google Docs)
 */
function parseWithHtmlHeadings(html: string): ParsedDocument {
  const sections = parseHtmlSections(html);
  if (sections.length === 0) return { clients: [], clientNames: [] };

  const clients: ClientInsight[] = [];

  // Extract research owner and date range from header
  const text = stripHtml(html);
  let researchOwner: string | undefined;
  let dateRange: string | undefined;
  const ownerMatch = text.match(/Research\s+owner:\s*([^\n]+)/i);
  if (ownerMatch) researchOwner = ownerMatch[1].trim();
  const roleMatch = text.match(/Role:\s*([^\n]+)/i);
  if (!researchOwner && roleMatch) researchOwner = roleMatch[1].trim();
  const preparedMatch = text.match(/Prepared\s+by:\s*([^\n]+)/i);
  if (!researchOwner && preparedMatch) researchOwner = preparedMatch[1].trim();
  const dateRangeMatch = text.match(/(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d+[\s–\-&]+\d+/i);
  if (dateRangeMatch) dateRange = dateRangeMatch[0].replace(/&/g, '');

  // First pass: find all client sections
  const clientSections: { index: number; name: string; level: number }[] = [];
  for (let i = 0; i < sections.length; i++) {
    const clientName = extractClientFromHeading(sections[i].heading);
    if (clientName) {
      clientSections.push({ index: i, name: clientName, level: sections[i].headingLevel });
    }
  }

  // Second pass: for each client, gather all content and extract insights
  for (const cs of clientSections) {
    const section = sections[cs.index];
    const fullContent = getFullClientContent(sections, cs.index, cs.level);

    // Try existing metadata patterns first, then fall back to bold-label table format
    let participant = extractParticipant(fullContent);
    let csName = extractCSName(fullContent);
    let date = extractDate(section.heading, fullContent);

    // Fall back to bold-label metadata (Contact/Date/CSM format used in newer docs)
    if (!participant || !date || !csName) {
      const boldMeta = extractMetadataFromBoldLabels(fullContent);
      if (!participant && boldMeta.participant) participant = boldMeta.participant;
      if (!date && boldMeta.date) date = boldMeta.date;
      if (!csName && boldMeta.csName) csName = boldMeta.csName;
    }

    // Extract pain points and opportunities from heading-based sub-sections
    const painPoints: string[] = [];
    const opportunities: string[] = [];

    // Check heading-based sub-sections within client section
    for (let i = cs.index + 1; i < sections.length; i++) {
      const sub = sections[i];

      if (sub.headingLevel < cs.level) {
        break; // Higher-level heading — stop
      }

      if (sub.headingLevel === cs.level) {
        const nextClient = extractClientFromHeading(sub.heading);
        if (nextClient) break;
        if (/^\d+\.\s/.test(sub.heading) && !sub.heading.match(/^\d+\.\d+/)) break;
        if (GLOBAL_SECTION_PATTERNS.some(p => p.test(sub.heading))) break;
        if (/opportunit/i.test(sub.heading)) break;
        // Same-level archetype labels — continue but check for pain/opp content
      }

      if (isPainSection(sub.heading)) {
        painPoints.push(...extractBulletPoints(sub.content));
      } else if (isOpportunitySection(sub.heading)) {
        opportunities.push(...extractBulletPoints(sub.content));
      }
    }

    // Also scan the full content for bold-text sub-section labels
    // (handles docs where pain points are in bold, not headings)
    const contentInsights = extractInsightsFromContent(fullContent);
    if (painPoints.length === 0) {
      painPoints.push(...contentInsights.painPoints);
    }
    if (opportunities.length === 0) {
      opportunities.push(...contentInsights.opportunities);
    }

    clients.push({
      clientName: cs.name,
      participant,
      date,
      csName,
      painPoints,
      opportunities,
    });
  }

  // If no per-client opportunities were found, extract global opportunities
  if (clients.length > 0 && clients.every(c => c.opportunities.length === 0)) {
    const globalOpportunities: string[] = [];
    let inOpportunitySection = false;

    for (const section of sections) {
      const heading = section.heading;
      if (/opportunit|product\s*bet/i.test(heading) && section.headingLevel <= 2) {
        inOpportunitySection = true;
        // Extract bullet/list items directly from the section HTML
        const bullets = extractBulletPoints(section.content);
        // Filter out section heading text and very short items
        const filteredBullets = bullets.filter(b =>
          b.length > 15 &&
          !/^(?:key\s+)?opportunit/i.test(b) &&
          !/^(?:\d+\.\s*)?research[\s-]driven/i.test(b) &&
          !/non[\s-]solutioned/i.test(b)
        );
        globalOpportunities.push(...filteredBullets);
      } else if (inOpportunitySection && section.headingLevel <= 2) {
        inOpportunitySection = false;
      } else if (inOpportunitySection && section.headingLevel > 2) {
        // Sub-sections of the opportunity section (e.g., "Opportunity 1 — Data as infrastructure")
        const headerText = stripHtml(section.heading).trim();
        // Skip section headings that are just category labels (not actual opportunities)
        if (/^(\d+\.\s*)?(research[\s-]driven|non[\s-]solutioned|cross[\s-]call)/i.test(headerText)) {
          continue;
        }
        // Clean up: remove "Opportunity N —" prefix
        const cleanHeader = headerText
          .replace(/^opportunity\s*\d*\s*[—–\-]*\s*/i, '')
          .trim();
        const content = stripHtml(section.content).replace(headerText, '').trim();
        const firstLine = content.split('\n').find(l => l.trim().length > 10);
        if (cleanHeader && firstLine) {
          globalOpportunities.push(`${cleanHeader}: ${firstLine.trim()}`);
        } else if (cleanHeader) {
          globalOpportunities.push(cleanHeader);
        }
      }
    }

    // Also try extracting from the plain text for numbered opportunity lists
    // Pattern: "1. From X → Y\n Description"
    if (globalOpportunities.length === 0) {
      const oppSectionMatch = text.match(/(?:key\s+)?opportunity\s+areas?[^\n]*\n([\s\S]*?)(?=\n\d+\.\s*(?:strategic|final)|$)/i);
      if (oppSectionMatch) {
        const oppText = oppSectionMatch[1];
        const numberedItems = oppText.match(/\d+\.\s*From\s+[^\n]+(?:\n[^\d\n][^\n]+)*/g);
        if (numberedItems) {
          for (const item of numberedItems) {
            const firstLine = item.replace(/^\d+\.\s*/, '').trim();
            const lines = firstLine.split('\n');
            const summary = lines[0].trim();
            const description = lines.slice(1).join(' ').trim();
            if (description) {
              globalOpportunities.push(`${summary}: ${description}`);
            } else {
              globalOpportunities.push(summary);
            }
          }
        }
      }
    }

    if (globalOpportunities.length > 0) {
      for (const client of clients) {
        client.opportunities = [...globalOpportunities];
      }
    }
  }

  // If no per-client pain points were found, try global extraction
  if (clients.length > 0 && clients.every(c => c.painPoints.length === 0)) {
    // Try extracting from cross-call friction section
    for (const section of sections) {
      if (/friction|pain|challenge/i.test(section.heading) && section.headingLevel <= 3) {
        const bullets = extractBulletPoints(section.content);
        if (bullets.length > 0) {
          for (const client of clients) {
            client.painPoints = [...bullets];
          }
          break;
        }
      }
    }
  }

  return {
    clients,
    clientNames: clients.map((c) => c.clientName),
    researchOwner,
    dateRange,
  };
}

/**
 * Parse Word documents (no HTML headings, uses text structure)
 * These docs use "————" separators between client sections
 */
function parseWordDocument(text: string, html: string): ParsedDocument {
  // Split by separator lines
  const separatorRegex = /[—–\-]{10,}/;
  const blocks = text.split(separatorRegex).filter((b) => b.trim().length > 50);

  const clients: ClientInsight[] = [];
  let researchOwner: string | undefined;

  for (const block of blocks) {
    const lines = block.trim().split('\n').filter((l) => l.trim());
    if (lines.length < 3) continue;

    // First non-empty line is the client name (pattern: "ClientName — CallType (Date)")
    const firstLine = lines[0].trim();
    const clientMatch = firstLine.match(/^(.+?)\s*[—–\-]+\s*(Engagement|Onboarding|Check-in)\s*call/i);

    if (!clientMatch) {
      // Check for "Cross-call themes" or appendix sections
      if (/^(cross|appendix|asana)/i.test(firstLine)) continue;
      // Try simpler pattern: just a name line
      if (/^[A-Z]/.test(firstLine) && firstLine.length < 80 && !NON_CLIENT_PATTERNS.some(p => p.test(firstLine))) {
        // Might be a simpler client header
      } else {
        continue;
      }
    }

    const clientName = clientMatch ? clientMatch[1].trim() : firstLine.split('—')[0].trim();
    const dateMatch = firstLine.match(/\(([^)]+\d{4})\)/);
    const date = dateMatch ? dateMatch[1] : undefined;

    // Parse sections within the block
    const painPoints: string[] = [];
    const opportunities: string[] = [];
    let currentSection: 'pain' | 'opportunity' | 'other' = 'other';

    for (const line of lines) {
      const trimmed = line.trim();

      // Detect section headers
      if (/implicit\s*(friction|pain)/i.test(trimmed) || /pain\s*point/i.test(trimmed)) {
        currentSection = 'pain';
        continue;
      }
      if (/opportunit|product\s*bet/i.test(trimmed)) {
        currentSection = 'opportunity';
        continue;
      }
      if (/^(context|observed|key\s+insight|action\s+item|asana|source\s+trans)/i.test(trimmed)) {
        currentSection = 'other';
        continue;
      }

      // Extract bullet content
      if (currentSection !== 'other') {
        const bullet = trimmed.replace(/^[\s•\-–—*]+/, '').trim();
        if (bullet.length > 10 && !/^(context|observed|key|action|asana|source)/i.test(bullet)) {
          if (currentSection === 'pain') {
            painPoints.push(bullet);
          } else {
            opportunities.push(bullet);
          }
        }
      }
    }

    if (clientName && (painPoints.length > 0 || opportunities.length > 0)) {
      // Extract CS name from block
      const csMatch = block.match(/CS:\s*(\w+)/i);
      clients.push({
        clientName,
        date,
        csName: csMatch ? csMatch[1] : undefined,
        painPoints,
        opportunities,
      });
    }
  }

  // Also check for appendix Asana-ready summaries to find clients we might have missed
  const appendixMatch = text.match(/appendix[\s\S]*$/i);
  if (appendixMatch) {
    const appendixBlocks = appendixMatch[0].split(/\n{2,}/);
    for (let i = 0; i < appendixBlocks.length; i++) {
      const blockText = appendixBlocks[i].trim();
      // Check if this is a client name line (short, starts with capital)
      if (blockText.length < 60 && /^[A-Z]/.test(blockText) && !clients.some(c => blockText.includes(c.clientName))) {
        const summaryText = appendixBlocks[i + 1]?.trim();
        if (summaryText && summaryText.length > 50) {
          // Found a client in appendix that wasn't in main sections
          // Add with empty pain/opportunity (their summary is global)
        }
      }
    }
  }

  return {
    clients,
    clientNames: clients.map((c) => c.clientName),
    researchOwner,
  };
}

/**
 * Main entry point: parse a document's HTML + text into structured insights
 */
export function parseDocumentInsights(html: string, text?: string): ParsedDocument {
  // Check if we have HTML headings (Google Docs)
  const hasHtmlHeadings = /<h[1-6][^>]*>/i.test(html);

  if (hasHtmlHeadings) {
    const result = parseWithHtmlHeadings(html);
    if (result.clients.length > 0) return result;
  }

  // Fall back to text-based parsing (Word docs or docs without clear headings)
  if (text) {
    const result = parseWordDocument(text, html);
    if (result.clients.length > 0) return result;
  }

  // Last resort: try text-based parsing on HTML-stripped content
  const plainText = text || stripHtml(html);
  return parseWordDocument(plainText, html);
}

/**
 * Get the Google Drive view URL for a file
 */
export function getDriveViewUrl(fileId: string, mimeType?: string): string {
  if (mimeType === 'application/vnd.google-apps.document') {
    return `https://docs.google.com/document/d/${fileId}/edit`;
  }
  return `https://drive.google.com/file/d/${fileId}/view`;
}
