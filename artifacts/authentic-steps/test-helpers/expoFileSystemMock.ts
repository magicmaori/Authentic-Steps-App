/**
 * Manual mock of `expo-file-system`'s new File/Directory API for tests. It
 * keeps a tiny in-memory "filesystem" so `lib/videoCache.ts` can be tested
 * without touching real disk. Reset `__mockFiles` between tests.
 *
 * `__mockDirExists` controls whether Directory.exists returns true or false,
 * so cold-start tests can exercise the "directory does not exist → create"
 * branch that runs on a fresh Android install.
 *
 * `__mockDirCreateFn` can be replaced with a jest.fn() to assert that create()
 * was actually awaited with the correct options.
 *
 * `__mockThrowOnDirectoryConstruct` causes the Directory constructor to throw,
 * simulating the class-instantiation crash seen on some Android versions.
 */

type MockEntry = { size: number; modificationTime: number };

export const __mockFiles = new Map<string, MockEntry>();
export const __mockClock = { now: 1_000 };

/** Set to false to simulate a fresh install where the cache dir doesn't exist yet. */
export let __mockDirExists = true;
export function __setMockDirExists(value: boolean) {
  __mockDirExists = value;
}

/** Replaceable so tests can assert it was called with the right options. */
export let __mockDirCreateFn: (opts?: unknown) => void | Promise<void> = () => {};
export function __setMockDirCreateFn(fn: (opts?: unknown) => void | Promise<void>) {
  __mockDirCreateFn = fn;
}

/** When true, Directory constructor throws — simulates Android FS init crash. */
export let __mockThrowOnDirectoryConstruct = false;
export function __setMockThrowOnDirectoryConstruct(value: boolean) {
  __mockThrowOnDirectoryConstruct = value;
}

function joinUri(parts: any[]): string {
  return parts
    .map((p) => (typeof p === 'string' ? p : p?.uri ?? ''))
    .filter(Boolean)
    .join('/');
}

export class File {
  uri: string;
  constructor(...parts: any[]) {
    this.uri = joinUri(parts);
  }
  get exists() {
    return __mockFiles.has(this.uri);
  }
  info() {
    const entry = __mockFiles.get(this.uri);
    return { size: entry?.size ?? 0, modificationTime: entry?.modificationTime ?? 0 };
  }
  delete() {
    __mockFiles.delete(this.uri);
  }
  static async downloadFileAsync(_url: string, destination: File) {
    __mockFiles.set(destination.uri, {
      size: 10 * 1024 * 1024,
      modificationTime: __mockClock.now++,
    });
    return destination;
  }
}

export class Directory {
  uri: string;
  constructor(...parts: any[]) {
    if (__mockThrowOnDirectoryConstruct) {
      throw new Error('Directory constructor failed (simulated Android FS error)');
    }
    this.uri = joinUri(parts);
  }
  get exists() {
    return __mockDirExists;
  }
  async create(opts?: unknown) {
    return __mockDirCreateFn(opts);
  }
  list() {
    const prefix = `${this.uri}/`;
    return Array.from(__mockFiles.keys())
      .filter((uri) => uri.startsWith(prefix))
      .map((uri) => Object.assign(new File(), { uri }));
  }
}

export const Paths = {
  get cache() {
    return new Directory('file:///mock-cache');
  },
};
