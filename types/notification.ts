export interface Notification {
  id: number;
  user_id: number;
  title: string;
  content: string;
  read: boolean;
  created_at: string;
  updated_at: string;
  timeAgo?: string;
}

export interface NotificationResponse {
  success: boolean;
  message: string;
  count?: number;
} 