import type { Flow } from "@whatsbot/flow-engine";
import type { Collection, Db } from "mongodb";
import type { FlowRepository } from "./flowRepository.js";

interface FlowDocument extends Flow {
  userId: string;
}

/**
 * One `flows` collection, one document per flow, scoped by `userId` (see
 * apps/api/src/domain/defaultUser.ts for why every flow uses the same constant user id
 * today). `{ userId, id }` is unique and indexed — see `ensureIndexes`.
 */
export class MongoFlowRepository implements FlowRepository {
  private readonly collection: Collection<FlowDocument>;

  constructor(db: Db) {
    this.collection = db.collection<FlowDocument>("flows");
  }

  async ensureIndexes(): Promise<void> {
    await this.collection.createIndex({ userId: 1, id: 1 }, { unique: true });
  }

  async list(userId: string): Promise<Flow[]> {
    const docs = await this.collection.find({ userId }).toArray();
    return docs.map(toFlow);
  }

  async get(userId: string, id: string): Promise<Flow | undefined> {
    const doc = await this.collection.findOne({ userId, id });
    return doc ? toFlow(doc) : undefined;
  }

  async save(userId: string, flow: Flow): Promise<Flow> {
    await this.collection.updateOne(
      { userId, id: flow.id },
      { $set: { ...flow, userId } },
      { upsert: true },
    );
    return flow;
  }

  async remove(userId: string, id: string): Promise<boolean> {
    const result = await this.collection.deleteOne({ userId, id });
    return result.deletedCount > 0;
  }
}

function toFlow(doc: FlowDocument): Flow {
  const { userId: _userId, _id, ...flow } = doc as FlowDocument & { _id?: unknown };
  void _userId;
  void _id;
  return flow as Flow;
}
