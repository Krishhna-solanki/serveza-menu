import { describe, expect, it } from "vitest";
import { getMenuUrl } from "./menuUrl";

describe("getMenuUrl", () => {
  it("uses the Netlify site and public menu path", () => {
    expect(getMenuUrl("golden-spoon")).toBe(
      "https://serveza-menu.netlify.app/menu/golden-spoon",
    );
  });
});