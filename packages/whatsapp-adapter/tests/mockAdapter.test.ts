import { describe, expect, it } from "vitest";
import { MockAdapter } from "../src/mockAdapter.js";

describe("MockAdapter", () => {
  it("records every sent message and returns a generated id", async () => {
    const adapter = new MockAdapter();

    const first = await adapter.sendText({ to: "5511999998888", text: "Olá!" });
    const second = await adapter.sendText({ to: "5511999998888", text: "Tudo bem?" });

    expect(first.id).not.toBe(second.id);
    expect(adapter.sentMessages).toEqual([
      { to: "5511999998888", text: "Olá!" },
      { to: "5511999998888", text: "Tudo bem?" },
    ]);
  });
});
