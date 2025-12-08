
'use client';

import { SmokeLogger } from "@/components/dashboard/smoke-logger";
import { useFirebase, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import { useUser } from "@/firebase/provider";
import { UrgeHistory } from "./urge-history";
import { useEffect, useMemo, useState } from "react";
import type { WithId } from "@/firebase";
import { RealTimeTimer } from "./real-time-timer";
import { SavingsStats } from "./savings-stats";
import { HourlyChart } from "./hourly-chart";
import { Skeleton } from "../ui/skeleton";
import { SmokingPlan } from "./smoking-plan";
import { ProgressTracker } from "./progress-tracker";
import { ReplacementReport } from "./replacement-report";
import { MoodReport } from "./mood-report";
import { DailyInsight } from "./daily-insight";
import { useNotifications } from "@/hooks/use-notifications";
import { UserProfileDropdown } from "./user-profile-dropdown";
import { DailyHabitChart } from "./daily-habit-chart";
import { SosActionBar } from "./sos-action-bar";
import { NextRiskWindow } from "./next-risk-window";
import { NotificationBell } from "./notification-bell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import Link from 'next/link';
import { User } from "firebase/auth";
import { ReplacementMoodReport } from "./replacement-mood-report";
import { useParams } from "next/navigation";
import type { Locale } from "@/i18n";
import { Cigarette, Leaf, MinusCircle, Wind } from "lucide-react";
import { Logo } from "../logo";
import { CommunityTeaser } from "../community/community-teaser";
import DeviceCard from "./device-card";


interface SmokingMoment {
    id: string;
    time: string;
    label: string;
    completed: Record<string, boolean>;
    replacementActivity?: Record<string, { activity: string; mood?: string; }>;
    habit?: string;
}
interface UserProfile {
    habits?: string[];
    packCost?: number; // Kept for backward compatibility
    itemsPerPack?: number; // Kept for backward compatibility
    habitDetails?: Record<string, { packCost?: number; itemsPerPack?: number; itemsPerDay?: string | number }>;
    itemsPerDay?: string;
    moments?: SmokingMoment[];
    goal?: string;
    motivation?: string;
    preferredTone?: string;
    username?: string;
    breakDuration?: string;
    reminders?: string;
    shareToCommunity?: 'yes' | 'no';
}

interface DashboardProps {
  user: User;
  userProfile: WithId<UserProfile>;
}

const HabitIcon = ({ habit, className }: { habit: string, className?: string }) => {
    switch (habit) {
        case 'Cigarettes': return <Cigarette className={className} />;
        case 'Vape': return <Wind className={className} />;
        case 'Weed': return <Leaf className={className} />;
        case 'Snus': return <MinusCircle className={className} />;
        default: return null;
    }
};


export function Dashboard({ user, userProfile }: DashboardProps) {
  const { firestore } = useFirebase();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const {locale} = useParams() as {locale: Locale};
  
  const availableHabits = userProfile.habits || ['Cigarettes'];
  const [activeHabit, setActiveHabit] = useState<string>('All');
  
  const { requestPermissionAndToken } = useNotifications();

  // State for replacement flow, lifted from SmokingPlan
  const [replacementMoment, setReplacementMoment] = useState<SmokingMoment | null>(null);

  useEffect(() => {
    const shouldRequest = userProfile.reminders === 'yes' && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default';
    if (shouldRequest) {
        requestPermissionAndToken();
    }
  }, [userProfile.reminders, requestPermissionAndToken]);


  const urgesQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, 'users', user.uid, 'urges'), orderBy('timestamp', 'desc'));
  }, [firestore, user]);

  const { data: urges, isLoading } = useCollection(urgesQuery);

  const sortedUrges = useMemo(() => {
    if (!urges) return [];
    return urges; // Already sorted by query
  }, [urges]);

  const filteredUrges = useMemo(() => {
    if (activeHabit === 'All') return sortedUrges;
    return sortedUrges.filter(urge => urge.type === activeHabit);
  }, [sortedUrges, activeHabit]);
  
  const lastUrgeTime = sortedUrges?.[0]?.timestamp?.toDate();
  
  if (isLoading || !user) {
    return (
        <div className="flex flex-col h-screen w-screen bg-background p-4 md:p-6 gap-6">
            <div className="w-full max-w-md mx-auto">
                <header className="mb-6 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tighter font-heading">
                            Dhuwa
                        </h1>
                        <Skeleton className="h-5 w-48 mt-2" />
                    </div>
                     <Skeleton className="h-10 w-10 rounded-full" />
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

  const habitTabs = ['All', ...availableHabits];
  const habitsForCharts = activeHabit === 'All' ? availableHabits : [activeHabit];


  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
        <main className="flex-1 flex flex-col items-center p-4 md:p-6 pb-28">
            <div className="w-full max-w-md mx-auto">
                <header className="mb-6 flex justify-between items-start">
                    <div>
                        <div className="flex items-baseline gap-2">
                            <Link href={`/${locale}/dashboard`} className="flex items-center gap-2">
                                <Logo className="w-7 h-7" />
                                <h1 className="text-3xl font-bold tracking-tighter font-heading lowercase cursor-pointer">
                                    dhuwa
                                </h1>
                             </Link>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Welcome, {userProfile.username || user?.email || "Guest"}. Your freedom starts with awareness.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <NotificationBell />
                        <UserProfileDropdown user={user} userProfile={userProfile} />
                    </div>
                </header>

                {habitTabs.length > 2 && (
                    <Tabs value={activeHabit} onValueChange={setActiveHabit} className="w-full mb-6">
                        <TabsList className="grid w-full h-12" style={{ gridTemplateColumns: `repeat(${habitTabs.length}, 1fr)` }}>
                            {habitTabs.map(habit => (
                                <TabsTrigger key={habit} value={habit} className="flex-grow text-xs h-full">
                                     {habit === 'All' ? 'All' : <HabitIcon habit={habit} className="w-5 h-5" />}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </Tabs>
                )}

                <div className="space-y-6">
                    <DailyInsight userProfile={userProfile} urges={filteredUrges} lastUrgeTime={lastUrgeTime}/>
                    <RealTimeTimer 
                      sortedUrges={filteredUrges} 
                      selectedDate={selectedDate}
                      onSelectDate={setSelectedDate}
                    />
                    <CommunityTeaser />
                    <NextRiskWindow 
                        user={user} 
                        userProfile={userProfile} 
                        urges={filteredUrges} 
                        onReplace={setReplacementMoment}
                    />
                    <SmokingPlan 
                        user={user} 
                        userProfile={userProfile} 
                        selectedDate={selectedDate || new Date()} 
                        replacementMoment={replacementMoment}
                        setReplacementMoment={setReplacementMoment}
                        activeHabit={activeHabit}
                    />
                    <SavingsStats urges={filteredUrges} userProfile={userProfile} selectedDate={selectedDate} activeHabit={activeHabit} />
                    <ProgressTracker userProfile={userProfile} selectedDate={selectedDate || new Date()} />
                    <ReplacementReport userProfile={userProfile} selectedDate={selectedDate || new Date()} />
                    <ReplacementMoodReport userProfile={userProfile} selectedDate={selectedDate || new Date()} />
                    <MoodReport urges={filteredUrges} selectedDate={selectedDate || new Date()} />
                    <DailyHabitChart urges={urges || []} selectedDate={selectedDate} habits={habitsForCharts} />
                    <HourlyChart urges={urges || []} habits={habitsForCharts} />
                    <UrgeHistory urges={filteredUrges} isLoading={isLoading} userProfile={userProfile} />
                </div>
            </div>
        </main>
        <footer className="sticky bottom-0 bg-background/80 backdrop-blur-sm border-t border-border">
            <div className="w-full max-w-md mx-auto p-4 space-y-3">
                 <SmokeLogger habits={availableHabits}/>
                 <SosActionBar />
            </div>
        </footer>
    </div>
  );
}
