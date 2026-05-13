import { PROVIDER_LABEL, type StationWithStatus } from "@/lib/gbfs/types";

export function renderStationPopupLoadingHtml(): string {
  return `
    <div class="cm-popup">
      <div class="cm-popup__name">読み込み中…</div>
      <div class="cm-popup__notice">ポートの詳細情報を取得しています。</div>
    </div>
  `;
}

export function renderStationPopupHtml(s: StationWithStatus): string {
  const bikes = s.status?.numBikesAvailable ?? null;
  const docks = s.status?.numDocksAvailable ?? null;
  const liveUpdated = s.status?.lastReported
    ? formatRelative(s.status.lastReported)
    : "—";
  const staticUpdated = formatDate(s.staticUpdatedAt);

  return `
    <div class="cm-popup">
      <div class="cm-popup__provider">${escapeHtml(PROVIDER_LABEL[s.provider])}</div>
      <div class="cm-popup__name">${escapeHtml(s.name)}</div>
      <dl class="cm-popup__grid">
        <dt>借りられる</dt><dd>${bikes ?? "—"}<span> 台</span></dd>
        <dt>返せる</dt><dd>${docks ?? "—"}${docks != null ? "<span> 台</span>" : ""}</dd>
        <dt>容量</dt><dd>${s.capacity ?? "—"}${s.capacity != null ? "<span> 台</span>" : ""}</dd>
        <dt>空き状況の更新</dt><dd>${liveUpdated}</dd>
        <dt>ポート情報の取得</dt><dd>${staticUpdated}</dd>
      </dl>
      <div class="cm-popup__notice">
        ※ データの正確性・完全性は保証されません。
      </div>
    </div>
  `;
}

function formatRelative(unixSec: number): string {
  const diff = Math.floor(Date.now() / 1000 - unixSec);
  if (diff < 60) return `${diff}秒前`;
  if (diff < 3600) return `${Math.floor(diff / 60)}分前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}時間前`;
  return `${Math.floor(diff / 86400)}日前`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}/${m}/${day}`;
}

function escapeHtml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
