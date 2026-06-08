import Line from "next-auth/providers/line";

export function LineProvider() {
  return Line({
    clientId: process.env.LINE_LOGIN_CHANNEL_ID!,
    clientSecret: process.env.LINE_LOGIN_CHANNEL_SECRET!,
  });
}

export function isLineLoginConfigured(): boolean {
  return Boolean(
    process.env.LINE_LOGIN_CHANNEL_ID && process.env.LINE_LOGIN_CHANNEL_SECRET,
  );
}
