import { AdSense } from "./AdSense";

type AffiliateItem = {
  title: string;
  price: string;
  url: string;
  image: string;
  vendor: string;
};

const AFFILIATE_ITEMS: AffiliateItem[] = [
  {
    title: "自転車用ヘルメット (軽量・JCF公認)",
    price: "¥4,980〜",
    url: "https://www.amazon.co.jp/s?k=%E8%87%AA%E8%BB%A2%E8%BB%8A+%E3%83%98%E3%83%AB%E3%83%A1%E3%83%83%E3%83%88",
    image: "https://placehold.co/280x160/0b0d10/4ade80?text=Helmet",
    vendor: "Amazon",
  },
  {
    title: "USB充電式 自転車LEDライト 前後セット",
    price: "¥2,480〜",
    url: "https://www.amazon.co.jp/s?k=%E8%87%AA%E8%BB%A2%E8%BB%8A+LED%E3%83%A9%E3%82%A4%E3%83%88",
    image: "https://placehold.co/280x160/0b0d10/60a5fa?text=Light",
    vendor: "Amazon",
  },
  {
    title: "サイクルウェア レインジャケット (撥水)",
    price: "¥3,580〜",
    url: "https://www.amazon.co.jp/s?k=%E3%82%B5%E3%82%A4%E3%82%AF%E3%83%AB+%E3%83%AC%E3%82%A4%E3%83%B3%E3%82%B8%E3%83%A3%E3%82%B1%E3%83%83%E3%83%88",
    image: "https://placehold.co/280x160/0b0d10/f59e0b?text=Rain",
    vendor: "Amazon",
  },
];

const ADSENSE_SLOT = process.env.NEXT_PUBLIC_ADSENSE_SLOT_SIDEBAR ?? "";

export function AdSidebar() {
  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-4 text-neutral-200">
      <section>
        <h2 className="mb-2 text-[10px] uppercase tracking-wider text-neutral-500">
          スポンサー
        </h2>
        <div className="min-h-[280px] rounded-lg bg-neutral-900 ring-1 ring-white/5">
          <AdSense
            slot={ADSENSE_SLOT}
            format="auto"
            responsive
            style={{ minHeight: 280 }}
            className="h-full w-full"
          />
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-[10px] uppercase tracking-wider text-neutral-500">
          自転車用品ピックアップ
          <span className="ml-2 rounded bg-neutral-800 px-1.5 py-0.5 text-[9px] text-neutral-400">
            広告
          </span>
        </h2>
        <ul className="flex flex-col gap-3">
          {AFFILIATE_ITEMS.map((item) => (
            <li key={item.url}>
              <a
                href={item.url}
                target="_blank"
                rel="sponsored noopener noreferrer"
                className="block overflow-hidden rounded-lg bg-neutral-900 ring-1 ring-white/5 transition hover:ring-white/20"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.image}
                  alt=""
                  loading="lazy"
                  className="h-32 w-full object-cover"
                />
                <div className="p-3">
                  <p className="line-clamp-2 text-xs font-medium text-neutral-100">
                    {item.title}
                  </p>
                  <p className="mt-1 text-[11px] text-neutral-400">
                    {item.price} ／ {item.vendor}
                  </p>
                </div>
              </a>
            </li>
          ))}
        </ul>
      </section>

      <p className="mt-auto pt-2 text-[10px] leading-relaxed text-neutral-500">
        本サイトはアフィリエイト広告を掲載しています。掲載商品の購入により運営者が
        報酬を得る場合があります。
      </p>
    </div>
  );
}
