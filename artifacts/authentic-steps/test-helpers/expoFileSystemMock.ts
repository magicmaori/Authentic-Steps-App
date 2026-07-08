/**
 * Manual mock of `expo-file-system`'s new File/Directory API for tests. It
 * keeps a tiny in-memory "filesystem" so `lib/videoCache.ts` can be tested
 * without touching real disk. Reset `__mockFiles` between tests.
 */

type MockEntry = { size: number; modificationTime: number };

export const __mockFiles = new Map<string, MockEntry>();
export const __mockClock = { now: 1_000 };

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
    this.uri = joinUri(parts);
  }
  get exists() {
    return true;
  }
  create() {}
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
