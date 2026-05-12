import { Suspense } from "react";
import { MapView } from "./components/MapView";
import { Footer } from "./components/Footer";

export default function Page() {
  return (
    <main className="relative h-dvh w-dvw overflow-hidden">
      <Suspense fallback={<MapLoading />}>
        <MapView />
      </Suspense>
      <Footer />
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
