import { createPresenceApi, type ApiOptions } from "./client.js";
import type { components } from "./schema.js";
export type Tokens = components["schemas"]["TokensDto"];
export type Login = components["schemas"]["LoginDto"];
export type Registration = components["schemas"]["RegisterDto"];
export interface SessionStore {
  read(): Promise<Tokens | null>;
  write(tokens: Tokens): Promise<void>;
  clear(): Promise<void>;
}
/** Test/development default. The mobile adapter uses Expo SecureStore. */
export function memorySessionStore(): SessionStore {
  let tokens: Tokens | null = null;
  return {
    async read() {
      return tokens ? { ...tokens } : null;
    },
    async write(value) {
      tokens = { ...value };
    },
    async clear() {
      tokens = null;
    },
  };
}
export class ApiFailure extends Error {
  constructor(
    public readonly status: number,
    public readonly requestId: string | null,
  ) {
    super(`API request failed (${status})`);
    this.name = "ApiFailure";
  }
}
function tokensFrom(data: unknown, response: Response): Tokens {
  if (!response.ok)
    throw new ApiFailure(response.status, response.headers.get("X-Request-Id"));
  const t = data as Partial<Tokens> | undefined;
  if (
    !t ||
    typeof t.accessToken !== "string" ||
    typeof t.refreshToken !== "string" ||
    typeof t.expiresIn !== "number" ||
    t.expiresIn <= 0 ||
    t.tokenType !== "Bearer"
  )
    throw new Error("Invalid token response");
  return t as Tokens;
}
/** Own one instance per app. Explicit refresh; no automatic replay of writes. */
export class AuthSession {
  private readonly api;
  private queue: Promise<unknown> = Promise.resolve();
  private refreshing: Promise<Tokens> | undefined;
  constructor(
    private readonly options: Omit<ApiOptions, "identity"> & {
      requestTimeoutMs?: number;
    },
    private readonly store: SessionStore,
  ) {
    if (
      !Number.isFinite(options.requestTimeoutMs ?? 30000) ||
      (options.requestTimeoutMs ?? 30000) <= 0
    )
      throw new Error("Invalid authentication timeout");
    this.api = createPresenceApi(options);
  }
  // Bound the complete response (including its body), even if a transport
  // ignores cancellation. Only a successfully awaited result may store tokens.
  private async request<T>(
    work: (signal: AbortSignal) => Promise<T>,
  ): Promise<T> {
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const deadline = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        reject(new Error("Authentication request timed out"));
        controller.abort();
      }, this.options.requestTimeoutMs ?? 30000);
    });
    try {
      return await Promise.race([work(controller.signal), deadline]);
    } finally {
      clearTimeout(timer);
    }
  }
  private serial<T>(work: () => Promise<T>): Promise<T> {
    const next = this.queue.then(work, work);
    this.queue = next.catch(() => undefined);
    return next;
  }
  async identity(organizationId?: string) {
    const tokens = await this.store.read();
    return tokens
      ? {
          accessToken: tokens.accessToken,
          ...(organizationId ? { organizationId } : {}),
        }
      : null;
  }
  login(input: Login): Promise<Tokens> {
    return this.serial(async () => {
      const { data, response } = await this.request((signal) =>
        this.api.POST("/api/v1/core/auth/login", { body: input, signal }),
      );
      const tokens = tokensFrom(data, response);
      await this.store.write(tokens);
      return tokens;
    });
  }
  register(input: Registration): Promise<Tokens> {
    return this.serial(async () => {
      const { data, response } = await this.request((signal) =>
        this.api.POST("/api/v1/core/auth/register", { body: input, signal }),
      );
      const tokens = tokensFrom(data, response);
      await this.store.write(tokens);
      return tokens;
    });
  }
  refresh(): Promise<Tokens> {
    if (this.refreshing) return this.refreshing;
    this.refreshing = this.serial(async () => {
      const old = await this.store.read();
      if (!old) throw new Error("Sign-in required");
      try {
        const { data, response } = await this.request((signal) =>
          this.api.POST("/api/v1/core/auth/refresh", {
            body: { refreshToken: old.refreshToken },
            signal,
          }),
        );
        const tokens = tokensFrom(data, response);
        await this.store.write(tokens);
        return tokens;
      } catch (error) {
        // A timeout may occur AFTER the server rotates the token. Never replay it.
        await this.store.clear();
        throw error;
      }
    }).finally(() => {
      this.refreshing = undefined;
    });
    return this.refreshing;
  }
  logout(): Promise<void> {
    return this.serial(async () => {
      const tokens = await this.store.read();
      // Local sign-out does not depend on server availability.
      await this.store.clear();
      try {
        if (tokens) {
          const client = createPresenceApi({
            ...this.options,
            identity: () => ({ accessToken: tokens.accessToken }),
          });
          const { response } = await this.request((signal) =>
            client.POST("/api/v1/core/auth/logout", { signal }),
          );
          if (!response.ok)
            throw new ApiFailure(
              response.status,
              response.headers.get("X-Request-Id"),
            );
        }
      } finally {
        await this.store.clear();
      }
    });
  }
}
