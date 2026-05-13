import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): TrpcContext {
  const adminUser: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@example.com",
    name: "Admin User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user: adminUser,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

function createRegularUserContext(): TrpcContext {
  const regularUser: AuthenticatedUser = {
    id: 2,
    openId: "regular-user",
    email: "user@example.com",
    name: "Regular User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user: regularUser,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("Admin Router", () => {
  it("should allow admin to access stats", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const stats = await caller.admin.stats();

    expect(stats).toBeDefined();
    expect(typeof stats?.totalDocuments).toBe("number");
    expect(typeof stats?.totalUsers).toBe("number");
    expect(typeof stats?.totalChunks).toBe("number");
    expect(typeof stats?.totalEmbeddings).toBe("number");
  });

  it("should deny regular user access to stats", async () => {
    const ctx = createRegularUserContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.admin.stats()).rejects.toThrow("Unauthorized");
  });

  it("should allow admin to list documents", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const documents = await caller.admin.listDocuments({
      limit: 10,
      offset: 0,
    });

    expect(Array.isArray(documents)).toBe(true);
  });

  it("should deny regular user access to list documents", async () => {
    const ctx = createRegularUserContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.admin.listDocuments({
        limit: 10,
        offset: 0,
      })
    ).rejects.toThrow("Unauthorized");
  });

  it("should allow admin to list users", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const users = await caller.admin.listUsers();

    expect(Array.isArray(users)).toBe(true);
  });

  it("should deny regular user access to list users", async () => {
    const ctx = createRegularUserContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.admin.listUsers()).rejects.toThrow("Unauthorized");
  });

  it("should filter documents by status", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const documents = await caller.admin.listDocuments({
      status: "completed",
      limit: 10,
    });

    expect(Array.isArray(documents)).toBe(true);
    // All documents should have completed status if any exist
    documents.forEach((item) => {
      if (item.document) {
        expect(item.document.status).toBe("completed");
      }
    });
  });

  it("should filter documents by user", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const documents = await caller.admin.listDocuments({
      userId: 1,
      limit: 10,
    });

    expect(Array.isArray(documents)).toBe(true);
    // All documents should belong to user 1 if any exist
    documents.forEach((item) => {
      if (item.document) {
        expect(item.document.userId).toBe(1);
      }
    });
  });
});
