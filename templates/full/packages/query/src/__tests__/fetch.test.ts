import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { createFetch, FetchError, fetchJson } from "../fetch";

describe("fetchJson", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should fetch and parse JSON successfully", async () => {
    const mockData = { id: 1, name: "Test" };
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => mockData,
    });

    const result = await fetchJson("/api/test");

    expect(result).toEqual(mockData);
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/test",
      expect.objectContaining({
        method: "GET",
        credentials: "include",
      }),
    );
  });

  it("should validate response with Zod schema", async () => {
    const schema = z.object({
      id: z.number(),
      name: z.string(),
    });

    const validData = { id: 1, name: "Test" };
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => validData,
    });

    const result = await fetchJson("/api/test", { schema });

    expect(result).toEqual(validData);
  });

  it("should throw on invalid schema", async () => {
    const schema = z.object({
      id: z.number(),
      name: z.string(),
    });

    const invalidData = { id: "1", name: "Test" }; // id should be number
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => invalidData,
    });

    await expect(fetchJson("/api/test", { schema })).rejects.toThrow();
  });

  it("should send POST request with JSON body", async () => {
    const body = { title: "New Todo" };
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => ({ id: 1, ...body }),
    });

    await fetchJson("/api/todos", {
      method: "POST",
      body,
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/todos",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(body),
        headers: expect.any(Headers) as Headers,
      }),
    );

    const mockFetch = vi.mocked(global.fetch);
    const callArgs = mockFetch.mock.calls[0];
    const headers = callArgs[1]?.headers as Headers;
    expect(headers.get("Content-Type")).toBe("application/json");
  });

  it("should throw FetchError on 4xx without retry", async () => {
    const errorData = { error: "Bad Request" };
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      statusText: "Bad Request",
      json: () => errorData,
    });

    await expect(fetchJson("/api/test")).rejects.toThrow(FetchError);
    expect(global.fetch).toHaveBeenCalledTimes(1); // No retry
  });

  it("should retry on 5xx errors", async () => {
    const mockData = { success: true };
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        json: () => ({ error: "Server Error" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => mockData,
      });

    const result = await fetchJson("/api/test");

    expect(result).toEqual(mockData);
    expect(global.fetch).toHaveBeenCalledTimes(2); // Initial + 1 retry
  });

  it("should retry on network errors", async () => {
    const mockData = { success: true };
    global.fetch = vi
      .fn()
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValueOnce({
        ok: true,
        json: () => mockData,
      });

    const result = await fetchJson("/api/test");

    expect(result).toEqual(mockData);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it("should respect max retries", async () => {
    global.fetch = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));

    await expect(fetchJson("/api/test")).rejects.toThrow("Failed to fetch");
    expect(global.fetch).toHaveBeenCalledTimes(3); // Initial + 2 retries
  });

  it("should handle abort signal", async () => {
    const controller = new AbortController();
    const error = new Error("Aborted");
    error.name = "AbortError";

    global.fetch = vi.fn().mockRejectedValue(error);

    await expect(fetchJson("/api/test", { signal: controller.signal })).rejects.toThrow("Aborted");

    expect(global.fetch).toHaveBeenCalledTimes(1); // No retry on abort
  });

  it("should handle absolute URLs", async () => {
    const mockData = { external: true };
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => mockData,
    });

    await fetchJson("https://api.example.com/data");

    expect(global.fetch).toHaveBeenCalledWith("https://api.example.com/data", expect.any(Object));
  });
});

describe("createFetch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it("should create fetch instance with default options", async () => {
    const mockData = { id: 1 };
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => mockData,
    });

    const api = createFetch({
      headers: { "X-API-Key": "secret" },
    });

    await api("/endpoint");

    const mockFetch = vi.mocked(global.fetch);
    const callArgs = mockFetch.mock.calls[0];
    const headers = callArgs[1]?.headers as Headers;
    expect(headers.get("X-API-Key")).toBe("secret");
  });

  it("should merge options with defaults", async () => {
    const mockData = { id: 1 };
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => mockData,
    });

    const api = createFetch({
      headers: { "X-API-Key": "secret" },
    });

    await api("/endpoint", {
      headers: { "X-Custom": "value" },
    });

    const mockFetch = vi.mocked(global.fetch);
    const callArgs = mockFetch.mock.calls[0];
    const headers = callArgs[1]?.headers as Headers;
    expect(headers.get("X-API-Key")).toBe("secret");
    expect(headers.get("X-Custom")).toBe("value");
  });
});

describe("FetchError", () => {
  it("should create error with correct properties", () => {
    const response = new Response("", { status: 404, statusText: "Not Found" });
    const error = new FetchError("Resource not found", 404, response, {
      error: "Not Found",
    });

    expect(error.message).toBe("Resource not found");
    expect(error.status).toBe(404);
    expect(error.response).toBe(response);
    expect(error.data).toEqual({ error: "Not Found" });
    expect(error.name).toBe("FetchError");
  });
});
