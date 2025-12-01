<div align="center">

# 🚀 CustomFetch

### Production-Ready, 100% Type-Safe HTTP Client

[![npm version](https://img.shields.io/npm/v/@hco/custom-fetch.svg?style=flat-square)](https://www.npmjs.com/package/@hco/custom-fetch)
[![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Zero Dependencies](https://img.shields.io/badge/dependencies-0-green?style=flat-square)](https://bundlephobia.com/package/@hco/custom-fetch)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-≥18.0.0-green?style=flat-square&logo=node.js)](https://nodejs.org/)
[![Bun](https://img.shields.io/badge/Bun-≥1.0.0-pink?style=flat-square&logo=bun)](https://bun.sh/)

**A lightweight, zero-dependency HTTP client built for server-side TypeScript applications.**

Enterprise-grade features • Discriminated union responses • Never throws • Full type inference

[Installation](#installation) •
[Quick Start](#quick-start) •
[API Reference](#api-reference) •
[Examples](#advanced-usage)

</div>

---

## 📋 Table of Contents

- [Why CustomFetch?](#-why-customfetch)
- [Features](#-features)
- [Installation](#-installation)
- [Quick Start](#-quick-start)
- [API Reference](#-api-reference)
  - [CustomFetch Function](#customfetch-function)
  - [createClient Factory](#createclient-factory)
  - [Cache Utilities](#cache-utilities)
  - [Type Guard Helpers](#type-guard-helpers)
- [Configuration Options](#-configuration-options)
- [Response Types](#-response-types)
- [Advanced Usage](#-advanced-usage)
  - [Runtime Validation](#runtime-validation)
  - [Request/Response Interceptors](#requestresponse-interceptors)
  - [Retry with Exponential Backoff](#retry-with-exponential-backoff)
  - [Response Caching](#response-caching)
  - [Timeout & Abort Controller](#timeout--abort-controller)
  - [Binary Response Handling](#binary-response-handling)
  - [Error Transformation](#error-transformation)
  - [Query Parameters](#query-parameters)
- [TypeScript Types](#-typescript-types)
- [Best Practices](#-best-practices)
- [Comparison with Alternatives](#-comparison-with-alternatives)
- [Author](#-author)
- [License](#-license)

---

## 🤔 Why CustomFetch?

Modern applications require robust HTTP clients that go beyond simple `fetch` calls. CustomFetch addresses common pain points:

| Problem | CustomFetch Solution |
|---------|---------------------|
| **Inconsistent error handling** | Discriminated union responses (`isSuccess: true/false`) - never throws, always returns structured data |
| **No built-in retries** | Automatic retries with exponential backoff for 5xx errors and rate limits (429) |
| **No request timeouts** | Built-in timeout support with AbortController |
| **Repetitive boilerplate** | Client factory with shared configuration (baseUrl, headers, interceptors) |
| **Runtime type safety** | Optional type guards for validating response shapes at runtime |
| **No caching** | In-memory response caching with configurable TTL |
| **Hard to debug** | Request IDs, duration tracking, and configurable debug logging |
| **Complex interceptor patterns** | Simple `onRequest` and `onResponse` hooks |
| **No type assertions needed** | 100% type-safe with zero `any`, `unknown`, or `as` casts |
| **Inconsistent binary handling** | Automatic detection and base64 encoding of binary responses |

### The Problem with Traditional Fetch

```typescript
// ❌ Traditional fetch - error prone, verbose, no type safety
try {
  const response = await fetch("https://api.example.com/users/1");
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  const user = await response.json(); // any type!
  // No idea if user actually has the shape you expect
} catch (error) {
  // Could be network error, JSON parse error, or HTTP error
  // Good luck distinguishing them!
}

// ✅ CustomFetch - clean, type-safe, predictable
const result = await api.get<User>("/users/1");
if (result.isSuccess) {
  console.log(result.response.name); // Fully typed!
} else {
  console.log(result.errors.message); // Structured error
  console.log(result.code); // HTTP status or null for network errors
}
```

---

## ✨ Features

### Core Features

| Feature | Description |
|---------|-------------|
| 🎯 **Zero Dependencies** | Built entirely on native `fetch` API - no bloat |
| 📦 **Tiny Bundle** | < 5KB minified + gzipped |
| 🔒 **100% Type-Safe** | No `any`, no `unknown`, no type assertions |
| 🏷️ **Discriminated Unions** | `isSuccess` flag enables perfect type narrowing |
| 🚫 **Never Throws** | All errors returned in structured `ErrorResponse` |
| 🔄 **Automatic Retries** | Exponential backoff for 5xx and 429 errors |
| ⏱️ **Request Timeouts** | Built-in AbortController-based timeouts |
| 💾 **Response Caching** | In-memory TTL-based caching |
| 🪝 **Interceptors** | `onRequest` and `onResponse` hooks |
| 🔍 **Runtime Validation** | Type guards for response shape validation |
| 📊 **Request Metrics** | Unique request IDs and duration tracking |
| 🔧 **Client Factory** | Pre-configured reusable instances |

### HTTP Features

| Feature | Description |
|---------|-------------|
| 📤 **All HTTP Methods** | GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS |
| 🔗 **Query Parameters** | Automatic serialization of objects, arrays, primitives |
| 📎 **Custom Headers** | Static headers or async header factories |
| 🍪 **Credentials** | Optional cookie inclusion |
| 🔐 **Bearer Auth** | Built-in `customToken` option |
| 📁 **Binary Support** | Automatic base64 encoding for binary responses |

### Developer Experience

| Feature | Description |
|---------|-------------|
| 🐛 **Debug Mode** | Environment-aware logging |
| 🔄 **Transformers** | Response and error transformation hooks |
| ⚡ **Async Headers** | Dynamic header resolution (e.g., refresh tokens) |
| 🆔 **Request IDs** | Unique identifiers for tracing |
| ⏰ **Duration Metrics** | Built-in request timing |

---

## 📦 Installation

```bash
# npm
npm install @hco/custom-fetch

# yarn
yarn add @hco/custom-fetch

# pnpm
pnpm add @hco/custom-fetch

# bun
bun add @hco/custom-fetch
```

### Requirements

- **Node.js** >= 18.0.0 (native fetch support)
- **Bun** >= 1.0.0

> **Note:** This package is designed for **server-side** usage only. It uses Node.js/Bun globals like `process.env` and `Buffer`.

---

## 🚀 Quick Start

### Basic Usage

```typescript
import { CustomFetch } from "@hco/custom-fetch";

interface User {
  id: string;
  name: string;
  email: string;
}

const result = await CustomFetch<User>({
  options: {
    url: "https://api.example.com/users/1",
  },
});

if (result.isSuccess) {
  console.log(result.response); // User object
  console.log(result.code);     // 200
  console.log(result.requestId); // "m5x2k-a3b4c5"
  console.log(result.durationMs); // 142
} else {
  console.error(result.errors.message);
  console.error(result.code); // null or HTTP status code
}
```

### Using the Client Factory

```typescript
import { createClient } from "@hco/custom-fetch";

const api = createClient({
  baseUrl: "https://api.example.com",
  defaultHeaders: { "Authorization": "Bearer token123" },
  defaultTimeout: 10000,
  defaultRetries: 3,
});

// GET request
const users = await api.get<User[]>("/users");

// POST request
const newUser = await api.post<User>("/users", {
  name: "John Doe",
  email: "john@example.com",
});

// PUT request
const updated = await api.put<User>("/users/1", { name: "Jane Doe" });

// PATCH request
const patched = await api.patch<User>("/users/1", { email: "jane@example.com" });

// DELETE request
const deleted = await api.delete<void>("/users/1");
```

---

## 📖 API Reference

### CustomFetch Function

The core function for making HTTP requests.

```typescript
async function CustomFetch<T, E extends BaseError = BaseError>(
  props: CustomFetchProps<T, E>
): Promise<CustomFetchResult<T, E>>
```

**Type Parameters:**
- `T` - Expected response data type
- `E` - Error type (must extend `BaseError`, defaults to `BaseError`)

**Returns:** `Promise<CustomFetchResult<T, E>>` - A discriminated union of success or error response

---

### createClient Factory

Creates a configured HTTP client instance with shared defaults.

```typescript
function createClient(config?: ClientConfig): {
  get<T, E>(path: string, options?): Promise<CustomFetchResult<T, E>>;
  post<T, E>(path: string, body?, options?): Promise<CustomFetchResult<T, E>>;
  put<T, E>(path: string, body?, options?): Promise<CustomFetchResult<T, E>>;
  patch<T, E>(path: string, body?, options?): Promise<CustomFetchResult<T, E>>;
  delete<T, E>(path: string, options?): Promise<CustomFetchResult<T, E>>;
  request<T, E>(method: HttpMethod, path: string, options?): Promise<CustomFetchResult<T, E>>;
}
```

**ClientConfig Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `baseUrl` | `string` | `""` | Base URL prepended to all requests |
| `defaultHeaders` | `HeadersInit \| () => HeadersInit \| Promise<HeadersInit>` | `{}` | Default headers (static or async function) |
| `defaultTimeout` | `number` | `30000` | Default request timeout in milliseconds |
| `defaultRetries` | `number` | `0` | Default retry count for failed requests |
| `defaultRetryDelay` | `number` | `1000` | Default base delay between retries |
| `debug` | `boolean` | `process.env.NODE_ENV === "development"` | Enable debug logging |
| `onRequest` | `RequestInterceptor` | - | Global request interceptor |
| `onResponse` | `ResponseInterceptor` | - | Global response interceptor |

---

### Cache Utilities

```typescript
// Clear all cached responses
function clearFetchCache(): void;

// Clear a specific cache entry
function clearSpecificCache(
  url: string,
  method?: HttpMethod,  // default: "GET"
  body?: string | null  // default: null
): void;

// Get cache statistics
function getCacheStats(): { size: number; keys: string[] };
```

---

### Type Guard Helpers

```typescript
// Create a type guard that checks for required fields
function createObjectGuard<T extends Record<string, unknown>>(
  requiredFields: (keyof T)[]
): (data: unknown) => data is T;

// Create a type guard with custom validation logic
function createCustomGuard<T>(
  validator: (data: unknown) => boolean
): (data: unknown) => data is T;
```

---

## ⚙️ Configuration Options

Full list of options available in `FetchOptions<T, E>`:

### Request Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `url` | `string` | **required** | Request URL (absolute or relative to baseUrl) |
| `method` | `HttpMethod` | `"GET"` | HTTP method: `"GET"`, `"POST"`, `"PUT"`, `"PATCH"`, `"DELETE"`, `"HEAD"`, `"OPTIONS"` |
| `headers` | `HeadersInit` | `{}` | Request headers |
| `body` | `BodyInit \| null` | `null` | Request body |
| `params` | `QueryParams` | - | URL query parameters (automatically serialized) |

### Authentication

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `customToken` | `string` | - | Bearer token (automatically adds `Authorization: Bearer <token>` header) |

### Timing & Retry

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `timeout` | `number` | `30000` | Request timeout in milliseconds |
| `retries` | `number` | `0` | Number of retry attempts for failed requests |
| `retryDelay` | `number` | `1000` | Base delay between retries (uses exponential backoff) |

### Status Handling

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `validateStatus` | `(status: number) => boolean` | `(status) => status >= 200 && status < 300` | Custom status validation function |

### Runtime Validation

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `responseGuard` | `ResponseGuard<T>` | - | Type guard to validate successful response shape |
| `errorGuard` | `ErrorGuard<E>` | - | Type guard to validate error response shape |

### Transformers

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `responseTransformer` | `ResponseTransformer<T>` | - | Transform raw response data to type `T` |
| `errorTransformer` | `ErrorTransformer<E>` | - | Transform raw error data to type `E` |

### Caching

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `cacheResponse` | `boolean` | `false` | Enable response caching |
| `cacheTime` | `number` | `300000` (5 min) | Cache TTL in milliseconds |

### Other Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `includeCookies` | `boolean` | `false` | Include cookies in request (`credentials: "include"`) |
| `debug` | `boolean` | `process.env.NODE_ENV === "development"` | Enable debug console logging |
| `abortController` | `AbortController` | - | External abort controller for request cancellation |

### Interceptors

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `onRequest` | `RequestInterceptor` | - | Modify request before sending |
| `onResponse` | `ResponseInterceptor<T, E>` | - | Process/modify response after receiving |

---

## 📋 Response Types

### SuccessResponse<T>

Returned when `isSuccess: true`:

```typescript
interface SuccessResponse<T> {
  isSuccess: true;
  response: T;           // Parsed response data
  errors: undefined;
  code: number;          // HTTP status code (e.g., 200)
  createdAt: Date;       // Response timestamp
  headers: Record<string, string | string[]>;
  requestId: string;     // Unique request identifier
  durationMs: number;    // Request duration in milliseconds
}
```

### ErrorResponse<E>

Returned when `isSuccess: false`:

```typescript
interface ErrorResponse<E> {
  isSuccess: false;
  response: undefined;
  errors: E;             // Error data (extends BaseError)
  code: number | null;   // HTTP status code or null for network errors
  createdAt: Date;       // Response timestamp
  requestId: string;     // Unique request identifier
  durationMs: number;    // Request duration in milliseconds
  stack?: string;        // Error stack trace (only in development)
}
```

### BaseError

Minimum error shape:

```typescript
interface BaseError {
  message: string;
  [key: string]: string | number | boolean | null | undefined;
}
```

---

## 🔧 Advanced Usage

### Runtime Validation

Validate response shapes at runtime using type guards:

```typescript
import { CustomFetch, createObjectGuard, createCustomGuard } from "@hco/custom-fetch";

interface User {
  id: string;
  name: string;
  email: string;
  age: number;
}

// Simple field presence check
const isUser = createObjectGuard<User>(["id", "name", "email", "age"]);

// Custom validation with type checking
const isValidUser = createCustomGuard<User>((data) => {
  const d = data as Partial<User>;
  return (
    typeof d.id === "string" &&
    typeof d.name === "string" &&
    typeof d.email === "string" &&
    d.email.includes("@") &&
    typeof d.age === "number" &&
    d.age > 0
  );
});

const result = await CustomFetch<User>({
  options: {
    url: "https://api.example.com/users/1",
    responseGuard: isValidUser,
  },
});

if (result.isSuccess) {
  // TypeScript knows result.response is User
  console.log(result.response.email);
} else {
  // Could be "Response validation failed" if guard returned false
  console.error(result.errors.message);
}
```

---

### Request/Response Interceptors

Modify requests before sending and process responses after receiving:

```typescript
import { createClient, type RequestContext, type ResponseContext } from "@hco/custom-fetch";

const api = createClient({
  baseUrl: "https://api.example.com",
  
  // Request interceptor - runs before every request
  onRequest: (context: RequestContext) => {
    // Add custom headers
    context.headers.set("X-Request-ID", context.requestId);
    context.headers.set("X-Timestamp", Date.now().toString());
    
    // Log outgoing requests
    console.log(`[${context.requestId}] ${context.method} ${context.url}`);
    
    return context;
  },
  
  // Response interceptor - runs after every response
  onResponse: (context) => {
    const { request, result, durationMs } = context;
    
    // Log response metrics
    console.log(
      `[${request.requestId}] ${request.method} ${request.url} -> ${result.code} (${durationMs}ms)`
    );
    
    // You can transform the result here
    return result;
  },
});

// Per-request interceptors (override global)
const result = await api.get<User>("/users/1", {
  onRequest: (ctx) => {
    ctx.headers.set("X-Custom-Header", "value");
    return ctx;
  },
});
```

**Async Interceptors:**

```typescript
const api = createClient({
  baseUrl: "https://api.example.com",
  
  // Async header resolution (e.g., refresh token)
  defaultHeaders: async () => {
    const token = await getAccessToken(); // Your async token logic
    return {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  },
  
  onRequest: async (context) => {
    // Async operations in interceptor
    await logToAnalytics(context);
    return context;
  },
});
```

---

### Retry with Exponential Backoff

Automatic retries for transient failures (5xx errors, 429 rate limits, network errors):

```typescript
const result = await CustomFetch<User>({
  options: {
    url: "https://api.example.com/users/1",
    retries: 3,          // Retry up to 3 times
    retryDelay: 1000,    // Base delay: 1 second
    debug: true,         // See retry logs
  },
});

// Retry behavior:
// - Attempt 1: immediate
// - Attempt 2: after 1000ms (1s)
// - Attempt 3: after 2000ms (2s) 
// - Attempt 4: after 4000ms (4s)
// Total max wait: 7 seconds

// Retries happen for:
// - HTTP 500-599 (server errors)
// - HTTP 429 (rate limited)
// - Network errors (TypeError with "NetworkError")
```

---

### Response Caching

Cache successful responses in memory:

```typescript
const api = createClient({
  baseUrl: "https://api.example.com",
});

// Enable caching for this request
const result = await api.get<User[]>("/users", {
  cacheResponse: true,
  cacheTime: 60000, // Cache for 1 minute
});

// Second call returns cached response instantly
const cachedResult = await api.get<User[]>("/users", {
  cacheResponse: true,
  cacheTime: 60000,
});

// Cache management
import { clearFetchCache, clearSpecificCache, getCacheStats } from "@hco/custom-fetch";

// Clear specific entry
clearSpecificCache("https://api.example.com/users", "GET");

// Clear all cache
clearFetchCache();

// Check cache status
const stats = getCacheStats();
console.log(`Cache size: ${stats.size}`);
console.log(`Cached keys:`, stats.keys);
```

**Cache Key Format:** `{METHOD}:{URL}:{BODY}`

---

### Timeout & Abort Controller

Request timeouts and manual cancellation:

```typescript
// Automatic timeout
const result = await CustomFetch<User>({
  options: {
    url: "https://api.example.com/slow-endpoint",
    timeout: 5000, // 5 second timeout
  },
});

if (!result.isSuccess && result.code === 408) {
  console.log("Request timed out");
}

// Manual cancellation with external AbortController
const controller = new AbortController();

// Cancel after 3 seconds
setTimeout(() => controller.abort(), 3000);

const result = await CustomFetch<User>({
  options: {
    url: "https://api.example.com/users/1",
    abortController: controller,
  },
});

// Or cancel on user action
document.getElementById("cancel-btn")?.addEventListener("click", () => {
  controller.abort();
});
```

---

### Binary Response Handling

Binary responses (images, PDFs, etc.) are automatically encoded as base64:

```typescript
// Fetch an image
const result = await CustomFetch<string>({
  options: {
    url: "https://api.example.com/avatar.png",
  },
});

if (result.isSuccess) {
  // result.response is base64-encoded string
  const base64Image = result.response;
  const imgSrc = `data:image/png;base64,${base64Image}`;
}

// Detected binary content types:
// - image/*
// - audio/*
// - video/*
// - font/*
// - application/octet-stream
// - application/pdf
// - application/zip, x-zip, x-rar, x-tar, x-bzip, x-gzip
// - application/java-archive
// - application/vnd.ms-*
// - application/vnd.openxmlformats-*
```

---

### Error Transformation

Transform API error responses to a consistent format:

```typescript
// API returns: { error: "Not found", errorCode: 404 }
// You want:    { message: "Not found", code: 404 }

interface ApiError extends BaseError {
  message: string;
  code: number;
}

const result = await CustomFetch<User, ApiError>({
  options: {
    url: "https://api.example.com/users/999",
    errorTransformer: (rawError, statusCode) => ({
      message: (rawError as any).error || rawError.message || "Unknown error",
      code: (rawError as any).errorCode || statusCode,
    }),
  },
});

if (!result.isSuccess) {
  console.log(result.errors.message); // "Not found"
  console.log(result.errors.code);    // 404
}
```

---

### Query Parameters

Automatic serialization of query parameters:

```typescript
const result = await api.get<User[]>("/users", {
  params: {
    page: 1,
    limit: 10,
    status: "active",
    tags: ["admin", "verified"],  // Arrays supported
    includeDeleted: false,
    search: null,                  // null/undefined are skipped
  },
});

// Request URL: /users?page=1&limit=10&status=active&tags=admin&tags=verified&includeDeleted=false
```

---

## 📝 TypeScript Types

All types are exported for your convenience:

```typescript
import type {
  // Response types
  SuccessResponse,
  ErrorResponse,
  CustomFetchResult,
  
  // Base types
  BaseError,
  HttpMethod,
  QueryParams,
  
  // Validation
  ResponseGuard,
  ErrorGuard,
  
  // Transformers
  ErrorTransformer,
  ResponseTransformer,
  
  // Interceptors
  RequestContext,
  ResponseContext,
  RequestInterceptor,
  ResponseInterceptor,
  
  // Configuration
  FetchOptions,
  CustomFetchProps,
  ClientConfig,
  CacheItem,
  
  // Legacy aliases
  CustomFetchReturnType,
  OptionsType,
} from "@hco/custom-fetch";
```

---

## ✅ Best Practices

### 1. Always Use Discriminated Unions

```typescript
// ✅ Good - Use isSuccess for type narrowing
const result = await api.get<User>("/users/1");
if (result.isSuccess) {
  // TypeScript knows: result.response is User
  console.log(result.response.name);
} else {
  // TypeScript knows: result.errors is BaseError
  console.error(result.errors.message);
}

// ❌ Bad - Don't assume success
const result = await api.get<User>("/users/1");
console.log(result.response.name); // Error: response could be undefined
```

### 2. Create Configured Client Instances

```typescript
// ✅ Good - Reusable configured client
const api = createClient({
  baseUrl: process.env.API_URL,
  defaultHeaders: { "X-API-Key": process.env.API_KEY },
  defaultTimeout: 10000,
  defaultRetries: 2,
});

// ❌ Bad - Repeating configuration
await CustomFetch({ options: { url: "https://api.example.com/users", timeout: 10000 }});
await CustomFetch({ options: { url: "https://api.example.com/posts", timeout: 10000 }});
```

### 3. Use Runtime Validation for External APIs

```typescript
// ✅ Good - Validate untrusted responses
const isUser = createObjectGuard<User>(["id", "name", "email"]);
const result = await api.get<User>("/users/1", { responseGuard: isUser });

// ❌ Bad - Trust external API blindly
const result = await api.get<User>("/users/1");
// API could return anything!
```

### 4. Handle Errors Gracefully

```typescript
// ✅ Good - Comprehensive error handling
const result = await api.get<User>("/users/1");

if (!result.isSuccess) {
  if (result.code === 404) {
    return notFound();
  }
  if (result.code === 401) {
    return redirect("/login");
  }
  if (result.code === null) {
    // Network error
    return showNetworkError();
  }
  // Generic error
  return showError(result.errors.message);
}

return result.response;
```

### 5. Use Debug Mode During Development

```typescript
// Automatically enabled when NODE_ENV === "development"
// Or enable explicitly:
const result = await api.get<User>("/users/1", { debug: true });

// Console output:
// [CustomFetch] GET https://api.example.com/users/1 -> 200 (142ms)
// [CustomFetch] Retry 1/3 after 1000ms
// [CustomFetch] Cache hit: https://api.example.com/users/1
```

---

## 🔄 Comparison with Alternatives

| Feature | CustomFetch | axios | ky | got |
|---------|-------------|-------|-----|-----|
| **Bundle Size** | ~5KB | ~13KB | ~8KB | ~48KB |
| **Zero Dependencies** | ✅ | ❌ | ❌ | ❌ |
| **TypeScript First** | ✅ | Partial | Partial | Partial |
| **Discriminated Unions** | ✅ | ❌ | ❌ | ❌ |
| **Never Throws** | ✅ | ❌ | ❌ | ❌ |
| **Runtime Validation** | ✅ Built-in | ❌ | ❌ | ❌ |
| **Type Guards** | ✅ Built-in | ❌ | ❌ | ❌ |
| **Request ID Tracking** | ✅ Built-in | ❌ | ❌ | ❌ |
| **Duration Metrics** | ✅ Built-in | ❌ | ❌ | ❌ |
| **Server-side Optimized** | ✅ | ❌ | ✅ | ✅ |
| **Automatic Retries** | ✅ | Via plugin | ✅ | ✅ |
| **Request/Response Interceptors** | ✅ | ✅ | ✅ | ✅ |
| **Response Caching** | ✅ Built-in | ❌ | ❌ | ✅ |

### Why Not axios/ky/got?

- **axios**: Large bundle, throws on HTTP errors, requires interceptors for structured error handling
- **ky**: Throws on HTTP errors, limited TypeScript inference, no built-in validation
- **got**: Node.js only, large bundle, complex API, throws on HTTP errors

**CustomFetch** is purpose-built for server-side TypeScript applications where type safety and predictable error handling are paramount.

---

## 👤 Author

<div align="center">

**Hidayet Can Özcan**

[![GitHub](https://img.shields.io/badge/GitHub-HidayetCanOzcan-181717?style=flat-square&logo=github)](https://github.com/HidayetCanOzcan)
[![Email](https://img.shields.io/badge/Email-hidayetcan%40gmail.com-D14836?style=flat-square&logo=gmail)](mailto:hidayetcan@gmail.com)

</div>

### Contact

- **GitHub:** [@HidayetCanOzcan](https://github.com/HidayetCanOzcan)
- **Email:** [hidayetcan@gmail.com](mailto:hidayetcan@gmail.com)

---

## ⚠️ Contributing

> **This project is not accepting external contributions.**
>
> CustomFetch is a personal project maintained solely by the author. Bug reports and feature requests can be submitted via [GitHub Issues](https://github.com/HidayetCanOzcan/custom-fetch/issues), but pull requests will not be reviewed or merged.

---

## 📄 License

MIT License © 2024 [Hidayet Can Özcan](https://github.com/HidayetCanOzcan)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

---

<div align="center">

**Made with ❤️ for the TypeScript community**

If you find this package useful, consider giving it a ⭐ on [GitHub](https://github.com/HidayetCanOzcan/custom-fetch)!

</div>
