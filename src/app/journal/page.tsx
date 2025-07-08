import { Header } from "@/components/header";
import { UrgeJournal } from "@/components/journal/urge-journal";

export default function JournalPage() {
  return (
    <div className="flex h-full flex-col">
      <Header title="Urge Journal" />
      <main className="flex-1 overflow-y-auto">
        <UrgeJournal />
      </main>
    </div>
  );
}
