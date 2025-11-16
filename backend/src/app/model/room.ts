import { User } from "./user.ts";

export interface Room {
  status: 'available' | 'notAvailable';
  roomId: string;
  roomUsers: {name: string, index: string}[];
}
