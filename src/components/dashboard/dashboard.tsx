'use client';

import { SmokeLogger } from "@/components/dashboard/smoke-logger";
import { useFirebase, useCollection, useMemoFirebase } from "@/firebase";
import { collection, doc, getDoc } from "firebase/firestore";
import { useUser } from "@/firebase/provider";
import { Button } from "../ui/button";
import { UrgeHistory } from "./urge-history";
import { useMemo } from "react";
import type { WithId } from "@/firebase";
import { RealTimeTimer } from "./real-time-timer";
import { SavingsStats } from "./savings-stats";
import { HourlyChart } from "./hourly-chart";
import { Skeleton } from "../ui/skeleton";
import { SmokingPlan } from "./smoking-plan";

interface UserProfile {
    habits?: string[];
    packCost?: number;
    itemsPerPack?: number;
    itemsPerDay?: string;
}

interface DashboardProps {
  userProfile: WithId<UserProfile>;
}


export function Dashboard({ userProfile }: DashboardProps) {
  const { firestore, auth } = useFirebase();
  const { user } = useUser();

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
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        if (!user || !firestore) return;
                        try {
                          const testSnap = await getDoc(doc(firestore, 'users', user.uid)); // same subtree
                          console.log('READ OK?', testSnap.exists());
                          alert('Read OK - rules & project align.');
                        } catch (e:any) {
                          alert('Read failed: ' + (e?.code ?? e?.message));
                        }
                      }}
                    >
                      Test Read
                    </Button>
                    <Button onClick={handleSignOut} variant="outline" size="sm">Sign Out</Button>
                </div>
                </header>

                <div className="space-y-6">
                    <RealTimeTimer lastUrgeTime={lastUrgeTime} />
                    <SavingsStats urges={sortedUrges} userProfile={userProfile} />
                    <SmokingPlan habits={userProfile.habits || ['Cigarette']} />
                    <HourlyChart urges={sortedUrges} />
                    <UrgeHistory urges={sortedUrges} isLoading={isLoading} />
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
