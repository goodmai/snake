export type GameMessageKey = { chat_id: number; message_id: number } | { inline_message_id: string };

const lastGameMessageByUser = new Map<number, GameMessageKey>();

export function setLastGameMessageForUser(userId: number, key: GameMessageKey): void {
  lastGameMessageByUser.set(userId, key);
}

export function getLastGameMessageForUser(userId: number): GameMessageKey | undefined {
  return lastGameMessageByUser.get(userId);
}

