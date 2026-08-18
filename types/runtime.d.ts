declare module "three";

declare module "cloudflare:workers" {
  export const env: {
    DB?: D1Database;
    BUCKET?: R2Bucket;
  };
}

interface R2HTTPMetadata {
  contentType?: string;
  cacheControl?: string;
}

interface R2ObjectBody {
  body: ReadableStream;
  httpEtag: string;
  writeHttpMetadata(headers: Headers): void;
}

interface R2Bucket {
  put(key: string, value: ArrayBuffer | ReadableStream, options?: {
    httpMetadata?: R2HTTPMetadata;
    customMetadata?: Record<string, string>;
  }): Promise<unknown>;
  get(key: string): Promise<R2ObjectBody | null>;
}

interface Fetcher {
  fetch(request: Request): Promise<Response>;
}

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = Record<string, unknown>>(column?: string): Promise<T | null>;
  run(): Promise<unknown>;
  all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
  raw<T = unknown[]>(): Promise<T[]>;
}

interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<T[]>;
  exec(query: string): Promise<unknown>;
  dump(): Promise<ArrayBuffer>;
}
