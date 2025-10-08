
'use client';

import { useState, useEffect } from 'react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import { Eye, Hand, Ear, Wind, Microwave } from 'lucide-react';
import { cn } from '@/lib/utils';

const steps = [
  {
    step: 5,
    title: "SEE",
    description: "Look around and name five things you can see. Notice colors, shapes, and details.",
    icon: Eye
  },
  {
    step: 4,
    title: "FEEL",
    description: "Pay attention to your body and name four things you can feel (e.g., your feet on the floor, the chair against your back).",
    icon: Hand
  },
  {
    step: 3,
    title: "HEAR",
    description: "Listen carefully and name three things you can hear, whether they are near or far.",
    icon: Ear
  },
  {
    step: 2,
    title: "SMELL",
    description: "Take a deep breath and name two things you can smell.",
    icon: Wind
  },
  {
    step: 1,
    title: "TASTE",
    description: "Name one thing you can taste, even if it's just the roof of your mouth.",
    icon: Microwave
  }
];

export function GroundingExercise() {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!api) return;
    setCurrent(api.selectedScrollSnap());
    const onSelect = () => setCurrent(api.selectedScrollSnap());
    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  return (
    <div className="w-full">
      <Carousel setApi={setApi} className="w-full">
        <CarouselContent>
          {steps.map((item, index) => (
            <CarouselItem key={index}>
              <Card className="bg-transparent border-0 shadow-none">
                <CardContent className="flex flex-col items-center justify-center p-6 text-center gap-4 min-h-[200px] animate-fade-in">
                  <item.icon className="w-10 h-10 text-primary mb-2" />
                  <h3 className="text-xl font-bold">{item.step}. {item.title}</h3>
                  <p className="text-muted-foreground">{item.description}</p>
                </CardContent>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="left-[-1rem]"/>
        <CarouselNext className="right-[-1rem]"/>
      </Carousel>
      <div className="py-2 flex justify-center gap-2">
        {steps.map((_, index) => (
          <button
            key={index}
            onClick={() => api?.scrollTo(index)}
            className={cn(
              "w-2.5 h-2.5 rounded-full transition-all duration-300",
              current === index ? "p-1.5 bg-primary" : "bg-primary/30"
            )}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
