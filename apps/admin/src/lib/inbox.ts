import { getRepositories } from "./db";

export async function getInbox(search?: string) {
  const repositories = getRepositories();
  const conversations = await repositories.conversations.list(search);

  return Promise.all(
    conversations.map(async (conversation: (typeof conversations)[number]) => {
      const detail = await repositories.owners.detail(conversation.ownerId);
      const latestMessage = (
        await repositories.messages.recentForConversation(conversation.id, 1)
      )[0];

      return {
        conversation,
        owner: detail?.owner ?? null,
        dog: detail?.dogs[0] ?? null,
        latestMessage
      };
    })
  );
}
