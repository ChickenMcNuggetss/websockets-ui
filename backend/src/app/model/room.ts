import { User } from "./user.ts";

export interface Room {
  roomId: number;
  roomUsers: User[];
}
