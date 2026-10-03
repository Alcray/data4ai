import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

const source = readFileSync(new URL("../app/lecture-navigation.ts", import.meta.url), "utf8");
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
});
const navigation = await import("data:text/javascript;base64," + Buffer.from(outputText).toString("base64"));

test("Slide bookmarks preserve slide zero, vertical positions, and fragments", () => {
  for (const [hash, position] of [
    ["#/0", { h: 0, v: 0 }],
    ["#/36", { h: 36, v: 0 }],
    ["#/36/2", { h: 36, v: 2 }],
    ["#/36/0/0", { h: 36, v: 0, f: 0 }],
    ["#/36/2/3", { h: 36, v: 2, f: 3 }],
  ]) {
    assert.deepEqual(navigation.parseSlidePosition(hash), position);
    assert.equal(navigation.slidePositionHash(position), hash);
  }
  assert.equal(navigation.slidePositionHash({ h: 36, v: 0, f: -1 }), "#/36");
});

test("Invalid bookmark values cannot become slide destinations", () => {
  for (const hash of [null, "", "#/", "#/NaN", "#/-1", "#/2.5", "#/1/-1", "#/1/0/-2", "#/999999999999999999", "#lcs-order-example", "#/1<script>"]) {
    assert.equal(navigation.parseSlidePosition(hash), null, String(hash));
  }
});

test("Text URLs carry the exact slide independently of another tab's storage", () => {
  const url = new URL("https://example.test/data4ai/?lecture=4#lcs-order-example");
  assert.equal(navigation.returnSlidePosition(url), null);
  navigation.setReturnSlidePosition(url, { h: 36, v: 0 });
  assert.equal(url.hash, "#lcs-order-example");
  assert.equal(url.searchParams.get("returnToSlide"), "36");
  assert.deepEqual(navigation.returnSlidePosition(new URL(url.href)), { h: 36, v: 0 });
  url.searchParams.set("returnToSlide", "-1");
  assert.equal(navigation.returnSlidePosition(url), null);
});

test("Session bookmarks are isolated by lecture and tolerate blocked storage", () => {
  const previous = globalThis.window;
  const values = new Map();
  try {
    globalThis.window = { sessionStorage: {
      getItem: key => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value),
    } };
    navigation.rememberSlidePosition(4, { h: 36, v: 0 });
    navigation.rememberSlidePosition(5, { h: 9, v: 0 });
    assert.deepEqual(navigation.readSlidePosition(4), { h: 36, v: 0 });
    assert.deepEqual(navigation.readSlidePosition(5), { h: 9, v: 0 });
    assert.equal(navigation.readSlidePosition(6), null);
    globalThis.window = { get sessionStorage() { throw new Error("Storage blocked"); } };
    assert.equal(navigation.readSlidePosition(4), null);
    assert.doesNotThrow(() => navigation.rememberSlidePosition(4, { h: 36, v: 0 }));
    delete globalThis.window;
    assert.equal(navigation.readSlidePosition(4), null);
  } finally {
    if (previous === undefined) delete globalThis.window;
    else globalThis.window = previous;
  }
});

function fixture(blocks) {
  const root = { contains: target => blocks.some(block => block === target || block.anchors?.includes(target)) };
  blocks.forEach((block, index) => {
    block.parentElement = root;
    block.nextElementSibling = blocks[index + 1] ?? null;
    block.querySelectorAll = () => block.anchors ?? [];
    block.anchors?.forEach(anchor => {
      anchor.parentElement = block;
      anchor.closest = () => anchor.code ? block : null;
    });
  });
  return root;
}

test("Highlight ranges stop at the next example, not code line IDs", () => {
  const start = {};
  const nextExample = {};
  const blocks = [
    { tagName: "P", anchors: [start] },
    { tagName: "DIV", anchors: [{ code: true }] },
    { tagName: "TABLE" },
    { tagName: "P", anchors: [nextExample] },
    { tagName: "P" },
  ];
  const root = fixture(blocks);
  assert.deepEqual(navigation.lecturePassageBlocks(root, start), blocks.slice(0, 3));
  assert.deepEqual(navigation.lecturePassageBlocks(root, nextExample), blocks.slice(3));
});

test("Heading highlights exclude the following subsection and outside targets", () => {
  const blocks = [{ tagName: "H4" }, { tagName: "P" }, { tagName: "UL" }, { tagName: "H4" }, { tagName: "P" }];
  const root = fixture(blocks);
  assert.deepEqual(navigation.lecturePassageBlocks(root, blocks[0]), blocks.slice(0, 3));
  assert.deepEqual(navigation.lecturePassageBlocks(root, {}), []);
});
