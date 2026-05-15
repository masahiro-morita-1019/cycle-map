import type { Metadata } from "next";
import { ContentPage, ContentSection } from "../components/ContentPage";

const CONTACT_EMAIL = "contact@portly.jp";

export const metadata: Metadata = {
  title: "お問い合わせ",
  description:
    "Portly へのお問い合わせ先と、データ提供元・シェアサイクル事業者への問い合わせではないことを説明します。",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <ContentPage
      title="お問い合わせ"
      description="Portly の内容、表示、運営に関するお問い合わせ先を案内します。"
    >
      <ContentSection title="お問い合わせ先">
        <p>
          Portly に関するお問い合わせは、以下のメールアドレスまでご連絡ください。
        </p>
        <p>
          <a
            className="font-semibold text-sky-300 underline decoration-sky-500/50 hover:text-sky-200"
            href={`mailto:${CONTACT_EMAIL}`}
          >
            {CONTACT_EMAIL}
          </a>
        </p>
      </ContentSection>

      <ContentSection title="問い合わせ前の確認">
        <p>
          Portly はシェアサイクル各社の公式サービスではありません。料金、会員登録、
          予約、支払い、事故、車両トラブル、アカウントに関する問い合わせは、
          利用している各シェアサイクル事業者の公式窓口へご連絡ください。
        </p>
        <p>
          Portly への問い合わせでは、表示されているポート名、発生日時、利用端末、
          ブラウザ、問題が分かるスクリーンショットや URL を添えていただくと確認しやすくなります。
        </p>
      </ContentSection>
    </ContentPage>
  );
}
