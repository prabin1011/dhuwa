import { ChatInterface } from "@/components/chatbot/chat-interface";
import { SmokeLogger } from "@/components/dashboard/smoke-logger";
import { StatCard } from "@/components/dashboard/stat-card";
import { Cigarette, Timer, Wallet } from "lucide-react";

export function Dashboard() {
  // Mock data for now
  const cigarettesToday = 5;
  const timeSinceLast = "2h 15m";

  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:p-8 lg:p-12">
      <div className="w-full max-w-7xl">
        <header className="mb-8">
          <h1 className="text-4xl font-bold tracking-tighter font-heading">
            The Easy Way Out
          </h1>
          <p className="text-muted-foreground mt-2">
            Your journey to a smoke-free life starts now.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 flex flex-col gap-6">
            <SmokeLogger />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <StatCard 
                title="Cigarettes Today"
                value={cigarettesToday.toString()}
                icon={<Cigarette className="w-6 h-6 text-muted-foreground" />}
              />
              <StatCard 
                title="Time Since Last"
                value={timeSinceLast}
                icon={<Timer className="w-6 h-6 text-muted-foreground" />}
              />
            </div>
          </div>

          <div className="lg:col-span-1">
             <ChatInterface />
          </div>
        </div>
      </div>
    </main>
  );
}
