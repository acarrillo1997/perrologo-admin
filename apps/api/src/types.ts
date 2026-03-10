export type NormalizedInboundMessage = {
  eventId: string;
  eventType: string;
  messageId: string;
  phoneNumber: string;
  text: string;
  timestamp?: string;
  raw: Record<string, unknown>;
};

export interface MessagingProvider {
  verifyWebhook(input: {
    rawBody: string;
    headers: Record<string, string | string[] | undefined>;
  }): boolean;
  parseInboundMessage(payload: Record<string, unknown>): NormalizedInboundMessage | null;
  sendTextReply(input: { to: string; body: string }): Promise<{ externalMessageId?: string }>;
}
