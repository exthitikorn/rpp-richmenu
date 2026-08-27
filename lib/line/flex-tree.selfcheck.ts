import assert from "node:assert/strict";
import { emptyBubble } from "./flex-contents";
import {
  appendChild,
  deleteAtPath,
  getAtPath,
  moveSibling,
  setAtPath,
} from "./flex-tree";

let root = emptyBubble();
root = appendChild(root, "body", {
  type: "text",
  text: "A",
  wrap: true,
}) as typeof root;
root = appendChild(root, "body", {
  type: "text",
  text: "B",
  wrap: true,
}) as typeof root;

assert.equal(
  (getAtPath(root, "body.contents.0") as { text: string }).text,
  "A",
);

root = moveSibling(root, "body.contents.0", 1) as typeof root;
assert.equal(
  (getAtPath(root, "body.contents.0") as { text: string }).text,
  "B",
);

root = setAtPath(root, "body.contents.0.text", "BB") as typeof root;
assert.equal(
  (getAtPath(root, "body.contents.0") as { text: string }).text,
  "BB",
);

root = deleteAtPath(root, "body.contents.1") as typeof root;
assert.equal(
  ((getAtPath(root, "body.contents") as unknown[]) ?? []).length,
  1,
);

console.log("flex-tree.selfcheck: ok");
