export interface Room {
  id: string;
  name: string;
  createdAt: Date;
  members: string[];
}

export interface Member {
  id: string;
  name: string;
  avatar?: string;
  balance: number;
}
