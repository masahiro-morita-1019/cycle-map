import { AboutModal } from "./About";

export function Footer() {
  return (
    <footer className="pointer-events-none absolute bottom-0 left-0 right-0 z-10 flex flex-wrap justify-center gap-2 p-2 text-[10px] text-neutral-300">
      <span className="pointer-events-auto rounded bg-neutral-900/70 px-2 py-1 font-semibold text-white backdrop-blur">
        Portly
      </span>
      <AboutModal />
      <span className="pointer-events-auto rounded bg-neutral-900/70 px-2 py-1 backdrop-blur">
        出典: 公共交通オープンデータセンター ／ CC BY 4.0 ／
        © OpenStreet, ドコモ・バイクシェア
      </span>
    </footer>
  );
}
