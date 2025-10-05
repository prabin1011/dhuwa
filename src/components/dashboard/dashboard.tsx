'use client';

import { SmokeLogger } from "@/components/dashboard/smoke-logger";
import { useFirebase, useCollection, useMemoFirebase } from "@/firebase";
import { collection, doc, getDoc } from "firebase/firestore";
import { useUser } from "@/firebase/provider";
import { Button } from "../ui/button";
import { UrgeHistory } from "./urge-history";
import { useMemo, useState, useEffect } from "react";
import type { WithId } from "@/firebase";
import { RealTimeTimer } from "./real-time-timer";
import { SavingsStats } from "./savings-stats";
import { HourlyChart } from "./hourly-chart";
import { Skeleton } from "../ui/skeleton";
import { SmokingPlan } from "./smoking-plan";
import { ProgressTracker } from "./progress-tracker";
import { ReplacementReport } from "./replacement-report";
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent } from "../ui/card";
import { subDays } from "date-fns";
import { MoodReport } from "./mood-report";
import { DailyHabitChart } from "./daily-habit-chart";
import { DailyInsight } from "./daily-insight";
import { useNotifications } from "@/hooks/use-notifications";

interface UserProfile {
    habits?: string[];
    packCost?: number;
    itemsPerPack?: number;
    itemsPerDay?: string;
    moments?: any[];
    goal?: string;
    motivation?: string;
    preferredTone?: string;
}

interface DashboardProps {
  userProfile: WithId<UserProfile>;
}


export function Dashboard({ userProfile }: DashboardProps) {
  const { firestore, auth } = useFirebase();
  const { user } = useUser();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  
  // Initialize notifications
  useNotifications();


  const urgesQuery = useMemoFirebase(() => {
    if (!user) return null;
    return collection(firestore, 'users', user.uid, 'urges');
  }, [firestore, user]);

  const { data: urges, isLoading } = useCollection(urgesQuery);

  const sortedUrges = useMemo(() => {
    if (!urges) return [];
    return urges
      .filter(urge => urge.timestamp) 
      .sort((a, b) => b.timestamp.toDate().getTime() - a.timestamp.toDate().getTime());
  }, [urges]);
  
  const lastUrgeTime = sortedUrges?.[0]?.timestamp?.toDate();
  
  const handleSignOut = async () => {
    if (auth) {
      await auth.signOut();
    }
  }
  
  if (isLoading) {
    return (
        <div className="flex flex-col h-screen w-screen bg-background p-4 md:p-8 lg:p-12 gap-6">
            <div className="w-full max-w-md mx-auto">
                <header className="mb-6 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tighter font-heading">
                            The Easy Way Out
                        </h1>
                        <Skeleton className="h-5 w-48 mt-2" />
                    </div>
                    <Button variant="outline" size="sm">Sign Out</Button>
                </header>
                <div className="space-y-6">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-48 w-full" />
                    <Skeleton className="h-72 w-full" />
                </div>
            </div>
        </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
        <main className="flex-1 flex flex-col items-center p-4 md:p-6">
            <div className="w-full max-w-md">
                <header className="mb-6 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tighter font-heading">
                    The Easy Way Out
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                    Welcome, {user?.isAnonymous ? "Guest" : user?.email}.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={handleSignOut} variant="outline" size="sm">Sign Out</Button>
                </div>
                </header>

                <div className="space-y-6">
                    <DailyInsight userProfile={userProfile} urges={sortedUrges} lastUrgeTime={lastUrgeTime}/>
                    <RealTimeTimer lastUrgeTime={lastUrgeTime} />
                    
                    <Card>
                        <CardContent className="p-0">
                            <Calendar
                                mode="single"
                                selected={selectedDate}
                                onSelect={setSelectedDate}
                                className="p-0"
                                disabled={(date) => date > new Date() || date < subDays(new Date(), 365)}
                            />
                        </CardContent>
                    </Card>

                    <SavingsStats urges={sortedUrges} userProfile={userProfile} selectedDate={selectedDate} />
                    <SmokingPlan userProfile={userProfile} selectedDate={selectedDate || new Date()} />
                    <ProgressTracker userProfile={userProfile} selectedDate={selectedDate || new Date()} />
                    <ReplacementReport userProfile={userProfile} selectedDate={selectedDate || new Date()} />
                    <MoodReport urges={sortedUrges} selectedDate={selectedDate || new Date()} />
                    <DailyHabitChart urges={sortedUrges} />
                    <HourlyChart urges={sortedUrges} />
                    <UrgeHistory urges={sortedUrges} isLoading={isLoading} userProfile={userProfile} />
                </div>
            </div>
        </main>
        <footer className="sticky bottom-0 p-4 bg-background/80 backdrop-blur-sm border-t border-border">
            <div className="w-full max-w-md mx-auto">
                <SmokeLogger habits={userProfile.habits || ['Cigarette']}/>
            </div>
        </footer>
    </div>
  );
}
