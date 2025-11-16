import { User } from './user.ts';

export interface Game {
  gameId: string;
  playersId: {
    userIndex: string;
    playerId: string;
  }[];
}
