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
    };

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
