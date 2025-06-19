export interface ReminderData {
  content: string;
  dateTime: string;
}

export interface OwnerMessageData {
  content: string;
  dateTime: string;
  sendNow: boolean;
}

export interface JournalEntryData {
  id: string;
  date: string;
  shopName: string;
  content: string;
  specialNotes: string;
  reminder?: ReminderData;
  ownerMessage?: OwnerMessageData;
  createdAt: number;
  updatedAt?: number;
} 