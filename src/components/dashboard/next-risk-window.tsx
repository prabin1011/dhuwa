'use client';

import { useMemo, useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { AlertTriangle, Clock, ShieldCheck, Waves } from "lucide-react";
import { differenceInMinutes, parse, format, isAfter } from "date-fns";

interface Urge {
    timestamp: { toDate: () => Date };
}

interface SmokingMoment {
    id: string;
    time: string; // "HH:mm"
    label: string;
}

interface UserProfile {
    moments?: SmokingMoment[];
}

interface NextRiskWindowProps {
    userProfile: UserProfile;
    urges: Urge[];
}

const getUrgeSpikeHour = (urges: Urge[]): number | null => {
    if (urges.length < 5) return null;
    const now = new Date();
    const recentUrges = urges.filter(u => differenceInMinutes(now, u.timestamp.toDate()) < 60 * 24 * 7); // Last 7 days

    const hourCounts: Record<number, number> = {};
    recentUrges.forEach(u => {
        const hour = u.timestamp.toDate().getHours();
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    const nowHour = now.getHours();
    let nextSpikeHour: number | null = null;
    let maxUrges = 0;

    // Find the next upcoming hour with the most urges
    for (let i = 1; i <= 24; i++) {
        const checkHour = (nowHour + i) % 24;
        if ((hourCounts[checkHour] || 0) > maxUrges) {
            maxUrges = hourCounts[checkHour];
            nextSpikeHour = checkHour;
        }
    }
    return nextSpikeHour;
}

export function NextRiskWindow({ userProfile, urges }: NextRiskWindowProps) {
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000 * 60); // Update every minute
        return () => clearInterval(timer);
    }, []);

    const nextMoment = useMemo(() => {
        const now = currentTime;
        const sortedMoments = (userProfile.moments || [])
            .map(m => ({ ...m, date: parse(m.time, 'HH:mm', now) }))
            .sort((a, b) => a.date.getTime() - b.date.getTime());
            
        return sortedMoments.find(m => isAfter(m.date, now));
    }, [userProfile.moments, currentTime]);

    const spikeHour = useMemo(() => getUrgeSpikeHour(urges), [urges]);

    let title = "All Clear";
    let description = "No immediate risks detected. Stay vigilant.";
    let icon = <ShieldCheck className="w-5 h-5 text-green-500" />;
    let cta = null;

    if (nextMoment) {
        const minutesUntil = differenceInMinutes(nextMoment.date, currentTime);
        title = `Next Plan: ${nextMoment.label}`;
        description = `Your next planned smoke is in about ${minutesUntil} minute(s).`;
        icon = <Clock className="w-5 h-5 text-yellow-500" />;
        cta = (
            <div className="flex gap-2 mt-4">
                <Button variant="outline" size="sm"><Waves className="w-4 h-4 mr-2"/>Breathe</Button>
                <Button variant="outline" size="sm">Pick Replacement</Button>
            </div>
        );
    } else if (spikeHour !== null) {
        const nowHour = currentTime.getHours();
        const hoursUntil = (spikeHour - nowHour + 24) % 24;
        title = "Pattern Alert";
        description = `You often smoke around ${format(parse(String(spikeHour), 'H', new Date()), 'h a')}. That's in ~${hoursUntil}h.`;
        icon = <AlertTriangle className="w-5 h-5 text-orange-500" />;
         cta = (
            <div className="flex gap-2 mt-4">
                <Button variant="outline" size="sm"><Waves className="w-4 h-4 mr-2"/>Breathe</Button>
                <Button variant="outline" size="sm">Plan Ahead</Button>
            </div>
        );
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-start justify-between">
                <div>
                    <CardTitle>{title}</CardTitle>
                    <CardDescription>{description}</CardDescription>
                </div>
                {icon}
            </CardHeader>
            {cta && <CardContent>{cta}</CardContent>}
        </Card>
    );
}
