'use client';
import { useState, useEffect } from 'react';
import { ProgressCard } from './progress-card';
import { CalendarDays, CigaretteOff, HeartPulse, Wallet } from 'lucide-react';

export function ProgressTracker() {
    const [stats, setStats] = useState({
    days: 0,
    cigarettes: 0,
    money: '0.00',
    life: '0h 0m',
  });

  useEffect(() => {
    // This effect runs only on the client-side
    // In a real app, you would fetch the quit date from user data.
    // For this example, we'll use a fixed date.
    const quitDate = new Date('2024-06-10T10:00:00');
    const cigarettesPerDay = 20;
    const pricePerPack = 8.50;
    const timePerCigaretteMinutes = 7;

    const updateStats = () => {
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - quitDate.getTime());
      
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      const cigarettesAvoided = Math.floor(diffDays * cigarettesPerDay);
      const moneySaved = (cigarettesAvoided / 20) * pricePerPack;
      
      const lifeRegainedMinutes = cigarettesAvoided * timePerCigaretteMinutes;
      const lifeRegainedHours = Math.floor(lifeRegainedMinutes / 60);
      const remainingMinutes = lifeRegainedMinutes % 60;

      setStats({
        days: diffDays,
        cigarettes: cigarettesAvoided,
        money: moneySaved.toFixed(2),
        life: `${lifeRegainedHours}h ${remainingMinutes}m`,
      });
    };

    updateStats();
    const interval = setInterval(updateStats, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <ProgressCard
        title="Smoke-Free"
        value={`${stats.days} days`}
        icon={CalendarDays}
        description="Every day is a win."
      />
      <ProgressCard
        title="Cigarettes Avoided"
        value={stats.cigarettes.toLocaleString()}
        icon={CigaretteOff}
        description="You've dodged these."
      />
      <ProgressCard
        title="Money Saved"
        value={`$${stats.money}`}
        icon={Wallet}
        description="Watch it grow."
      />
      <ProgressCard
        title="Health Gained"
        value={stats.life}
        icon={HeartPulse}
        description="Time you've reclaimed."
      />
    </div>
  );
}
