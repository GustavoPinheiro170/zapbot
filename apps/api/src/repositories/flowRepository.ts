import type { Flow } from "@whatsbot/flow-engine";

export interface FlowRepository {
  list(userId: string): Promise<Flow[]>;
  get(userId: string, id: string): Promise<Flow | undefined>;
  save(userId: string, flow: Flow): Promise<Flow>;
  remove(userId: string, id: string): Promise<boolean>;
}

/**
 * In-memory by design — used in tests and as the default when no database is configured.
 * Flows are kept in a separate bucket per `userId`, matching the shape of MongoFlowRepository
 * so either can be swapped in behind the same `FlowRepository` interface.
 */
export class InMemoryFlowRepository implements FlowRepository {
  private readonly flowsByUser = new Map<string, Map<string, Flow>>();

  constructor(seedUserId?: string, seedFlows: Flow[] = []) {
    if (seedUserId) {
      for (const flow of seedFlows) {
        this.bucket(seedUserId).set(flow.id, flow);
      }
    }
  }

  private bucket(userId: string): Map<string, Flow> {
    let bucket = this.flowsByUser.get(userId);
    if (!bucket) {
      bucket = new Map();
      this.flowsByUser.set(userId, bucket);
    }
    return bucket;
  }

  async list(userId: string): Promise<Flow[]> {
    return [...this.bucket(userId).values()];
  }

  async get(userId: string, id: string): Promise<Flow | undefined> {
    return this.bucket(userId).get(id);
  }

  async save(userId: string, flow: Flow): Promise<Flow> {
    this.bucket(userId).set(flow.id, flow);
    return flow;
  }

  async remove(userId: string, id: string): Promise<boolean> {
    return this.bucket(userId).delete(id);
  }
}
