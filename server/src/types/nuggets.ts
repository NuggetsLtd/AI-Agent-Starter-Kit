export interface NuggetsChatContext {
  message: {
    message_id: string;
    date: number;
    text: string;
  };
  from: {
    id: string;
  };
  chat: {
    id: string;
  };
}
