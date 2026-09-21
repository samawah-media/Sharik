import {
  loadPersistentLocalEnv,
  resetLocalDatabase,
} from "./support/s015-persistent-local";

export default function persistentGlobalTeardown() {
  loadPersistentLocalEnv();
  resetLocalDatabase();
}
