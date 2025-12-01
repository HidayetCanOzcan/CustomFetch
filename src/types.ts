// ============================================================================
// RESPONSE TYPES
// ============================================================================

/**
 * Success response shape - discriminated by isSuccess: true
 */
export interface SuccessResponse<T> {
	isSuccess: true;
	response: T;
	errors: undefined;
	code: number;
	createdAt: Date;
	headers: Record<string, string | string[]>;
	requestId: string;
	durationMs: number;
}

/**
 * Error response shape - discriminated by isSuccess: false
 */
export interface ErrorResponse<E> {
	isSuccess: false;
	response: undefined;
	errors: E;
	code: number | null;
	createdAt: Date;
	requestId: string;
	durationMs: number;
	stack?: string;
}

/**
 * Union type for fetch response - discriminated by isSuccess
 */
export type CustomFetchResult<T, E> = SuccessResponse<T> | ErrorResponse<E>;

// ============================================================================
// BASE TYPES
// ============================================================================

/**
 * Base error shape - all errors must have at least a message
 */
export interface BaseError {
	message: string;
	[key: string]: string | number | boolean | null | undefined;
}

/**
 * HTTP methods supported
 */
export type HttpMethod =
	| "GET"
	| "POST"
	| "PUT"
	| "PATCH"
	| "DELETE"
	| "HEAD"
	| "OPTIONS";

/**
 * Query parameters - supports nested objects and arrays
 */
export type QueryParams = Record<
	string,
	string | number | boolean | null | undefined | string[] | number[]
>;

// ============================================================================
// VALIDATION TYPES
// ============================================================================

/**
 * Type guard for runtime response validation
 */
export type ResponseGuard<T> = (data: unknown) => data is T;

/**
 * Type guard for runtime error validation
 */
export type ErrorGuard<E extends BaseError> = (data: unknown) => data is E;

// ============================================================================
// TRANSFORMER TYPES
// ============================================================================

/**
 * Error transformer function type
 */
export type ErrorTransformer<E extends BaseError> = (
	error: BaseError,
	code: number,
) => E;

/**
 * Response transformer function type
 */
export type ResponseTransformer<T> = (response: Record<string, unknown>) => T;

// ============================================================================
// INTERCEPTOR TYPES
// ============================================================================

/**
 * Request context passed to interceptors
 */
export interface RequestContext {
	url: string;
	method: HttpMethod;
	headers: Headers;
	body: BodyInit | null;
	requestId: string;
}

/**
 * Response context passed to interceptors
 */
export interface ResponseContext<T, E extends BaseError> {
	request: RequestContext;
	result: CustomFetchResult<T, E>;
	durationMs: number;
}

/**
 * Request interceptor - modify request before sending
 */
export type RequestInterceptor = (
	context: RequestContext,
) => RequestContext | Promise<RequestContext>;

/**
 * Response interceptor - process response after receiving
 */
export type ResponseInterceptor<T, E extends BaseError> = (
	context: ResponseContext<T, E>,
) => CustomFetchResult<T, E> | Promise<CustomFetchResult<T, E>>;

// ============================================================================
// CONFIGURATION TYPES
// ============================================================================

/**
 * Cache item structure
 */
export interface CacheItem<T, E> {
	data: CustomFetchResult<T, E>;
	timestamp: number;
}

/**
 * Fetch options configuration
 */
export interface FetchOptions<T, E extends BaseError> {
	// Required
	url: string;

	// Request configuration
	method?: HttpMethod;
	headers?: HeadersInit;
	body?: BodyInit | null;
	params?: QueryParams;

	// Authentication
	customToken?: string;

	// Timing
	timeout?: number;
	retries?: number;
	retryDelay?: number;

	// Status handling
	validateStatus?: (status: number) => boolean;

	// Runtime validation (type guards)
	responseGuard?: ResponseGuard<T>;
	errorGuard?: ErrorGuard<E>;

	// Transformers
	errorTransformer?: ErrorTransformer<E>;
	responseTransformer?: ResponseTransformer<T>;

	// Caching
	cacheResponse?: boolean;
	cacheTime?: number;

	// Other options
	includeCookies?: boolean;
	debug?: boolean;

	// External abort controller
	abortController?: AbortController;

	// Interceptors (per-request)
	onRequest?: RequestInterceptor;
	onResponse?: ResponseInterceptor<T, E>;
}

/**
 * Props wrapper for CustomFetch
 */
export interface CustomFetchProps<T, E extends BaseError> {
	options: FetchOptions<T, E>;
}

// ============================================================================
// CLIENT CONFIGURATION
// ============================================================================

/**
 * Configuration for creating a CustomFetch client instance
 */
export interface ClientConfig {
	baseUrl?: string;
	defaultHeaders?: HeadersInit | (() => HeadersInit | Promise<HeadersInit>);
	defaultTimeout?: number;
	defaultRetries?: number;
	defaultRetryDelay?: number;
	debug?: boolean;
	onRequest?: RequestInterceptor;
	onResponse?: ResponseInterceptor<unknown, BaseError>;
}

// ============================================================================
// LEGACY ALIASES (backward compatibility)
// ============================================================================

export type CustomFetchReturnType<T, E extends BaseError> = CustomFetchResult<
	T,
	E
>;
export type OptionsType = FetchOptions<Record<string, unknown>, BaseError>;
