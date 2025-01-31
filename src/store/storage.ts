import { WebStorage } from "redux-persist/es/types";

const createNoopStorage = (): WebStorage => ({
  getItem: (key: string) => Promise.resolve(null),
  setItem: (key: string, value: string) => Promise.resolve<void>(undefined),
  removeItem: (key: string) => Promise.resolve(),
});

const storage = typeof window !== "undefined" ? 
  require("redux-persist/lib/storage").default : 
  createNoopStorage();

export default storage;