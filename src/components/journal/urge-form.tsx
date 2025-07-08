'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

const formSchema = z.object({
  location: z.string().min(2, { message: 'Location must be at least 2 characters.' }),
  trigger: z.string().min(2, { message: 'Trigger must be at least 2 characters.' }),
  intensity: z.number().min(1).max(10),
});

export type UrgeFormData = z.infer<typeof formSchema>;
export type UrgeEntry = UrgeFormData & {
  id: string;
  timestamp: Date;
};

interface UrgeFormProps {
  onSubmit: (data: UrgeFormData) => void;
}

export function UrgeForm({ onSubmit }: UrgeFormProps) {
  const form = useForm<UrgeFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      location: '',
      trigger: '',
      intensity: 5,
    },
  });

  const handleFormSubmit = (data: UrgeFormData) => {
    onSubmit(data);
    form.reset();
  };

  return (
    <Card>
        <CardHeader>
            <CardTitle className="font-headline text-2xl">Log an Urge</CardTitle>
            <CardDescription>Track your cravings to understand them better. You are not the urge. You are the observer.</CardDescription>
        </CardHeader>
        <CardContent>
            <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
                <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Where are you?</FormLabel>
                    <FormControl>
                        <Input placeholder="e.g., At my desk, in the car" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="trigger"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>What's the trigger?</FormLabel>
                    <FormControl>
                        <Textarea placeholder="e.g., Finished a meal, feeling stressed" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="intensity"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Urge Intensity: {field.value}</FormLabel>
                    <FormControl>
                        <Slider
                        min={1}
                        max={10}
                        step={1}
                        defaultValue={[field.value]}
                        onValueChange={(value) => field.onChange(value[0])}
                        />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <Button type="submit" className="w-full">Log Urge</Button>
            </form>
            </Form>
        </CardContent>
    </Card>
  );
}
