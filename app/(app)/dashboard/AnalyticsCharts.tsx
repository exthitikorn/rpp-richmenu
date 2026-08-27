import NextLink from "next/link";

type ByMenu = { richMenuId: string; count: number };
type ByArea = { richMenuId: string; areaIndex: number; _count: number };

type MenuRankItem = {
  id: string;
  rank: number;
  name: string;
  lineAccountName: string;
  count: number;
  share: number;
};

export function AnalyticsCharts({
  byArea,
  byMenu,
  menuMeta,
  menuNames,
  totalClicks,
}: {
  byArea: ByArea[];
  byMenu: ByMenu[];
  menuMeta: Record<string, { name: string; lineAccountName: string }>;
  menuNames: Record<string, string>;
  totalClicks: number;
}) {
  const menus: MenuRankItem[] = [...byMenu]
    .sort((a, b) => b.count - a.count)
    .map((item, index) => {
      const meta = menuMeta[item.richMenuId];

      return {
        id: item.richMenuId,
        rank: index + 1,
        name: meta?.name ?? menuNames[item.richMenuId] ?? item.richMenuId,
        lineAccountName: meta?.lineAccountName ?? "—",
        count: item.count,
        share:
          totalClicks > 0 ? Math.round((item.count / totalClicks) * 100) : 0,
      };
    });

  const areas = byArea.slice(0, 15).map((a, index) => {
    const menuName = menuNames[a.richMenuId] ?? a.richMenuId.slice(0, 6);

    return {
      key: `${a.richMenuId}-${a.areaIndex}`,
      rank: index + 1,
      label: `เมนู ${menuName} ปุ่ม #${a.areaIndex + 1}`,
      count: a._count,
    };
  });

  const menuMax = menus[0]?.count ?? 0;
  const areaMax = areas[0]?.count ?? 0;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="min-w-0 rounded-lg border border-default-200 bg-content1 p-4 shadow-none">
        <h3 className="mb-3 text-sm font-semibold">คลิกต่อ Rich Menu</h3>
        {menus.length === 0 ? (
          <p className="text-sm text-default-500">ยังไม่มีข้อมูลการคลิก</p>
        ) : (
          <ol className="space-y-3">
            {menus.map((menu) => {
              const widthPercent =
                menuMax > 0 ? Math.max((menu.count / menuMax) * 100, 8) : 8;

              return (
                <li key={menu.id} className="space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        <span className="mr-1.5 text-secondary-600">
                          #{menu.rank}
                        </span>
                        <NextLink
                          className="text-primary hover:underline"
                          href={`/rich-menus/${menu.id}/edit`}
                        >
                          {menu.name}
                        </NextLink>
                      </p>
                      <p className="truncate text-xs text-default-500">
                        {menu.lineAccountName}
                      </p>
                    </div>
                    <div className="shrink-0 text-right text-xs">
                      <p className="font-semibold text-secondary-700">
                        {menu.count.toLocaleString("th-TH")}
                      </p>
                      <p className="text-default-400">{menu.share}%</p>
                    </div>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-secondary-100/80">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-secondary to-primary"
                      style={{ width: `${widthPercent}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>

      <div className="min-w-0 rounded-lg border border-default-200 bg-content1 p-4 shadow-none">
        <h3 className="mb-3 text-sm font-semibold">Top ปุ่ม</h3>
        {areas.length === 0 ? (
          <p className="text-sm text-default-500">ยังไม่มีข้อมูลการคลิก</p>
        ) : (
          <ol className="space-y-3">
            {areas.map((area) => {
              const widthPercent =
                areaMax > 0 ? Math.max((area.count / areaMax) * 100, 8) : 8;

              return (
                <li key={area.key} className="space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="min-w-0 truncate text-sm font-medium">
                      <span className="mr-1.5 text-secondary-600">
                        #{area.rank}
                      </span>
                      {area.label}
                    </p>
                    <p className="shrink-0 text-xs font-semibold text-secondary-700">
                      {area.count.toLocaleString("th-TH")}
                    </p>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-secondary-100/80">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-secondary to-primary"
                      style={{ width: `${widthPercent}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </div>
  );
}
