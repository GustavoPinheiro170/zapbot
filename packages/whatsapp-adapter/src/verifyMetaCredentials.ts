type FetchLike = typeof fetch;

export interface VerifyMetaCredentialsConfig {
  accessToken: string;
  phoneNumberId: string;
  apiVersion?: string;
  fetchImpl?: FetchLike;
}

export type VerifyMetaCredentialsResult =
  | { ok: true; displayPhoneNumber?: string }
  | { ok: false; error: string };

interface MetaPhoneNumberResponse {
  display_phone_number?: string;
  error?: { message?: string };
}

/** Confirms a WhatsApp access token + phone number id actually work, without sending a message. */
export async function verifyMetaCredentials(
  config: VerifyMetaCredentialsConfig,
): Promise<VerifyMetaCredentialsResult> {
  const apiVersion = config.apiVersion ?? "v20.0";
  const fetchImpl = config.fetchImpl ?? fetch;
  const url = `https://graph.facebook.com/${apiVersion}/${config.phoneNumberId}?fields=display_phone_number,verified_name`;

  const response = await fetchImpl(url, {
    headers: { Authorization: `Bearer ${config.accessToken}` },
  });
  const body = (await response.json()) as MetaPhoneNumberResponse;

  if (!response.ok) {
    return { ok: false, error: body.error?.message ?? `Falha na verificação (${response.status})` };
  }

  return { ok: true, displayPhoneNumber: body.display_phone_number };
}
