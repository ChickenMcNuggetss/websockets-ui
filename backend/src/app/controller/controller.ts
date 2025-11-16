import { User } from '../model/user.ts';
import { db } from '../db/db.ts';
import { RequestIncoming } from '../model/request.ts';
import { Winner } from '../model/winner.ts';
import { v4 as uuidv4 } from 'uuid';

export class Controller {
  private database = db;

  public controller: Record<string, ({ data }: RequestIncoming<any>) => any> = {
    reg: ({ type, data }: RequestIncoming<User>) =>{
      return {response: this.registerPlayer(type, data), broadcast: false}}, // should do update_room update_winners
    update_winners: ({ type, data }: RequestIncoming<Winner>) => {return {response: this.updateWinners(type, data), broadcast: true}},
    create_room: ({ data }: RequestIncoming<any>) => this.createRoom(),
    // add_user_to_room: () => 
  };

  private registerPlayer(type: string, userData: User) {
    const user = this.database.users.find(({ name }) => userData.name === name);
    if (!user) {
      this.database.users.push(userData);
    } else {
      this.database.users.push({ ...userData, ...user });
    }
    return {
      type,
      data: {
        name: userData.name,
        index: this.database.users.length - 1,
        error: false, // error if there is no required fields
        errorText: '',
      },
      id: 0,
    };
  }

  private updateWinners(type: string, winnersData: Winner) {
    this.database.winners.push(winnersData);
  }

  private createRoom() {
    this.database.rooms.push({
      roomId: +uuidv4(),
      roomUsers: [],
    });
    return null;
  }

  private addUserToRoom(roomId: string) {

  }
}
