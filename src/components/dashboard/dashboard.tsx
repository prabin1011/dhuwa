'use client';

import { SmokeLogger } from "@/components/dashboard/smoke-logger";
import { StatCard } from "@/components/dashboard/stat-card";
import { useFirebase, useCollection, useMemoFirebase } from "@/firebase";
import { collection } from "firebase/firestore";
import { Cigarette, Timer } from "lucide-react";
import { differenceInHours, differenceInMinutes, formatDistanceToNow } from 'date-fns';
import { useUser } from "@/firebase/provider";
import { Button } from "../ui/button";
import { UrgeHistory } from "./urge-history";
import { useMemo } from "react";
import type { WithId } from "@/firebase";

interface UserProfile {
    habits?: string[];
    packCost?: number;
    itemsPerPack?: number;
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
    // Filter out urges without a timestamp before sorting
    return urges
      .filter(urge => urge.timestamp) 
      .sort((a, b) => b.timestamp.toDate().getTime() - a.timestamp.toDate().getTime());
  }, [urges]);


  const smokesToday = sortedUrges?.filter(urge => 
    urge.timestamp && differenceInHours(new Date(), urge.timestamp.toDate()) < 24
  ).length ?? 0;
  
  const lastUrgeTime = sortedUrges?.[0]?.timestamp?.toDate();
  
  let timeSinceLast = "N/A";
  if (lastUrgeTime) {
    const minutes = differenceInMinutes(new Date(), lastUrgeTime);
    if (minutes < 1) {
      timeSinceLast = "Just now";
    } else if (minutes < 60) {
      timeSinceLast = `${minutes}m ago`;
    } else {
      timeSinceLast = formatDistanceToNow(lastUrgeTime, { addSuffix: true });
    }
  }

  const handleSignOut = async () => {
    await auth.signOut();
  }
  
  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:p-8 lg:p-12 bg-background">
      <div className="w-full max-w-4xl">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold tracking-tighter font-heading">
              The Easy Way Out
            </h1>
            <p className="text-muted-foreground mt-2">
              Welcome, {user?.isAnonymous ? "Guest" : user?.email}. Your journey to a smoke-free life starts now.
            </p>
          </div>
          <Button onClick={handleSignOut} variant="outline">Sign Out</Button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="col-span-1 md:col-span-2">
             <SmokeLogger habits={userProfile.habits || ['Cigarette']}/>
          </div>
          <StatCard 
            title={`Smokes Today`}
            value={isLoading ? '...' : smokesToday.toString()}
            icon={<Cigarette className="w-6 h-6 text-muted-foreground" />}
          />
          <StatCard 
            title="Time Since Last"
            value={isLoading ? '...' : timeSinceLast}
            icon={<Timer className="w-6 h-6 text-muted-foreground" />}
          />
          <div className="col-span-1 md:col-span-2">
            <UrgeHistory urges={sortedUrges} isLoading={isLoading} />
          </div>
        </div>
      </div>
    </main>
  );
}
