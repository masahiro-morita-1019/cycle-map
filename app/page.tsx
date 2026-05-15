import { Suspense } from "react";
import Link from "next/link";
import { MapView } from "./components/MapView";
import { Footer } from "./components/Footer";

export default function Page() {
  return (
    <main className="min-h-dvh bg-neutral-950 text-neutral-100">
      <section
        aria-label="シェアサイクルポート検索地図"
        className="relative h-[72dvh] min-h-[540px] overflow-hidden border-b border-neutral-800"
      >
        <Suspense fallback={<MapLoading />}>
          <MapView />
        </Suspense>
        <Footer />
      </section>

      <section className="mx-auto grid max-w-6xl gap-10 px-5 py-10 lg:grid-cols-[1.35fr_0.65fr] lg:px-8 lg:py-14">
        <div className="space-y-8">
          <div className="space-y-4">
            <p className="text-sm font-semibold text-sky-300">
              HELLO CYCLING・ドコモ・バイクシェア対応
            </p>
            <h1 className="max-w-3xl text-3xl font-bold leading-tight text-white sm:text-4xl">
              Portly は、近くのシェアサイクルポートを横断して探せる地図サービスです。
            </h1>
            <p className="max-w-3xl leading-8 text-neutral-300">
              Portly (ポートリー) は、公共交通オープンデータセンターで提供されている
              GBFS データをもとに、複数のシェアサイクルサービスのポート情報を
              ひとつの地図で確認できる無料 Web アプリです。出発前に借りられる台数や
              返却できる空きラックの目安を確認し、徒歩移動を含めた都市内の移動計画に
              役立てられます。
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <InfoCard
              title="横断検索"
              body="HELLO CYCLING とドコモ・バイクシェアのポートを同じ地図上で確認できます。"
            />
            <InfoCard
              title="空き状況"
              body="貸出可能台数と返却可能台数をポート詳細で確認できます。"
            />
            <InfoCard
              title="共有しやすい URL"
              body="地図の位置、ズーム、サービス絞り込みを URL に保持します。"
            />
          </div>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">使い方</h2>
            <ol className="space-y-3 text-sm leading-7 text-neutral-300">
              <li>
                <strong className="text-neutral-100">1. 地図を移動します。</strong>
                表示範囲にあるポートが自動で読み込まれます。
              </li>
              <li>
                <strong className="text-neutral-100">2. サービスを絞り込みます。</strong>
                左上のフィルタで HELLO CYCLING とドコモ・バイクシェアを切り替えられます。
              </li>
              <li>
                <strong className="text-neutral-100">3. ポートを選びます。</strong>
                マーカーをクリックすると、台数、返却枠、最終更新時刻の目安を確認できます。
              </li>
            </ol>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">データと注意事項</h2>
            <p className="leading-8 text-neutral-300">
              本サイトのポート情報は、公共交通オープンデータセンターを通じて提供される
              GBFS データを利用しています。データは一定間隔で更新されますが、実際の
              貸出・返却可否は各サービスの公式アプリや現地の状況が優先されます。
              急ぎの移動や確実な返却が必要な場合は、利用前に各事業者の公式情報も
              あわせて確認してください。
            </p>
          </section>
        </div>

        <aside className="space-y-5 lg:pt-7">
          <div className="rounded-lg border border-neutral-800 bg-neutral-900/60 p-5">
            <h2 className="text-base font-semibold text-white">サイト情報</h2>
            <ul className="mt-4 space-y-3 text-sm text-neutral-300">
              <li>
                <Link className="underline decoration-neutral-600 hover:text-white" href="/about">
                  Portly について
                </Link>
              </li>
              <li>
                <Link className="underline decoration-neutral-600 hover:text-white" href="/privacy">
                  プライバシーポリシー
                </Link>
              </li>
              <li>
                <Link className="underline decoration-neutral-600 hover:text-white" href="/contact">
                  お問い合わせ
                </Link>
              </li>
            </ul>
          </div>
          <div className="rounded-lg border border-neutral-800 bg-neutral-900/60 p-5">
            <h2 className="text-base font-semibold text-white">ガイド</h2>
            <p className="mt-3 text-sm leading-7 text-neutral-300">
              初めて使う方向けに、東京周辺でシェアサイクルポートを探す時の見方をまとめています。
            </p>
            <Link
              className="mt-4 inline-block text-sm font-semibold text-sky-300 underline decoration-sky-500/50 hover:text-sky-200"
              href="/guides/tokyo-share-cycle"
            >
              東京でシェアサイクルポートを探す方法
            </Link>
          </div>
        </aside>
      </section>
    </main>
  );
}

function MapLoading() {
  return (
    <div className="absolute inset-0 grid place-items-center bg-neutral-950 text-neutral-400">
      地図を読み込み中...
    </div>
  );
}

function InfoCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900/60 p-4">
      <h2 className="text-sm font-semibold text-white">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-neutral-300">{body}</p>
    </div>
  );
}
