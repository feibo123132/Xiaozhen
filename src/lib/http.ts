export function isSameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  if (!origin) return true;
  const requestUrl = new URL(request.url);
  const publicHost = request.headers.get('x-forwarded-host') ?? request.headers.get('host') ?? requestUrl.host;
  const publicProtocol = request.headers.get('x-forwarded-proto') ?? requestUrl.protocol.replace(':', '');
  const browserOrigin = new URL(origin);
  return browserOrigin.host === publicHost && browserOrigin.protocol === `${publicProtocol}:`;
}

export function jsonError(message: string, status: number, extra?: Record<string, unknown>) {
  return Response.json({ error: message, ...extra }, { status });
}
