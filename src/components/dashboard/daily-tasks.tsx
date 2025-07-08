'use client';

import { useState, useEffect } from 'react';
import { dailyTasks } from '@/lib/data';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';

export function DailyTasks() {
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());

  useEffect(() => {
    const today = new Date().toDateString();
    const stored = localStorage.getItem('dailyTasks');
    if (stored) {
      const { date, completed } = JSON.parse(stored);
      if (date === today) {
        setCompletedTasks(new Set(completed));
      } else {
        localStorage.removeItem('dailyTasks');
      }
    }
  }, []);

  const handleTaskToggle = (taskId: string, checked: boolean) => {
    const newCompletedTasks = new Set(completedTasks);
    if (checked) {
      newCompletedTasks.add(taskId);
    } else {
      newCompletedTasks.delete(taskId);
    }
    setCompletedTasks(newCompletedTasks);
    const today = new Date().toDateString();
    localStorage.setItem(
      'dailyTasks',
      JSON.stringify({ date: today, completed: Array.from(newCompletedTasks) })
    );
  };

  const completionPercentage = (completedTasks.size / dailyTasks.length) * 100;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Progress value={completionPercentage} className="h-2" />
        <p className="text-sm text-muted-foreground">{Math.round(completionPercentage)}% complete</p>
      </div>
      <ul className="space-y-4">
        {dailyTasks.map((task) => (
          <li key={task.id} className="flex items-center space-x-3 rounded-md border p-4 transition-colors hover:bg-secondary/50">
            <Checkbox
              id={task.id}
              checked={completedTasks.has(task.id)}
              onCheckedChange={(checked) => handleTaskToggle(task.id, !!checked)}
            />
            <Label
              htmlFor={task.id}
              className={`flex-1 text-sm ${
                completedTasks.has(task.id) ? 'text-muted-foreground line-through' : ''
              }`}
            >
              {task.text}
            </Label>
          </li>
        ))}
      </ul>
    </div>
  );
}
