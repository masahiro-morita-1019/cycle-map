"use client";

import { useEffect, useState } from "react";

// 仮置きの連絡先。本番運用時に置き換える。
const CONTACT_EMAIL = "contact@example.com";

export function AboutModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="pointer-events-auto rounded bg-neutral-900/70 px-2 py-1 text-[10px] text-neutral-200 hover:bg-neutral-900/90 backdrop-blur"
      >
        利用について
      </button>

      {open ? (
        <div
          className="pointer-events-auto fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-3 sm:items-center"
          onClick={() => setOpen(false)}
        >
          <div
            className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-xl bg-neutral-900 p-5 text-sm text-neutral-200 shadow-2xl ring-1 ring-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-start justify-between">
              <h2 className="text-base font-semibold">Portly (ポートリー) について</h2>
              <button
                onClick={() => setOpen(false)}
                aria-label="閉じる"
                className="rounded p-1 text-neutral-400 hover:bg-white/10 hover:text-white"
              >
                ✕
              </button>
            </div>

            <section className="space-y-3 leading-relaxed text-neutral-300">
              <p>
                <strong className="text-white">Portly (ポートリー)</strong> は、
                HELLO CYCLING およびドコモ・バイクシェアのシェアサイクルポート情報を
                地図上で横断的に検索・閲覧できる無料 Web アプリです。
              </p>

              <h3 className="mt-3 font-semibold text-white">データの出典</h3>
              <p>
                本データは
                <a
                  href="https://www.odpt.org/"
                  target="_blank"
                  rel="noreferrer"
                  className="mx-1 underline decoration-neutral-500 hover:text-white"
                >
                  公共交通オープンデータセンター
                </a>
                において提供されているデータを利用しています。
              </p>
              <ul className="ml-4 list-disc space-y-1 text-xs">
                <li>
                  OpenStreet 株式会社「HELLO CYCLING バイクシェア関連情報 (GBFS)」、
                  <a
                    href="https://creativecommons.org/licenses/by/4.0/deed.ja"
                    target="_blank"
                    rel="noreferrer"
                    className="underline decoration-neutral-500 hover:text-white"
                  >
                    クリエイティブ・コモンズ・ライセンス 表示 4.0 国際
                  </a>
                </li>
                <li>
                  株式会社ドコモ・バイクシェア「バイクシェア関連情報 (GBFS, 東京エリア)」、
                  <a
                    href="https://creativecommons.org/licenses/by/4.0/deed.ja"
                    target="_blank"
                    rel="noreferrer"
                    className="underline decoration-neutral-500 hover:text-white"
                  >
                    クリエイティブ・コモンズ・ライセンス 表示 4.0 国際
                  </a>
                </li>
              </ul>

              <h3 className="mt-3 font-semibold text-white">広告について</h3>
              <p>
                本サイトは Google AdSense を含む第三者配信の広告サービスを
                利用しており、また Amazon.co.jp 等のアフィリエイトプログラムにも
                参加しています。掲載商品の購入により運営者が報酬を得る場合が
                あります。
              </p>

              <h3 className="mt-3 font-semibold text-white">免責事項</h3>
              <p>
                表示されるデータは公共交通オープンデータセンターから取得していますが、その
                <strong className="text-white"> 正確性・完全性が保証されるものではありません</strong>。
                実際の貸出・返却可否は各事業者の公式アプリ等でご確認ください。
              </p>

              <h3 className="mt-3 font-semibold text-white">お問い合わせ</h3>
              <p>
                本サイトの内容についてのお問い合わせは、
                <strong className="text-white"> 公共交通事業者 (HELLO CYCLING / ドコモ・バイクシェア等)
                には直接行わず</strong>
                、下記の開発者宛にお願いいたします。
              </p>
              <p className="text-xs text-neutral-400">
                連絡先:{" "}
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="underline decoration-neutral-500 hover:text-white"
                >
                  {CONTACT_EMAIL}
                </a>
              </p>
            </section>
          </div>
        </div>
      ) : null}
    </>
  );
}
