import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage, ContentSection } from "../../components/ContentPage";

export const metadata: Metadata = {
  title: "東京でシェアサイクルポートを探す方法",
  description:
    "東京周辺で HELLO CYCLING とドコモ・バイクシェアのポートを探す時の見方、返却枠の確認、注意点をまとめます。",
  alternates: { canonical: "/guides/tokyo-share-cycle" },
};

export default function TokyoShareCycleGuidePage() {
  return (
    <ContentPage
      title="東京でシェアサイクルポートを探す方法"
      description="短距離移動でシェアサイクルを使う時に、貸出ポートと返却ポートを効率よく確認するための基本的な見方をまとめます。"
    >
      <ContentSection title="最初に確認すること">
        <p>
          東京周辺では、駅前、オフィス街、商業施設、公園周辺などにシェアサイクルポートが点在しています。
          近くにポートがあっても、貸出可能な自転車がない場合や、目的地側に返却できる空きラックがない場合があります。
          出発前には、出発地と目的地の両方でポート状況を確認しておくと安心です。
        </p>
      </ContentSection>

      <ContentSection title="Portly での探し方">
        <p>
          <Link className="text-sky-300 underline decoration-sky-500/50 hover:text-sky-200" href="/">
            Portly の地図
          </Link>
          を開き、出発地付近へ移動します。マーカーが密集している場所では、数字付きのクラスタをクリックすると
          周辺のポートが展開されます。個別のポートをクリックすると、貸出可能台数と返却可能台数の目安を確認できます。
        </p>
        <p>
          左上のサービスフィルタでは、HELLO CYCLING とドコモ・バイクシェアを切り替えられます。
          すでに利用するサービスが決まっている場合は、対象サービスだけを表示すると候補を絞り込みやすくなります。
        </p>
      </ContentSection>

      <ContentSection title="返却先も先に見る">
        <p>
          シェアサイクルでは、借りる場所だけでなく返す場所の空き状況が重要です。
          特に朝夕の通勤時間帯やイベント開催時は、目的地周辺のポートが満車になることがあります。
          目的地の近くに複数の候補を見つけておくと、返却できない場合の移動ロスを減らせます。
        </p>
      </ContentSection>

      <ContentSection title="利用前の注意点">
        <p>
          Portly の表示は公開データをもとにした目安です。実際の利用可否、料金、車両状態、予約可否、
          利用規約は各シェアサイクル事業者の公式アプリや公式サイトが優先されます。
          予定時刻に余裕がない移動では、公式アプリで最終確認してから利用してください。
        </p>
      </ContentSection>
    </ContentPage>
  );
}
