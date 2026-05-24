export type Difficulty = 'passive' | 'normal' | 'aggressive';
export const DIFFICULTIES: readonly Difficulty[] = ['passive', 'normal', 'aggressive'] as const;

export { chooseAction } from './choose.js';
export {
  claimableRoutes,
  neededColors,
  routesOnTicketPaths,
  satisfiedTickets,
  shortestUsableRoute,
  type ClaimableRoute,
} from './helpers.js';
