export enum VotingCategory {
  OVERALL = 'Best Overall Display',
  LIGHTS = 'Best Use of Lights',
  CREATIVE = 'Most Creative',
  ANIMATED = 'Best Animated Display',
  DIY = 'Best DIY Decorations',
  CLASSIC = 'Best Classic Christmas'
}

export interface Photo {
  id: string;
  url: string;
  isFeatured: boolean;
}

export interface DisplaySubmission {
  id: string;
  userId: string;
  firstName?: string;
  lastName?: string;
  address: string;
  lat: number;
  lng: number;
  photos: Photo[];
  votes: Record<VotingCategory, number>;
  totalVotes: number;
  description?: string;
}

export interface User {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  address?: string;
  votesRemainingPerAddress: Record<string, number>; // addressId -> count
}

export type ViewType = 'MAP' | 'SUBMIT' | 'LEADERBOARD' | 'PROFILE' | 'EDIT_SUBMISSION';