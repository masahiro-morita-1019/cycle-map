"use client";

import type { Provider } from "@/lib/gbfs/types";

type Props = {
  services: Provider[];
  labels: Record<Provider, string>;
  onToggle: (p: Provider) => void;
};

const ALL: Provider[] = ["hellocycling", "docomo"];

export function ServiceFilter({ services, labels, onToggle }: Props) {
  return (
    <div className="rounded-lg bg-neutral-900/85 backdrop-blur px-3 py-2 text-sm shadow-lg ring-1 ring-white/10">
      <div className="mb-1 text-[10px] uppercase tracking-wider text-neutral-400">
        サービス
      </div>
      <div className="flex flex-col gap-1">
        {ALL.map((p) => {
          const on = services.includes(p);
          return (
            <label
              key={p}
              className="flex cursor-pointer items-center gap-2 select-none"
            >
              <input
                type="checkbox"
                className="accent-blue-500"
                checked={on}
                onChange={() => onToggle(p)}
              />
              <span className={on ? "text-white" : "text-neutral-400"}>
                {labels[p]}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
