import type { Metadata } from "next";
import { ContentPage, ContentSection } from "../components/ContentPage";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: `${SITE_NAME} について`,
  description:
    "Portly の目的、利用しているデータ、対応サービス、免責事項を説明します。",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <ContentPage
      title="Portly について"
      description="Portly は、シェアサイクルのポートを複数サービス横断で探しやすくするための無料 Web アプリです。"
    >
      <ContentSection title="提供している機能">
        <p>
          Portly では、HELLO CYCLING とドコモ・バイクシェアのポートを同じ地図上で確認できます。
          地図を移動すると表示範囲にあるポートを読み込み、ポートを選択すると貸出可能台数、
          返却可能台数、最終更新時刻の目安を表示します。
        </p>
        <p>
          都市部では複数のシェアサイクルサービスが近い場所に並んでいることがあります。
          Portly は、アプリを切り替えずに近くの候補を見比べるための補助ツールとして作っています。
        </p>
      </ContentSection>

      <ContentSection title="データの出典">
        <p>
          本サイトは、公共交通オープンデータセンターで提供されている GBFS データを利用しています。
          対象データには OpenStreet 株式会社の HELLO CYCLING バイクシェア関連情報と、
          株式会社ドコモ・バイクシェアのバイクシェア関連情報が含まれます。
        </p>
        <p>
          データの利用条件は、各データ提供元および公共交通オープンデータセンターの定める条件に従います。
          OpenStreetMap の地図データを表示する場合は OpenStreetMap contributors の著作権表示に従います。
        </p>
      </ContentSection>

      <ContentSection title="免責事項">
        <p>
          表示される台数や返却枠は、取得時点の公開データに基づく目安です。
          通信状況、データ更新のタイミング、現地での利用状況により、実際の貸出・返却可否と異なる場合があります。
          最終的な利用可否は各シェアサイクル事業者の公式アプリや現地表示を確認してください。
        </p>
      </ContentSection>
    </ContentPage>
  );
}
