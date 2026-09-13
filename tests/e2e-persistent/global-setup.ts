import {
  assertPersistentFixtureModeDisabled,
  loadPersistentLocalEnv,
  resetLocalDatabase,
} from "./support/s015-persistent-local";

export default function persistentGlobalSetup() {
  assertPersistentFixtureModeDisabled();
  loadPersistentLocalEnv();
  resetLocalDatabase();
}
