import { Suspense } from "react";
import { MapView } from "./components/MapView";
import { Footer } from "./components/Footer";
import { AdSidebar } from "./components/AdSidebar";

export default function Page() {
  return (
    <main className="flex h-dvh w-dvw overflow-hidden">
      <div className="relative flex-1">
        <Suspense fallback={<MapLoading />}>
          <MapView />
        </Suspense>
        <Footer />
      </div>
      <aside className="hidden w-80 shrink-0 flex-col border-l border-neutral-800 bg-neutral-950 lg:flex">
        <AdSidebar />
      </aside>
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
