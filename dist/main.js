/**
 * CustomFetch - Production-ready HTTP client for Bun/Node server-side
 */
const IS_DEV = process.env?.NODE_ENV === "development";
const BINARY_PREFIXES = [
    "image/",
    "audio/",
    "video/",
    "font/",
    "application/octet-stream",
    "application/pdf",
    "application/zip",
    "application/x-zip",
    "application/x-rar",
    "application/x-tar",
    "application/x-bzip",
    "application/x-gzip",
    "application/java-archive",
    "application/vnd.ms-",
    "application/vnd.openxmlformats-",
];
function generateRequestId() {
    return `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`;
}
function isBinaryContentType(contentType) {
    if (!contentType)
        return false;
    return BINARY_PREFIXES.some((prefix) => contentType.startsWith(prefix));
}
function serializeParams(params) {
    const parts = [];
    for (const [key, value] of Object.entries(params)) {
        if (value === null || value === undefined)
            continue;
        if (Array.isArray(value)) {
            for (const item of value) {
                parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(item))}`);
            }
        }
        else {
            parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
        }
    }
    return parts.join("&");
}
function buildUrl(baseUrl, params) {
    if (!params || Object.keys(params).length === 0)
        return baseUrl;
    const queryString = serializeParams(params);
    const separator = baseUrl.includes("?") ? "&" : "?";
    return baseUrl + separator + queryString;
}
function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
const responseCache = new Map();
export function clearFetchCache() {
    responseCache.clear();
}
export function clearSpecificCache(url, method = "GET", body = null) {
    responseCache.delete(`${method}:${url}:${body ?? ""}`);
}
export function getCacheStats() {
    return { size: responseCache.size, keys: Array.from(responseCache.keys()) };
}
function createSuccessResponse(response, code, headers, requestId, durationMs) {
    return {
        isSuccess: true,
        response,
        errors: undefined,
        code,
        createdAt: new Date(),
        headers,
        requestId,
        durationMs,
    };
}
function createErrorResponse(errors, code, requestId, durationMs) {
    const base = {
        isSuccess: false,
        response: undefined,
        errors,
        code,
        createdAt: new Date(),
        requestId,
        durationMs,
    };
    if (IS_DEV) {
        base.stack = new Error().stack;
    }
    return base;
}
async function parseResponseBody(response) {
    const contentType = response.headers.get("content-type");
    const text = await response.text();
    if (contentType?.includes("application/json")) {
        try {
            return JSON.parse(text);
        }
        catch {
            return text;
        }
    }
    if (contentType?.includes("text/") ||
        contentType?.includes("application/xml")) {
        return text;
    }
    try {
        return JSON.parse(text);
    }
    catch {
        return text;
    }
}
export async function CustomFetch({ options, }) {
    const startTime = performance.now();
    const requestId = generateRequestId();
    const { url: rawUrl, method = "GET", headers: optionHeaders, body = null, params, customToken, timeout = 30000, retries = 0, retryDelay = 1000, validateStatus, responseGuard, errorGuard, errorTransformer, responseTransformer, cacheResponse = false, cacheTime = 5 * 60 * 1000, includeCookies = false, debug = IS_DEV, abortController: externalController, onRequest, onResponse, } = options;
    const shouldLog = debug;
    const url = buildUrl(rawUrl, params);
    const headers = new Headers(optionHeaders);
    if (customToken) {
        headers.set("Authorization", `Bearer ${customToken}`);
    }
    if (body && !headers.has("Content-Type") && typeof body === "string") {
        try {
            JSON.parse(body);
            headers.set("Content-Type", "application/json");
        }
        catch {
            // Not JSON
        }
    }
    let requestContext = {
        url,
        method,
        headers,
        body,
        requestId,
    };
    if (onRequest) {
        requestContext = await onRequest(requestContext);
    }
    const cacheKey = cacheResponse
        ? `${requestContext.method}:${requestContext.url}:$${typeof requestContext.body === "string" ? requestContext.body : ""}`
        : null;
    if (cacheKey) {
        const cachedItem = responseCache.get(cacheKey);
        if (cachedItem && Date.now() - cachedItem.timestamp < cacheTime) {
            if (shouldLog) {
                console.log(`[CustomFetch] Cache hit: ${requestContext.url}`);
            }
            return cachedItem.data;
        }
        if (cachedItem) {
            responseCache.delete(cacheKey);
        }
    }
    const makeError = (message, code) => {
        return createErrorResponse({ message }, code, requestId, Math.round(performance.now() - startTime));
    };
    let lastErrorMessage = "Maximum retry count reached";
    let attempts = 0;
    while (attempts <= retries) {
        const controller = externalController ?? new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        try {
            const response = await fetch(requestContext.url, {
                method: requestContext.method,
                headers: requestContext.headers,
                body: requestContext.body,
                signal: controller.signal,
                credentials: includeCookies ? "include" : "same-origin",
            });
            clearTimeout(timeoutId);
            const code = response.status;
            const durationMs = Math.round(performance.now() - startTime);
            if (shouldLog) {
                console.log(`[CustomFetch] ${requestContext.method} ${requestContext.url} -> ${code} (${durationMs}ms)`);
            }
            const isResponseOk = validateStatus ? validateStatus(code) : response.ok;
            if (!isResponseOk) {
                const rawError = await parseResponseBody(response);
                const errorData = typeof rawError === "string"
                    ? { message: rawError }
                    : { ...rawError, message: rawError.message ?? "Unknown error" };
                if (errorGuard && !errorGuard(errorData)) {
                    return createErrorResponse({ message: "Error validation failed" }, code, requestId, durationMs);
                }
                const transformedError = errorTransformer
                    ? errorTransformer(errorData, code)
                    : errorData;
                if ((code >= 500 || code === 429) && attempts < retries) {
                    lastErrorMessage = transformedError.message;
                    attempts++;
                    const backoffTime = retryDelay * 2 ** (attempts - 1);
                    if (shouldLog) {
                        console.log(`[CustomFetch] Retry ${attempts}/${retries} after ${backoffTime}ms`);
                    }
                    await delay(backoffTime);
                    continue;
                }
                let errorResponse = createErrorResponse(transformedError, code, requestId, durationMs);
                if (onResponse) {
                    const result = await onResponse({
                        request: requestContext,
                        result: errorResponse,
                        durationMs,
                    });
                    if (!result.isSuccess) {
                        errorResponse = result;
                    }
                }
                if (cacheKey && code >= 400 && code < 500) {
                    responseCache.set(cacheKey, {
                        data: errorResponse,
                        timestamp: Date.now(),
                    });
                }
                return errorResponse;
            }
            const contentType = response.headers.get("content-type") ?? "";
            let parsedResponse;
            if (isBinaryContentType(contentType)) {
                const arrayBuffer = await response.arrayBuffer();
                parsedResponse = Buffer.from(arrayBuffer).toString("base64");
            }
            else {
                const rawResponse = await parseResponseBody(response);
                if (responseGuard) {
                    if (!responseGuard(rawResponse)) {
                        return createErrorResponse({ message: "Response validation failed" }, code, requestId, durationMs);
                    }
                    parsedResponse = rawResponse;
                }
                else if (responseTransformer &&
                    typeof rawResponse === "object" &&
                    rawResponse !== null) {
                    parsedResponse = responseTransformer(rawResponse);
                }
                else {
                    parsedResponse = rawResponse;
                }
            }
            const headersObj = {};
            response.headers.forEach((value, key) => {
                headersObj[key] = value;
            });
            if (typeof response.headers.getSetCookie === "function") {
                const setCookies = response.headers.getSetCookie();
                if (setCookies.length > 0) {
                    headersObj["set-cookie"] = setCookies;
                }
            }
            let successResponse = createSuccessResponse(parsedResponse, code, headersObj, requestId, durationMs);
            if (onResponse) {
                const result = await onResponse({
                    request: requestContext,
                    result: successResponse,
                    durationMs,
                });
                if (result.isSuccess) {
                    successResponse = result;
                }
            }
            if (cacheKey) {
                responseCache.set(cacheKey, {
                    data: successResponse,
                    timestamp: Date.now(),
                });
            }
            return successResponse;
        }
        catch (error) {
            clearTimeout(timeoutId);
            const isError = error instanceof Error;
            const isAbortError = isError && error.name === "AbortError";
            const isNetworkError = error instanceof TypeError && error.message.includes("NetworkError");
            if (!isAbortError && isNetworkError && attempts < retries) {
                attempts++;
                const backoffTime = retryDelay * 2 ** (attempts - 1);
                if (shouldLog) {
                    console.log(`[CustomFetch] Network error, retry ${attempts}/${retries} after ${backoffTime}ms`);
                }
                await delay(backoffTime);
                continue;
            }
            if (shouldLog) {
                console.error(`[CustomFetch] Error (${requestId}):`, error);
            }
            if (isAbortError) {
                return makeError("Request timeout", 408);
            }
            return makeError(isError ? error.message : "Unknown error occurred", null);
        }
    }
    return makeError(lastErrorMessage, null);
}
export function createClient(config = {}) {
    const { baseUrl = "", defaultHeaders, defaultTimeout = 30000, defaultRetries = 0, defaultRetryDelay = 1000, debug = IS_DEV, onRequest: globalOnRequest, onResponse: globalOnResponse, } = config;
    async function resolveHeaders() {
        if (!defaultHeaders)
            return {};
        if (typeof defaultHeaders === "function")
            return await defaultHeaders();
        return defaultHeaders;
    }
    async function request(method, path, options = {}) {
        const resolvedDefaultHeaders = await resolveHeaders();
        const mergedHeaders = new Headers(resolvedDefaultHeaders);
        if (options.headers) {
            const optHeaders = new Headers(options.headers);
            optHeaders.forEach((value, key) => {
                mergedHeaders.set(key, value);
            });
        }
        const fullUrl = path.startsWith("http") ? path : baseUrl + path;
        return CustomFetch({
            options: {
                ...options,
                url: fullUrl,
                method,
                headers: mergedHeaders,
                timeout: options.timeout ?? defaultTimeout,
                retries: options.retries ?? defaultRetries,
                retryDelay: options.retryDelay ?? defaultRetryDelay,
                debug: options.debug ?? debug,
                onRequest: options.onRequest ?? globalOnRequest,
                onResponse: options.onResponse ?? globalOnResponse,
            },
        });
    }
    return {
        get(path, options) {
            return request("GET", path, options);
        },
        post(path, body, options) {
            const bodyInit = body &&
                typeof body === "object" &&
                !(body instanceof FormData) &&
                !(body instanceof Blob)
                ? JSON.stringify(body)
                : body;
            return request("POST", path, { ...options, body: bodyInit });
        },
        put(path, body, options) {
            const bodyInit = body &&
                typeof body === "object" &&
                !(body instanceof FormData) &&
                !(body instanceof Blob)
                ? JSON.stringify(body)
                : body;
            return request("PUT", path, { ...options, body: bodyInit });
        },
        patch(path, body, options) {
            const bodyInit = body &&
                typeof body === "object" &&
                !(body instanceof FormData) &&
                !(body instanceof Blob)
                ? JSON.stringify(body)
                : body;
            return request("PATCH", path, { ...options, body: bodyInit });
        },
        delete(path, options) {
            return request("DELETE", path, options);
        },
        request(method, path, options) {
            return request(method, path, options);
        },
    };
}
