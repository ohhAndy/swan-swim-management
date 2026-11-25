import { hasMinRole } from "./roles";

describe("hasMinRole", () => {
  it("allows the role itself and every role above it", () => {
    expect(hasMinRole("manager", "manager")).toBe(true);
    expect(hasMinRole("admin", "manager")).toBe(true);
    expect(hasMinRole("super_admin", "manager")).toBe(true);
  });

  it("rejects roles below the minimum", () => {
    expect(hasMinRole("supervisor", "manager")).toBe(false);
    expect(hasMinRole("admin", "super_admin")).toBe(false);
  });

  it("rejects missing and unknown roles", () => {
    expect(hasMinRole(undefined, "supervisor")).toBe(false);
    expect(hasMinRole(null, "supervisor")).toBe(false);
    expect(hasMinRole("viewer", "supervisor")).toBe(false);
    expect(hasMinRole("constructor", "supervisor")).toBe(false);
  });
});
