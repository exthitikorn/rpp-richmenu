export const LINE_ACCOUNT_REQUEST_STATUSES = [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "CANCELLED",
] as const;

export type LineAccountRequestStatusValue =
  (typeof LINE_ACCOUNT_REQUEST_STATUSES)[number];

export type LineAccountRequestPublic = {
  id: string;
  name: string;
  channelId: string;
  status: LineAccountRequestStatusValue;
  rejectionReason: string | null;
  lineAccountId: string | null;
  createdAt: Date;
};

export type PendingLineAccountRequestPublic = Pick<
  LineAccountRequestPublic,
  "id" | "name" | "channelId" | "createdAt"
> & {
  requestedBy: {
    id: string;
    name: string | null;
    email: string | null;
    ldapUsername: string | null;
  };
};
