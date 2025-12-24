import { VotingCategory } from './types';

export const BLUFF_PARK_CENTER = { lat: 33.4005, lng: -86.8486 };
export const MAX_PHOTOS = 10;
export const MAX_VOTES_PER_ADDRESS = 10;

export const CATEGORY_COLORS: Record<VotingCategory, string> = {
  [VotingCategory.OVERALL]: 'bg-red-500',
  [VotingCategory.LIGHTS]: 'bg-yellow-500',
  [VotingCategory.CREATIVE]: 'bg-purple-500',
  [VotingCategory.ANIMATED]: 'bg-blue-500',
  [VotingCategory.DIY]: 'bg-green-500',
  [VotingCategory.CLASSIC]: 'bg-orange-500',
};