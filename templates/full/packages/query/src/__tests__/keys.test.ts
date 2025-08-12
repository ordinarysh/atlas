import { QueryClient } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { commonPatterns, createKeys, invalidate } from "../keys";

describe("createKeys", () => {
  it("should create typed query keys with scope", () => {
    const todoKeys = createKeys("todos", {
      list: (filters?: { status?: string }) => ({ filters }),
      byId: (id: string) => ({ id }),
    });

    expect(todoKeys.all()).toEqual(["todos"]);
    expect(todoKeys.list()).toEqual(["todos", "list"]);
    expect(todoKeys.list({ status: "active" })).toEqual([
      "todos",
      "list",
      { filters: { status: "active" } },
    ]);
    expect(todoKeys.byId("123")).toEqual(["todos", "byId", { id: "123" }]);
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

    await invalidate.scope("todos").all(queryClient);

    expect(spy).toHaveBeenCalledWith({ queryKey: ["todos"] });
  });

  it("should invalidate specific operation", async () => {
    const spy = vi.spyOn(queryClient, "invalidateQueries");

    await invalidate.scope("todos").operation("list", queryClient);

    expect(spy).toHaveBeenCalledWith({ queryKey: ["todos", "list"] });
  });

  it("should invalidate with exact match", async () => {
    const spy = vi.spyOn(queryClient, "invalidateQueries");
    const queryKey = ["todos", "byId", { id: "123" }];

    await invalidate.scope("todos").exact(queryKey, queryClient);

    expect(spy).toHaveBeenCalledWith({ queryKey, exact: true });
  });

  it("should invalidate multiple scopes", async () => {
    const spy = vi.spyOn(queryClient, "invalidateQueries");

    await invalidate.multiple(["todos", "users"], queryClient);

    expect(spy).toHaveBeenCalledWith({ queryKey: ["todos"] });
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
    const todoKeys = commonPatterns.resource("todos");

    expect(todoKeys.list()).toEqual(["todos", "list"]);
    expect(todoKeys.list({ status: "active" })).toEqual([
      "todos",
      "list",
      { params: { status: "active" } },
    ]);
    expect(todoKeys.byId("123")).toEqual(["todos", "byId", { id: "123" }]);
    expect(todoKeys.create()).toEqual(["todos", "create"]);
    expect(todoKeys.update("456")).toEqual(["todos", "update", { id: "456" }]);
    expect(todoKeys.delete("789")).toEqual(["todos", "delete", { id: "789" }]);
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
