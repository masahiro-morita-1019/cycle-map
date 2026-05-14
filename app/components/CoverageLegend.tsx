"use client";

import { COVERAGE_COLORS } from "./CoverageLayer";

const ITEMS: { key: keyof typeof COVERAGE_COLORS; label: string }[] = [
  { key: "both", label: "両サービスあり" },
  { key: "hello", label: "HELLO CYCLING のみ" },
  { key: "docomo", label: "ドコモのみ" },
  { key: "none", label: "提供なし" },
];

/**
 * 都道府県カバレッジ (コロプレス) 凡例。
 * 表示制御は MapView 側で行う (zoom が COVERAGE_MAX_ZOOM 未満のときだけ表示)。
 */
export function CoverageLegend() {
  return (
    <div className="rounded-lg bg-neutral-900/85 backdrop-blur px-3 py-2 shadow-lg ring-1 ring-white/10">
      <div className="mb-1 text-[10px] uppercase tracking-wider text-neutral-400">
        都道府県カバレッジ
      </div>
      <ul className="flex flex-col gap-1">
        {ITEMS.map(({ key, label }) => (
          <li key={key} className="flex items-center gap-2 text-xs">
            <span
              className="inline-block h-3 w-3 rounded-sm ring-1 ring-white/30"
              style={{ backgroundColor: COVERAGE_COLORS[key] }}
              aria-hidden
            />
            <span>{label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
