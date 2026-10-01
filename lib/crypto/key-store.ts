const DB_NAME = "kliboard-keys";
const STORE_NAME = "space-keys";
const DB_VERSION = 1;

interface StoredKey {
  key: CryptoKey;
  expiresAt: number;
}

function openDb(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === "undefined") return Promise.resolve(null);

  return new Promise((resolve) => {
    let request: IDBOpenDBRequest;
    try {
      request = indexedDB.open(DB_NAME, DB_VERSION);
    } catch (err) {
      console.error("Key cache unavailable", err);
      resolve(null);
      return;
    }

    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      console.error("Key cache could not be opened", request.error);
      resolve(null);
    };
  });
}

function transact<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T | null> {
  return openDb().then(
    (db) =>
      new Promise<T | null>((resolve) => {
        if (!db) {
          resolve(null);
          return;
        }
        const tx = db.transaction(STORE_NAME, mode);
        const request = run(tx.objectStore(STORE_NAME));
        request.onsuccess = () => resolve(request.result ?? null);
        request.onerror = () => {
          console.error("Key cache operation failed", request.error);
          resolve(null);
        };
        tx.oncomplete = () => db.close();
      })
  );
}

export async function getCachedKey(spaceName: string): Promise<CryptoKey | null> {
  const stored = (await transact<StoredKey>("readonly", (store) =>
    store.get(spaceName.toLowerCase())
  )) as StoredKey | null;

  if (!stored) return null;
  if (stored.expiresAt <= Date.now()) {
    await forgetKey(spaceName);
    return null;
  }
  return stored.key;
}

export async function cacheKey(
  spaceName: string,
  key: CryptoKey,
  ttlSeconds: number
): Promise<void> {
  const value: StoredKey = {
    key,
    expiresAt: Date.now() + ttlSeconds * 1000,
  };
  await transact("readwrite", (store) =>
    store.put(value, spaceName.toLowerCase())
  );
}

export async function forgetKey(spaceName: string): Promise<void> {
  await transact("readwrite", (store) => store.delete(spaceName.toLowerCase()));
}

export async function forgetAllKeys(): Promise<void> {
  await transact("readwrite", (store) => store.clear());
}
