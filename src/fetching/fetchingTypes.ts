export type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

/** Returns the headers to send with each request, such as `Authorization`. */
export type HeaderCalculator = () =>
  | Promise<Record<string, string>>
  | Record<string, string>;

/**
 * Sends `body` to the server at `path` and returns the parsed response.
 *
 * Generated SDKs make every call through one of these; see `createBasicFetcher` and `createBulkFetcher`.
 */
export type Fetcher = <Body, T>(
  path: string,
  method: Method,
  body?: Body
) => Promise<T>;