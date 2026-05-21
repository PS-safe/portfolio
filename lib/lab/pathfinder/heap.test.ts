import { describe, expect, it } from "vitest";
import { MinHeap } from "./heap";

const asc = (a: number, b: number) => a < b;

describe("MinHeap", () => {
  it("pops a fixed input in ascending order", () => {
    const h = new MinHeap<number>(asc);
    const input = [5, 3, 8, 1, 9, 2, 7, 0, 4, 6];
    input.forEach((x) => h.push(x));
    const out: number[] = [];
    while (h.size > 0) out.push(h.pop()!);
    expect(out).toEqual([...input].sort((a, b) => a - b));
  });

  it("behaves as a sort on randomized input (heap-sort invariant)", () => {
    const h = new MinHeap<number>(asc);
    const input = Array.from({ length: 1000 }, () => Math.floor(Math.random() * 10000));
    input.forEach((x) => h.push(x));
    const out: number[] = [];
    while (h.size > 0) out.push(h.pop()!);
    expect(out).toEqual([...input].sort((a, b) => a - b));
  });

  it("peek returns the minimum without removing it", () => {
    const h = new MinHeap<number>(asc);
    [4, 2, 6].forEach((x) => h.push(x));
    expect(h.peek()).toBe(2);
    expect(h.size).toBe(3);
  });

  it("returns undefined when empty", () => {
    const h = new MinHeap<number>(asc);
    expect(h.pop()).toBeUndefined();
    expect(h.peek()).toBeUndefined();
  });
});
