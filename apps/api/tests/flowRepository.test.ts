import { describe, expect, it } from "vitest";
import { InMemoryFlowRepository } from "../src/repositories/flowRepository.js";

const flowA = { id: "a", name: "Fluxo A", entryNodeId: "n1", nodes: [{ id: "n1", type: "end" as const }] };
const flowB = { id: "b", name: "Fluxo B", entryNodeId: "n1", nodes: [{ id: "n1", type: "end" as const }] };

describe("InMemoryFlowRepository", () => {
  it("seeds the given flows under the given user", async () => {
    const repo = new InMemoryFlowRepository("user-1", [flowA]);

    expect(await repo.list("user-1")).toEqual([flowA]);
  });

  it("keeps each user's flows completely separate", async () => {
    const repo = new InMemoryFlowRepository("user-1", [flowA]);

    await repo.save("user-2", flowB);

    expect(await repo.list("user-1")).toEqual([flowA]);
    expect(await repo.list("user-2")).toEqual([flowB]);
    expect(await repo.get("user-1", "b")).toBeUndefined();
  });

  it("starts a user with no flows with an empty list, not an error", async () => {
    const repo = new InMemoryFlowRepository("user-1", [flowA]);

    expect(await repo.list("brand-new-user")).toEqual([]);
  });

  it("save upserts by id within a user's own flows", async () => {
    const repo = new InMemoryFlowRepository("user-1", [flowA]);

    const renamed = { ...flowA, name: "Fluxo A renomeado" };
    await repo.save("user-1", renamed);

    expect(await repo.list("user-1")).toEqual([renamed]);
  });

  it("remove only deletes from the given user's bucket", async () => {
    const repo = new InMemoryFlowRepository("user-1", [flowA]);
    await repo.save("user-2", flowA);

    const removed = await repo.remove("user-1", "a");

    expect(removed).toBe(true);
    expect(await repo.get("user-1", "a")).toBeUndefined();
    expect(await repo.get("user-2", "a")).toEqual(flowA);
  });
});
