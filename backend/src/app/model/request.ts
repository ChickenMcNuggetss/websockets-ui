export interface RequestIncoming<T> {
  type: string;
  data: T;
  id: 0;
  userIndex: string | null;
}
