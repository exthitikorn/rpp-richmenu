export type FlexPath = string; // "" = root; segments joined by "."; numeric segments for arrays

export function parsePath(path: FlexPath): (string | number)[] {
  if (path === "") return [];
  return path.split(".").map((seg) => (/^\d+$/.test(seg) ? Number(seg) : seg));
}

export function getAtPath(root: unknown, path: FlexPath): unknown {
  let cur: unknown = root;
  for (const seg of parsePath(path)) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string | number, unknown>)[seg];
  }
  return cur;
}

export function setAtPath(root: unknown, path: FlexPath, value: unknown): unknown {
  const segments = parsePath(path);
  if (segments.length === 0) return value;

  function update(current: unknown, index: number): unknown {
    const key = segments[index];
    const isLast = index === segments.length - 1;

    if (typeof key === "number") {
      const arr = Array.isArray(current) ? [...current] : [];
      arr[key] = isLast ? value : update(arr[key], index + 1);
      return arr;
    }

    const obj =
      current && typeof current === "object" && !Array.isArray(current)
        ? { ...(current as Record<string, unknown>) }
        : {};
    obj[key] = isLast ? value : update(obj[key], index + 1);
    return obj;
  }

  return update(root, 0);
}

export function deleteAtPath(root: unknown, path: FlexPath): unknown {
  const segments = parsePath(path);
  if (segments.length === 0) return root;

  function del(current: unknown, index: number): unknown {
    const key = segments[index];
    const isLast = index === segments.length - 1;

    if (isLast) {
      if (typeof key === "number" && Array.isArray(current)) {
        const arr = [...current];
        arr.splice(key, 1);
        return arr;
      }
      if (
        typeof key === "string" &&
        current &&
        typeof current === "object" &&
        !Array.isArray(current)
      ) {
        const obj = { ...(current as Record<string, unknown>) };
        delete obj[key];
        return obj;
      }
      return current;
    }

    if (typeof key === "number") {
      if (!Array.isArray(current)) return current;
      const arr = [...current];
      arr[key] = del(arr[key], index + 1);
      return arr;
    }

    if (!current || typeof current !== "object" || Array.isArray(current)) {
      return current;
    }
    const obj = { ...(current as Record<string, unknown>) };
    obj[key] = del(obj[key], index + 1);
    return obj;
  }

  return del(root, 0);
}

export function moveSibling(
  root: unknown,
  path: FlexPath,
  dir: -1 | 1,
): unknown {
  const segments = parsePath(path);
  if (segments.length === 0) return root;

  const last = segments[segments.length - 1];
  if (typeof last !== "number") return root;

  const parentPath = segments.slice(0, -1).join(".");
  const parent = getAtPath(root, parentPath);
  if (!Array.isArray(parent)) return root;

  const idx = last;
  const newIdx = idx + dir;
  if (newIdx < 0 || newIdx >= parent.length) return root;

  const arr = [...parent];
  [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
  return setAtPath(root, parentPath, arr);
}

// parentPath targets the box (or carousel) node; pushes into its `contents` array.
export function appendChild(
  root: unknown,
  parentPath: FlexPath,
  node: unknown,
): unknown {
  const parent = getAtPath(root, parentPath);
  if (!parent || typeof parent !== "object") return root;

  const contents = (parent as Record<string, unknown>).contents;
  if (!Array.isArray(contents)) return root;

  const contentsPath =
    parentPath === "" ? "contents" : `${parentPath}.contents`;
  return setAtPath(root, contentsPath, [...contents, node]);
}

export function defaultNode(
  type: "box" | "text" | "image" | "button" | "separator",
): Record<string, unknown> {
  switch (type) {
    case "box":
      return { type: "box", layout: "vertical", contents: [] };
    case "text":
      return { type: "text", text: "ข้อความ", wrap: true };
    case "image":
      return {
        type: "image",
        url: "https://via.placeholder.com/300x200",
        size: "full",
        aspectMode: "cover",
      };
    case "button":
      return {
        type: "button",
        action: {
          type: "uri",
          label: "เปิดลิงก์",
          uri: "https://example.com",
        },
      };
    case "separator":
      return { type: "separator" };
  }
}
