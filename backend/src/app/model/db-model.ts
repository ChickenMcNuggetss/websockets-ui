import { Game } from "./game.ts";
import { Room } from "./room.ts";
import { User } from "./user.ts";
import { Winner } from "./winner.ts";

export interface Db {
  users: User[];
  winners: Winner[];
  rooms: Room[];
  games: Game[];
}