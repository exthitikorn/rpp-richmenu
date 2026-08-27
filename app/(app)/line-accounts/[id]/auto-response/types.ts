export type RuleRow = {
  id: string;
  keyword: string;
  isEnabled: boolean;
  responseType: "TEXT" | "FLEX";
  flexSource: "FORM" | "JSON" | null;
};
