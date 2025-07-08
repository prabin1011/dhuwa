import { Header } from "@/components/header";
import { InspirationFeed } from "@/components/inspiration/inspiration-feed";

export default function InspirationPage() {
  return (
    <div className="flex h-full flex-col">
      <Header title="Inspiration" />
      <main className="flex-1 overflow-y-auto">
        <InspirationFeed />
      </main>
    </div>
  );
}
