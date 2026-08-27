export interface LineRichMenuArea {
  bounds: { x: number; y: number; width: number; height: number };
  action: LineRichMenuAction;
}

export type LineRichMenuAction =
  | { type: "uri"; uri: string; label?: string }
  | { type: "message"; text: string; label?: string }
  | { type: "postback"; data: string; displayText?: string; label?: string }
  | {
      type: "richmenuswitch";
      richMenuAliasId: string;
      data: string;
      label?: string;
    }
  | { type: "location"; label?: string };

export interface LineRichMenuPayload {
  size: { width: number; height: number };
  selected: boolean;
  name: string;
  chatBarText?: string;
  areas: LineRichMenuArea[];
}

export interface LineAccountCredentials {
  accessToken: string;
}

export type LineOutgoingMessage =
  | { type: "text"; text: string }
  | {
      type: "flex";
      altText: string;
      contents: Record<string, unknown>;
    };

/** คืน action ที่กรองเฉพาะฟิลด์ที่ LINE รองรับ เพื่อไม่ให้ฟิลด์เก่า (เช่น text) ทำให้ LINE ตีผิดเป็น message */
export function normalizeRichMenuAction(
  actionType: string,
  action: Record<string, unknown>,
): LineRichMenuAction {
  const raw = action as Record<string, string | undefined>;

  switch (actionType) {
    case "uri":
      return {
        type: "uri",
        uri: raw.uri ?? "",
        ...(raw.label ? { label: raw.label } : {}),
      };
    case "message":
      return {
        type: "message",
        text: raw.text ?? "",
        ...(raw.label ? { label: raw.label } : {}),
      };
    case "postback":
      return {
        type: "postback",
        data: raw.data ?? "",
        ...(raw.displayText ? { displayText: raw.displayText } : {}),
        ...(raw.label ? { label: raw.label } : {}),
      };
    case "richmenuswitch":
      return {
        type: "richmenuswitch",
        richMenuAliasId: raw.richMenuAliasId ?? "",
        data:
          raw.data && String(raw.data).trim() !== ""
            ? String(raw.data)
            : "switch",
        ...(raw.label ? { label: raw.label } : {}),
      };
    case "location":
      return {
        type: "location",
        ...(raw.label ? { label: raw.label } : {}),
      };
    default:
      return { type: "message", text: "" };
  }
}
