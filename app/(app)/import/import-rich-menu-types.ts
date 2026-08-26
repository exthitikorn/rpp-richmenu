export type LineAccountOption = {
  id: string;
  name: string;
};

export type InitialArea = {
  x: number;
  y: number;
  width: number;
  height: number;
  actionType: string;
  action: Record<string, unknown>;
};

export type EditInitialData = {
  richMenuId: string;
  name: string;
  chatBarText?: string;
  imageUrl: string | null;
  width: number;
  height: number;
  lineAccountId: string;
  lineRichMenuId: string | null;
  status: string;
  isDefault: boolean;
  areas: InitialArea[];
};

export type ActionType = "message" | "uri" | "richmenuswitch" | "location";

export const AREA_ACTION_HINT: Record<ActionType, string> = {
  message: "msg",
  uri: "uri",
  richmenuswitch: "switch",
  location: "loc",
};

export type AreaDraft = {
  id: string;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  actionType: ActionType;
  label: string;
  text: string;
  uri: string;
  data: string;
  richMenuAliasId: string;
};

export type DragRect = {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
};

export type ResizeHandle = "nw" | "ne" | "sw" | "se";

export type PointerDraftInteraction = {
  type: "draw";
  pointerId: number;
  draft: DragRect;
};

export type PointerMoveInteraction = {
  type: "move";
  pointerId: number;
  areaId: string;
  startPoint: { x: number; y: number };
  initialBounds: AreaDraft["bounds"];
};

export type PointerResizeInteraction = {
  type: "resize";
  pointerId: number;
  areaId: string;
  handle: ResizeHandle;
  startPoint: { x: number; y: number };
  initialBounds: AreaDraft["bounds"];
};

export type PointerInteraction =
  | PointerDraftInteraction
  | PointerMoveInteraction
  | PointerResizeInteraction;

export type RenderedImageFrame = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export type RichMenuAliasOption = {
  richMenuId: string;
  aliasId: string;
  name: string;
  lineAccountName: string;
};

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function mapInitialAreasToDrafts(areas: InitialArea[]): AreaDraft[] {
  return areas.map((area) => {
    const actionType = (
      ["message", "uri", "richmenuswitch", "location"].includes(area.actionType)
        ? area.actionType
        : "message"
    ) as ActionType;

    return {
      id: crypto.randomUUID(),
      bounds: {
        x: area.x,
        y: area.y,
        width: area.width,
        height: area.height,
      },
      actionType,
      label:
        typeof area.action?.label === "string"
          ? (area.action.label as string)
          : "",
      text:
        typeof area.action?.text === "string"
          ? (area.action.text as string)
          : "",
      uri:
        typeof area.action?.uri === "string" ? (area.action.uri as string) : "",
      data:
        typeof area.action?.data === "string" && area.action.data
          ? (area.action.data as string)
          : actionType === "richmenuswitch"
            ? "action=switch_menu"
            : "",
      richMenuAliasId:
        typeof area.action?.richMenuAliasId === "string"
          ? (area.action.richMenuAliasId as string)
          : "",
    };
  });
}

type NormalizedArea = {
  bounds: AreaDraft["bounds"];
  action:
    | { label?: string; type: "message"; text: string }
    | { label?: string; type: "uri"; uri: string }
    | {
        label?: string;
        type: "richmenuswitch";
        richMenuAliasId: string;
        data: string;
      }
    | { label?: string; type: "location" };
};

export function normalizeAreasForSubmit(areas: AreaDraft[]): NormalizedArea[] {
  return areas.map((area, index) => {
    if (area.actionType === "message" && !area.text.trim()) {
      throw new Error(
        `พื้นที่ที่ ${index + 1}: กรุณากรอกข้อความสำหรับ Message Action`,
      );
    }
    if (area.actionType === "uri" && !area.uri.trim()) {
      throw new Error(
        `พื้นที่ที่ ${index + 1}: กรุณากรอก URL สำหรับ URI Action`,
      );
    }
    if (area.actionType === "richmenuswitch" && !area.richMenuAliasId.trim()) {
      throw new Error(`พื้นที่ที่ ${index + 1}: กรุณาเลือก Rich Menu ปลายทาง`);
    }

    const baseAction = area.label.trim() ? { label: area.label.trim() } : {};

    if (area.actionType === "message") {
      return {
        bounds: area.bounds,
        action: {
          ...baseAction,
          type: "message" as const,
          text: area.text.trim(),
        },
      };
    }
    if (area.actionType === "uri") {
      return {
        bounds: area.bounds,
        action: {
          ...baseAction,
          type: "uri" as const,
          uri: area.uri.trim(),
        },
      };
    }

    if (area.actionType === "richmenuswitch") {
      return {
        bounds: area.bounds,
        action: {
          ...baseAction,
          type: "richmenuswitch" as const,
          richMenuAliasId: area.richMenuAliasId.trim(),
          data: area.data.trim() || "action=switch_menu",
        },
      };
    }

    return {
      bounds: area.bounds,
      action: {
        ...baseAction,
        type: "location" as const,
      },
    };
  });
}
