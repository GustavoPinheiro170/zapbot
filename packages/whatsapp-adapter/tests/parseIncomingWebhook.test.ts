import { describe, expect, it } from "vitest";
import { parseIncomingWebhook } from "../src/parseIncomingWebhook.js";

describe("parseIncomingWebhook", () => {
  it("extracts a text message from a real-shaped Meta Cloud API webhook payload", () => {
    const payload = {
      object: "whatsapp_business_account",
      entry: [
        {
          id: "WABA_ID",
          changes: [
            {
              field: "messages",
              value: {
                messaging_product: "whatsapp",
                metadata: { display_phone_number: "15550001111", phone_number_id: "123456789" },
                contacts: [{ profile: { name: "Maria" }, wa_id: "5511999998888" }],
                messages: [
                  {
                    from: "5511999998888",
                    id: "wamid.ABC123",
                    timestamp: "1699999999",
                    type: "text",
                    text: { body: "Oi, quero saber sobre o plano Pro" },
                  },
                ],
              },
            },
          ],
        },
      ],
    };

    const messages = parseIncomingWebhook(payload);

    expect(messages).toEqual([
      {
        from: "5511999998888",
        contactName: "Maria",
        text: "Oi, quero saber sobre o plano Pro",
        messageId: "wamid.ABC123",
        timestamp: "1699999999",
      },
    ]);
  });

  it("returns an empty array for a status/delivery webhook that carries no messages", () => {
    const payload = {
      object: "whatsapp_business_account",
      entry: [
        {
          id: "WABA_ID",
          changes: [
            {
              field: "messages",
              value: {
                messaging_product: "whatsapp",
                metadata: { display_phone_number: "15550001111", phone_number_id: "123456789" },
                statuses: [{ id: "wamid.ABC123", status: "delivered", timestamp: "1699999999" }],
              },
            },
          ],
        },
      ],
    };

    expect(parseIncomingWebhook(payload)).toEqual([]);
  });

  it("ignores non-text message types instead of throwing", () => {
    const payload = {
      object: "whatsapp_business_account",
      entry: [
        {
          id: "WABA_ID",
          changes: [
            {
              field: "messages",
              value: {
                messaging_product: "whatsapp",
                metadata: { display_phone_number: "15550001111", phone_number_id: "123456789" },
                contacts: [{ profile: { name: "Maria" }, wa_id: "5511999998888" }],
                messages: [
                  { from: "5511999998888", id: "wamid.IMG1", timestamp: "1699999999", type: "image" },
                ],
              },
            },
          ],
        },
      ],
    };

    expect(parseIncomingWebhook(payload)).toEqual([]);
  });

  it("returns an empty array for a malformed or unrelated payload instead of throwing", () => {
    expect(parseIncomingWebhook({})).toEqual([]);
    expect(parseIncomingWebhook(null)).toEqual([]);
    expect(parseIncomingWebhook({ object: "page" })).toEqual([]);
  });
});
