import { QueryClient } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { commonPatterns, createKeys, invalidate } from "../keys";

describe("createKeys", () => {
  it("should create typed query keys with scope", () => {
    const itemKeys = createKeys("items", {
      list: (filters?: { status?: string }) => ({ filters }),
      byId: (id: string) => ({ id }),
    });

    expect(itemKeys.all()).toEqual(["items"]);
    expect(itemKeys.list()).toEqual(["items", "list"]);
    expect(itemKeys.list({ status: "active" })).toEqual([
      "items",
      "list",
      { filters: { status: "active" } },
    ]);
    expect(itemKeys.byId("123")).toEqual(["items", "byId", { id: "123" }]);
  });

  it("should omit params when all values are undefined", () => {
    const keys = createKeys("test", {
      optional: (param?: string) => ({ param }),
    });

    expect(keys.optional()).toEqual(["test", "optional"]);
    expect(keys.optional("value")).toEqual(["test", "optional", { param: "value" }]);
  });

  it("should handle multiple parameters", () => {
    const keys = createKeys("users", {
      byRole: (role: string, active?: boolean) => ({ role, active }),
    });

    expect(keys.byRole("admin")).toEqual(["users", "byRole", { role: "admin" }]);
    expect(keys.byRole("admin", true)).toEqual([
      "users",
      "byRole",
      { role: "admin", active: true },
    ]);
  });
});

describe("invalidate", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  it("should invalidate all queries in a scope", async () => {
    const spy = vi.spyOn(queryClient, "invalidateQueries");

    await invalidate.scope("items").all(queryClient);

    expect(spy).toHaveBeenCalledWith({ queryKey: ["items"] });
  });

  it("should invalidate specific operation", async () => {
    const spy = vi.spyOn(queryClient, "invalidateQueries");

    await invalidate.scope("items").operation("list", queryClient);

    expect(spy).toHaveBeenCalledWith({ queryKey: ["items", "list"] });
  });

  it("should invalidate with exact match", async () => {
    const spy = vi.spyOn(queryClient, "invalidateQueries");
    const queryKey = ["items", "byId", { id: "123" }];

    await invalidate.scope("items").exact(queryKey, queryClient);

    expect(spy).toHaveBeenCalledWith({ queryKey, exact: true });
  });

  it("should invalidate multiple scopes", async () => {
    const spy = vi.spyOn(queryClient, "invalidateQueries");

    await invalidate.multiple(["items", "users"], queryClient);

    expect(spy).toHaveBeenCalledWith({ queryKey: ["items"] });
    expect(spy).toHaveBeenCalledWith({ queryKey: ["users"] });
  });

  it("should invalidate all queries", async () => {
    const spy = vi.spyOn(queryClient, "invalidateQueries");

    await invalidate.all(queryClient);

    expect(spy).toHaveBeenCalledWith();
  });
});

describe("commonPatterns", () => {
  it("should create CRUD resource pattern", () => {
    const itemKeys = commonPatterns.resource("items");

    expect(itemKeys.list()).toEqual(["items", "list"]);
    expect(itemKeys.list({ status: "active" })).toEqual([
      "items",
      "list",
      { params: { status: "active" } },
    ]);
    expect(itemKeys.byId("123")).toEqual(["items", "byId", { id: "123" }]);
    expect(itemKeys.create()).toEqual(["items", "create"]);
    expect(itemKeys.update("456")).toEqual(["items", "update", { id: "456" }]);
    expect(itemKeys.delete("789")).toEqual(["items", "delete", { id: "789" }]);
  });

  it("should create paginated resource pattern", () => {
    const postKeys = commonPatterns.paginated("posts");

    expect(postKeys.page(1)).toEqual(["posts", "page", { page: 1 }]);
    expect(postKeys.page(2, 20)).toEqual(["posts", "page", { page: 2, size: 20 }]);
    expect(postKeys.infinite()).toEqual(["posts", "infinite"]);
  });

  it("should create user-scoped pattern", () => {
    const projectKeys = commonPatterns.userScoped("projects");

    expect(projectKeys.byUser("user123")).toEqual(["projects", "byUser", { userId: "user123" }]);
    expect(projectKeys.currentUser()).toEqual(["projects", "currentUser"]);
  });
});
