import { v7 as uuidv7 } from "uuid";

export type EntityId = string;

export const createEntityId = (): EntityId => uuidv7();
