/**
 * Centralized Official Sales Agent Registry
 * Strictly enforces the 7 authorized sales agents.
 * Never invents, guesses, or automatically creates unauthorized agents.
 */

export interface OfficialAgent {
  id: string;
  name: string;
  extension: string;
}

export const OFFICIAL_AGENT_REGISTRY: Record<string, string> = {
  '104': 'فلاح',
  '107': 'چعبی',
  '109': 'عربی',
  '112': 'زمانی',
  '113': 'ملکی',
  '114': 'دهقانی پور',
  '117': 'رحیمی',
};

export const OFFICIAL_AGENTS_LIST: OfficialAgent[] = [
  { id: '104', name: 'فلاح', extension: '104' },
  { id: '107', name: 'چعبی', extension: '107' },
  { id: '109', name: 'عربی', extension: '109' },
  { id: '112', name: 'زمانی', extension: '112' },
  { id: '113', name: 'ملکی', extension: '113' },
  { id: '114', name: 'دهقانی پور', extension: '114' },
  { id: '117', name: 'رحیمی', extension: '117' },
];

export const UNRESOLVED_AGENT_ID = 'unresolved';
export const UNRESOLVED_AGENT_NAME = 'کارشناس ناشناس / نیازمند بررسی';

/**
 * Resolves a raw agent ID/extension strictly against the official 7 agents.
 * If not recognized, returns UNRESOLVED_AGENT_ID and UNRESOLVED_AGENT_NAME.
 */
export function resolveAgent(rawIdOrExtension: string | number | undefined | null): {
  agentId: string;
  agentName: string;
  isOfficial: boolean;
  rawIdentified: string;
} {
  if (rawIdOrExtension === undefined || rawIdOrExtension === null) {
    return {
      agentId: UNRESOLVED_AGENT_ID,
      agentName: UNRESOLVED_AGENT_NAME,
      isOfficial: false,
      rawIdentified: ''
    };
  }

  const clean = String(rawIdOrExtension).trim();
  
  if (OFFICIAL_AGENT_REGISTRY[clean]) {
    return {
      agentId: clean,
      agentName: OFFICIAL_AGENT_REGISTRY[clean],
      isOfficial: true,
      rawIdentified: clean
    };
  }

  // Check if string contains one of the official extensions directly (e.g. "داخلی 104" or "Ext 104")
  for (const id of Object.keys(OFFICIAL_AGENT_REGISTRY)) {
    if (clean === id || clean.endsWith(id) || clean.startsWith(id)) {
      return {
        agentId: id,
        agentName: OFFICIAL_AGENT_REGISTRY[id],
        isOfficial: true,
        rawIdentified: clean
      };
    }
  }

  return {
    agentId: UNRESOLVED_AGENT_ID,
    agentName: UNRESOLVED_AGENT_NAME,
    isOfficial: false,
    rawIdentified: clean
  };
}

/**
 * Checks whether an agent ID is one of the 7 official authorized agents.
 */
export function isOfficialAgentId(agentId: string): boolean {
  return Boolean(OFFICIAL_AGENT_REGISTRY[agentId]);
}
