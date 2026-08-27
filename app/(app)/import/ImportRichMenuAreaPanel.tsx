"use client";

import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";

import {
  AREA_ACTION_HINT,
  type ActionType,
  type AreaDraft,
  type RichMenuAliasOption,
} from "./import-rich-menu-types";

export function ImportRichMenuAreaPanel({
  areas,
  selectedArea,
  selectedAreaIndex,
  onSelectAreaId,
  onAreasChange,
  availableAliases,
  loadingAliases,
  currentRichMenuId,
  currentRichMenuAliasId,
}: {
  areas: AreaDraft[];
  selectedArea: AreaDraft | null;
  selectedAreaIndex: number;
  onSelectAreaId: (id: string) => void;
  onAreasChange: (updater: (prev: AreaDraft[]) => AreaDraft[]) => void;
  availableAliases: RichMenuAliasOption[];
  loadingAliases: boolean;
  currentRichMenuId?: string;
  currentRichMenuAliasId?: string;
}) {
  function updateAreaById(
    areaId: string,
    updater: (prev: AreaDraft) => AreaDraft,
  ) {
    onAreasChange((prev) =>
      prev.map((area) => (area.id === areaId ? updater(area) : area)),
    );
  }

  return (
    <>
      <h3 className="text-sm font-semibold text-foreground">
        Areas ({areas.length})
      </h3>

      {areas.length === 0 ? (
        <p className="text-sm text-default-500">ลากบนรูปเพื่อสร้าง Area</p>
      ) : (
        <>
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {areas.map((area, index) => {
              const active = area.id === selectedArea?.id;

              return (
                <Button
                  key={area.id}
                  className="shrink-0"
                  color={active ? "primary" : "default"}
                  size="sm"
                  variant={active ? "flat" : "light"}
                  onPress={() => onSelectAreaId(area.id)}
                >
                  Area {index + 1} · {AREA_ACTION_HINT[area.actionType]}
                </Button>
              );
            })}
          </div>

          {selectedArea ? (
            <div className="grid gap-2 border-t border-default-200 pt-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">
                    Area {selectedAreaIndex + 1}
                  </p>
                  <p className="text-xs text-default-500">
                    ({selectedArea.bounds.x}, {selectedArea.bounds.y}) ·{" "}
                    {selectedArea.bounds.width}×{selectedArea.bounds.height}
                  </p>
                </div>
                <Button
                  color="danger"
                  size="sm"
                  variant="solid"
                  onPress={() => {
                    const id = selectedArea.id;

                    onAreasChange((prev) =>
                      prev.filter((item) => item.id !== id),
                    );
                    onSelectAreaId("");
                  }}
                >
                  ลบ
                </Button>
              </div>

              <Select
                label="Action Type"
                labelPlacement="outside"
                selectedKeys={[selectedArea.actionType]}
                onSelectionChange={(keys) => {
                  const key = Array.from(keys)[0];

                  if (!key) return;
                  const nextType = String(key) as ActionType;

                  updateAreaById(selectedArea.id, (prev) => ({
                    ...prev,
                    actionType: nextType,
                    ...(nextType === "richmenuswitch" && !prev.data.trim()
                      ? { data: "action=switch_menu" }
                      : {}),
                  }));
                }}
              >
                <SelectItem key="message">message</SelectItem>
                <SelectItem key="uri">uri</SelectItem>
                <SelectItem key="richmenuswitch">richmenuswitch</SelectItem>
                <SelectItem key="location">location</SelectItem>
              </Select>

              {selectedArea.actionType === "message" && (
                <Input
                  label="ข้อความ"
                  labelPlacement="outside"
                  placeholder="เช่น ติดต่อแอดมิน"
                  value={selectedArea.text}
                  onValueChange={(value) =>
                    updateAreaById(selectedArea.id, (prev) => ({
                      ...prev,
                      text: value,
                    }))
                  }
                />
              )}
              {selectedArea.actionType === "uri" && (
                <Input
                  label="URL"
                  labelPlacement="outside"
                  placeholder="https://example.com"
                  value={selectedArea.uri}
                  onValueChange={(value) =>
                    updateAreaById(selectedArea.id, (prev) => ({
                      ...prev,
                      uri: value,
                    }))
                  }
                />
              )}
              {selectedArea.actionType === "richmenuswitch" && (
                <>
                  <Input
                    label="Data"
                    labelPlacement="outside"
                    placeholder="เช่น action=switch_menu"
                    value={selectedArea.data}
                    onValueChange={(value) =>
                      updateAreaById(selectedArea.id, (prev) => ({
                        ...prev,
                        data: value,
                      }))
                    }
                  />
                  <Select
                    disallowEmptySelection
                    className="min-w-0 max-w-full"
                    classNames={{
                      base: "min-w-0 max-w-full",
                      trigger: "min-w-0",
                      value: "truncate",
                      innerWrapper: "min-w-0",
                    }}
                    isLoading={loadingAliases}
                    label="Rich Menu ปลายทาง"
                    labelPlacement="outside"
                    placeholder={
                      loadingAliases
                        ? "กำลังโหลด..."
                        : "เลือก Rich Menu ปลายทาง"
                    }
                    renderValue={() => {
                      const aliasId = selectedArea.richMenuAliasId;
                      const alias =
                        availableAliases.find((a) => a.aliasId === aliasId) ??
                        (aliasId
                          ? {
                              name: "Alias ปัจจุบัน",
                              lineAccountName: "Custom",
                              aliasId,
                            }
                          : null);

                      if (!alias) return null;

                      return (
                        <span
                          className="block min-w-0 truncate"
                          title={`${alias.name} (${alias.lineAccountName}) · ${alias.aliasId}`}
                        >
                          {alias.name} ({alias.lineAccountName})
                        </span>
                      );
                    }}
                    selectedKeys={
                      selectedArea.richMenuAliasId
                        ? [selectedArea.richMenuAliasId]
                        : []
                    }
                    onSelectionChange={(keys) => {
                      const key = Array.from(keys)[0];

                      // HeroUI may fire empty selection when items re-render;
                      // ignore it so a chosen alias is not wiped before submit.
                      if (!key) return;
                      updateAreaById(selectedArea.id, (prev) => ({
                        ...prev,
                        richMenuAliasId: String(key),
                      }));
                    }}
                  >
                    {[
                      ...availableAliases.filter(
                        (alias) =>
                          !currentRichMenuId ||
                          (alias.richMenuId !== currentRichMenuId &&
                            alias.aliasId !== currentRichMenuAliasId),
                      ),
                      ...(selectedArea.richMenuAliasId &&
                      selectedArea.richMenuAliasId !== currentRichMenuAliasId &&
                      !availableAliases.some(
                        (alias) =>
                          alias.aliasId === selectedArea.richMenuAliasId,
                      )
                        ? [
                            {
                              richMenuId: "custom",
                              aliasId: selectedArea.richMenuAliasId,
                              name: "Alias ปัจจุบัน",
                              lineAccountName: "Custom",
                            } satisfies RichMenuAliasOption,
                          ]
                        : []),
                    ].map((alias) => (
                      <SelectItem
                        key={alias.aliasId}
                        textValue={`${alias.name} ${alias.lineAccountName} ${alias.aliasId}`}
                      >
                        <div className="flex min-w-0 flex-col">
                          <span className="truncate text-sm">
                            {alias.name} ({alias.lineAccountName})
                          </span>
                          <span className="truncate font-mono text-xs text-default-500">
                            {alias.aliasId}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </Select>
                </>
              )}
            </div>
          ) : null}
        </>
      )}
    </>
  );
}
