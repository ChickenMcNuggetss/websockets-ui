import { User } from '../model/user.ts';
import { db } from '../db/db.ts';
import { RequestIncoming } from '../model/request.ts';
import { Winner } from '../model/winner.ts';
import { v4 as uuidv4 } from 'uuid';
import { Room } from '@app/model/room.ts';

export class Controller {
  private database = db;

  public controller: Record<string, ({ data }: RequestIncoming<any> | any) => any> = {
    reg: ({ type, data }: RequestIncoming<User>) => {
      return { response: this.registerPlayer(type, data), broadcast: false };
    }, // should do update_room update_winners
    update_winners: ({ type, data }: RequestIncoming<Winner>) => {
      return { response: this.updateWinners(type, data), broadcast: true };
    },
    create_room: ({ userIndex }: RequestIncoming<any>) => {
      if (userIndex === null) return;
      return { response: this.createRoom(userIndex), broadcast: false };
    },
    // add_user_to_room: ({ userIndex, userRoom }: any) => {
    //   return { response: this.addUserToRoom(userRoom, userIndex), broadcast: false };
    // },
  };

  private registerPlayer(type: string, userData: User) {
    const user = this.database.users.find(({ name }) => userData.name === name);
    let index = '';
    if (!user) {
      index = uuidv4();
      this.database.users.push({ ...userData, index });
    }

    return {
      type,
      data: {
        name: user?.name ?? userData.name,
        index: user?.name ?? index,
        error: false, // error if there is no required fields
        errorText: '',
      },
      id: 0,
    };
  }

  private updateWinners(type: string, winnersData: Winner) {
    this.database.winners.push(winnersData);
  }

  private createRoom(userIndex: string) {
    const newRoom: Room = {
      roomId: uuidv4(),
      status: 'available',
      roomUsers: [],
    };
    this.database.rooms.push(newRoom);
    this.addUserToRoom(newRoom.roomId, userIndex);
    return {
      type: 'create_room',
      data: {
        roomId: newRoom.roomId,
        roomUsers: newRoom.roomUsers,
      },
      id: 0,
    };
  }

  private addUserToRoom(roomId: string, userIndex: string) {
    const room = this.database.rooms.find((room) => room.roomId === roomId);
    const userToAdd = this.database.users.find((user) => user.index === userIndex);
    if (!room) {
      return {
        type: 'add_user_to_room',
        data: { error: true, errorText: 'Room not found' },
        id: 0,
      };
    }

    if (room.roomUsers.length >= 2) {
      return {
        type: 'add_user_to_room',
        data: { error: true, errorText: 'This room is no longer available' },
        id: 0,
      };
    }

    if (!userToAdd) {
      return {
        type: 'add_user_to_room',
        data: { error: true, errorText: 'There is no such user' },
        id: 0,
      };
    }
    room.roomUsers.push({ index: userIndex, name: userToAdd?.name ?? '' });

    if (room.roomUsers?.length === 2) {
      this.database.rooms.find((room) => room.roomId === roomId)!.status = 'notAvailable';

      this.createGame();
    }

    return {
      type: 'add_user_to_room',
      data: {
        roomId: room.roomId,
        roomUsers: room.roomUsers,
        error: false,
        errorText: '',
      },
      id: 0,
    };
  }

  private createGame() {

  }
}
