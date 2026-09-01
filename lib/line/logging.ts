/* eslint-disable no-console -- structured stdout logs for LINE API / webhook audit */
/** Structured stdout logs per LINE Messaging API development guidelines. */

export function getClientIp(request: Request): string {
  const xff = request.headers.get("x-forwarded-for");

  if (xff) {
    const first = xff.split(",")[0]?.trim();

    if (first) return first;
  }

  return request.headers.get("x-real-ip") ?? "unknown";
}

export function logLineApiRequest(entry: {
  requestId: string | null;
  at: string;
  method: string;
  endpoint: string;
  status: number;
}): void {
  console.info(JSON.stringify({ kind: "line-api", ...entry }));
}

export function logLineWebhook(entry: {
  senderIp: string;
  at: string;
  method: string;
  path: string;
  status: number;
  channelId?: string;
  eventCount?: number;
  eventTypes?: string[];
}): void {
  console.info(JSON.stringify({ kind: "line-webhook", ...entry }));
}

async function logLineFetch(
  endpoint: string,
  options: RequestInit,
): Promise<Response> {
  const method = options.method ?? "GET";
  const at = new Date().toISOString();
  const res = await fetch(endpoint, options);

  logLineApiRequest({
    requestId: res.headers.get("x-line-request-id"),
    at,
    method,
    endpoint,
    status: res.status,
  });

  return res;
}

export async function lineMessagingFetch(
  endpoint: string,
  accessToken: string,
  options: RequestInit = {},
): Promise<Response> {
  return logLineFetch(endpoint, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(options.headers as Record<string, string>),
    },
  });
}
