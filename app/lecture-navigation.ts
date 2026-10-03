export type SlidePosition = { h: number; v: number; f?: number };

export const returnSlideParam = "returnToSlide";

export function parseSlidePosition(hash: string | null): SlidePosition | null {
  const match = hash?.match(/^#\/(\d+)(?:\/(\d+))?(?:\/(\d+))?$/);
  if (!match) return null;
  const h = Number(match[1]);
  const v = Number(match[2] ?? 0);
  const f = match[3] === undefined ? undefined : Number(match[3]);
  if (![h, v, ...(f === undefined ? [] : [f])].every(Number.isSafeInteger)) return null;
  return { h, v, ...(f === undefined ? {} : { f }) };
}

export function slidePositionHash(position: SlidePosition): string {
  const fragment = position.f !== undefined && Number.isSafeInteger(position.f) && position.f >= 0
    ? position.f : undefined;
  return "#/" + position.h + (position.v > 0 || fragment !== undefined ? "/" + position.v : "")
    + (fragment === undefined ? "" : "/" + fragment);
}

function positionKey(lectureNumber: number) {
  return "data4ai:lecture-" + lectureNumber + ":slide";
}

export function readSlidePosition(lectureNumber: number): SlidePosition | null {
  if (typeof window === "undefined") return null;
  try {
    return parseSlidePosition(window.sessionStorage.getItem(positionKey(lectureNumber)));
  } catch {
    return null;
  }
}

export function rememberSlidePosition(lectureNumber: number, position: SlidePosition) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(positionKey(lectureNumber), slidePositionHash(position));
  } catch {
    // The explicit return link still works when browser storage is unavailable.
  }
}

export function returnSlidePosition(url: URL): SlidePosition | null {
  const value = url.searchParams.get(returnSlideParam);
  return value === null ? null : parseSlidePosition("#/" + value);
}

export function setReturnSlidePosition(url: URL, position: SlidePosition) {
  url.searchParams.set(returnSlideParam, slidePositionHash(position).slice(2));
}

/** Select the mapped passage, stopping before the next heading or example anchor. */
export function lecturePassageBlocks(root: HTMLElement, target: HTMLElement): HTMLElement[] {
  if (!root.contains(target)) return [];
  let first = target;
  while (first.parentElement && first.parentElement !== root) first = first.parentElement;
  if (first.parentElement !== root) return [];
  const blocks = [first];
  for (let next = first.nextElementSibling; next; next = next.nextElementSibling) {
    if (/^H[1-6]$/.test(next.tagName) || next.tagName === "SECTION") break;
    const hasExampleAnchor = [...next.querySelectorAll("span[id]")]
      .some(span => !span.closest("pre, code"));
    if (hasExampleAnchor) break;
    blocks.push(next as HTMLElement);
  }
  return blocks;
}
