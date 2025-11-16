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
      const player = this.registerPlayer(type, data);
      const rooms = this.updateRoom();
      const winners = this.updateWinners({ name: player.data.name, wins: 0 });
      return [
        { response: player, broadcast: false },
        {
          response: rooms,
          broadcastTo: 'all',
        },
        { response: winners, broadcastTo: 'all' },
      ];
    },
    create_room: ({ userIndex }: RequestIncoming<any>) => {
      this.createRoom(userIndex);
      const rooms = this.updateRoom();
      return [{ response: rooms, broadcast: true }];
    },
    add_user_to_room: ({ indexRoom, userIndex }: RequestIncoming<any>) => {
      this.addUserToRoom(indexRoom, userIndex);
      const room = this.database.rooms.find((room) => room.roomId === indexRoom)
      room!.status = 'notAvailable';
      this.createGame(room?.roomUsers ?? []);
      const rooms = this.updateRoom();
      return [{ response: rooms, broadcast: true }];
    },
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

  private updateWinners(winnersData: Winner) {
    this.database.winners.push(winnersData);
    return {
      type: 'update_winners',
      data: this.database.winners,
      id: 0,
    };
  }

  private createRoom(userIndex: string | null) {
    const newRoom: Room = {
      roomId: uuidv4(),
      status: 'available',
      roomUsers: [],
    };
    if (!userIndex) {
      return {
        type: 'create_room',
        data: { error: true, errorText: 'Please, relogin' },
        id: 0,
      };
    }
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

  private addUserToRoom(roomId: string, userIndex: string | null) {
    const room = this.database.rooms.find((room) => room.roomId === roomId);
    const userToAdd = this.database.users.find((user) => user.index === userIndex);
    if (!userIndex) {
      return {
        type: 'add_user_to_room',
        data: { error: true, errorText: 'Please, relogin' },
        id: 0,
      };
    }
    if (!room) {
      return {
        type: 'add_user_to_room',
        data: { error: true, errorText: 'Room not found' },
        id: 0,
      };
    }

    if (room.roomUsers?.length >= 2) {
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
    const isAlreadyInTheRoom = !!room.roomUsers.find((user) => user.index === userToAdd.index);
    if (isAlreadyInTheRoom) {
      return {
        type: 'add_user_to_room',
        data: { error: true, errorText: 'The user is already in the room' },
        id: 0,
      };
    }

    if (room.roomUsers?.length < 2) {
      room.roomUsers.push({ index: userIndex, name: userToAdd?.name ?? '' });
    }

    return {
      type: 'add_user_to_room',
      data: {
        error: false,
        errorText: '',
      },
      id: 0,
    };
  }

  private createGame(users: { name: string; index: string }[]) {
    const newGame = {
      gameId: uuidv4(),
      playersId: users.map((user) => {
        return { userIndex: user.index, playerId: uuidv4() };
      }),
    };
    this.database.games.push(newGame);
  }

  private updateRoom() {
    return {
      type: 'update_room',
      data: this.database.rooms.filter((room) => room.status === 'available'),
      id: 0,
    };
  }
}
