export function extractErrorMessage(error: unknown, fallback: string): string {
  const payload = error as { error?: unknown } | null | undefined;
  const err = payload?.error;

  if (err && typeof err === 'object') {
    const record = err as Record<string, unknown>;
    const message = record['message'];
    if (typeof message === 'string' && message.trim()) {
      return message;
    }

    const fieldMessages = Object.values(record)
      .filter((value): value is string => typeof value === 'string' && value.trim().length > 0);

    if (fieldMessages.length) {
      return fieldMessages.join(' ');
    }
  }

  return fallback;
}
