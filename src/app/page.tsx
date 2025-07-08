import { Header } from "@/components/header";
import { ProgressTracker } from "@/components/dashboard/progress-tracker";
import { DailyTasks } from "@/components/dashboard/daily-tasks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardPage() {
  return (
    <div className="flex h-full flex-col">
      <Header title="Dashboard" />
      <main className="flex-1 space-y-8 p-4 md:p-8">
        <div className="space-y-4">
          <h2 className="font-headline text-3xl">Welcome back, you're doing great!</h2>
          <p className="text-muted-foreground">
            Remember why you started. Every moment smoke-free is a victory.
          </p>
        </div>

        <ProgressTracker />

        <Card>
          <CardHeader>
            <CardTitle className="font-headline text-2xl">Your Daily Missions</CardTitle>
          </CardHeader>
          <CardContent>
            <DailyTasks />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
