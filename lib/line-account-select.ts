/** Fields safe to serialize to the browser (never includes secrets). */
export const lineAccountPublicSelect = {
  id: true,
  name: true,
  channelId: true,
  createdAt: true,
  updatedAt: true,
} as const;

export const lineAccountNameSelect = {
  id: true,
  name: true,
} as const;
