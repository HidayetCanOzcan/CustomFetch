/**
 * CustomFetch - Production-ready HTTP client for Bun/Node server-side
 */
import type { BaseError, ClientConfig, CustomFetchProps, CustomFetchResult, FetchOptions, HttpMethod } from "./types";
export declare function clearFetchCache(): void;
export declare function clearSpecificCache(url: string, method?: HttpMethod, body?: string | null): void;
export declare function getCacheStats(): {
    size: number;
    keys: string[];
};
export declare function CustomFetch<T, E extends BaseError = BaseError>({ options, }: CustomFetchProps<T, E>): Promise<CustomFetchResult<T, E>>;
export declare function createClient(config?: ClientConfig): {
    get<T, E extends BaseError = BaseError>(path: string, options?: Omit<Partial<FetchOptions<T, E>>, "method" | "body">): Promise<CustomFetchResult<T, E>>;
    post<T, E extends BaseError = BaseError>(path: string, body?: Record<string, unknown> | BodyInit | null, options?: Omit<Partial<FetchOptions<T, E>>, "method" | "body">): Promise<CustomFetchResult<T, E>>;
    put<T, E extends BaseError = BaseError>(path: string, body?: Record<string, unknown> | BodyInit | null, options?: Omit<Partial<FetchOptions<T, E>>, "method" | "body">): Promise<CustomFetchResult<T, E>>;
    patch<T, E extends BaseError = BaseError>(path: string, body?: Record<string, unknown> | BodyInit | null, options?: Omit<Partial<FetchOptions<T, E>>, "method" | "body">): Promise<CustomFetchResult<T, E>>;
    delete<T, E extends BaseError = BaseError>(path: string, options?: Omit<Partial<FetchOptions<T, E>>, "method">): Promise<CustomFetchResult<T, E>>;
    request<T, E extends BaseError = BaseError>(method: HttpMethod, path: string, options?: Partial<FetchOptions<T, E>>): Promise<CustomFetchResult<T, E>>;
};
