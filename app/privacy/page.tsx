import type { Metadata } from "next";
import { ContentPage, ContentSection } from "../components/ContentPage";

export const metadata: Metadata = {
  title: "プライバシーポリシー",
  description:
    "Portly におけるアクセス解析、広告、アフィリエイト、外部サービス、個人情報の取り扱いについて説明します。",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <ContentPage
      title="プライバシーポリシー"
      description="Portly で扱う情報、外部サービス、広告配信に関する方針を説明します。"
    >
      <ContentSection title="取得する情報">
        <p>
          Portly は、シェアサイクルポートを地図上に表示するために、ブラウザ上で地図の中心座標、
          ズーム、サービスの絞り込み状態を扱います。これらの状態は URL に反映される場合があります。
        </p>
        <p>
          現在地ボタンを利用した場合、ブラウザの許可に基づいて現在地情報を取得します。
          現在地情報は地図表示のためにブラウザ上で利用し、Portly のサーバーに保存する目的では利用しません。
        </p>
      </ContentSection>

      <ContentSection title="アクセス解析とログ">
        <p>
          サイトの安定運用、障害調査、利用状況の把握のため、ホスティングサービスや周辺サービスが
          IP アドレス、ユーザーエージェント、アクセス時刻、リクエスト URL などの技術的なログを
          記録する場合があります。
        </p>
      </ContentSection>

      <ContentSection title="広告とアフィリエイト">
        <p>
          Portly は、今後 Google AdSense などの第三者配信広告サービスを利用する場合があります。
          第三者配信事業者は、ユーザーの興味に応じた広告を表示するため Cookie などを使用することがあります。
        </p>
        <p>
          また、商品やサービスへのリンクにアフィリエイトリンクを利用する場合があります。
          リンク先で購入や申し込みが発生した場合、運営者が報酬を受け取ることがあります。
        </p>
      </ContentSection>

      <ContentSection title="外部サービス">
        <p>
          本サイトは、地図表示、公開交通データの取得、ホスティング、データベース、キャッシュなどに
          外部サービスを利用します。リンク先や外部サービスで取得される情報については、
          各サービスのプライバシーポリシーをご確認ください。
        </p>
      </ContentSection>

      <ContentSection title="改定">
        <p>
          本ポリシーは、サービス内容、利用する外部サービス、法令や各種ガイドラインの変更に応じて
          更新することがあります。重要な変更がある場合は、本ページ上で分かりやすく告知します。
        </p>
      </ContentSection>
    </ContentPage>
  );
}
