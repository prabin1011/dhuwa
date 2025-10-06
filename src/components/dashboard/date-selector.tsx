'use client';

import { useState } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Calendar } from "@/components/ui/calendar"
import { Card } from "@/components/ui/card"
import { format, isToday, isYesterday, subDays } from "date-fns"
import { CalendarDays } from "lucide-react"

interface DateSelectorProps {
    selected: Date | undefined;
    onSelect: (date: Date | undefined) => void;
}

export function DateSelector({ selected, onSelect }: DateSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);

    const handleDateSelect = (date: Date | undefined) => {
        onSelect(date);
        setIsOpen(false); // Close accordion on date selection
    }

    const getDisplayDate = () => {
        if (!selected) return "Select a date";
        if (isToday(selected)) return "Today";
        if (isYesterday(selected)) return "Yesterday";
        return format(selected, "MMMM d, yyyy");
    }
    
    return (
        <Accordion type="single" collapsible value={isOpen ? "item-1" : ""} onValueChange={(value) => setIsOpen(value === "item-1")}>
            <AccordionItem value="item-1" className="border-b-0">
                <Card>
                    <AccordionTrigger className="p-4 w-full">
                        <div className="flex items-center gap-2 text-sm font-medium">
                            <CalendarDays className="w-4 h-4 text-muted-foreground" />
                            <span>{getDisplayDate()}</span>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent>
                         <Calendar
                            mode="single"
                            selected={selected}
                            onSelect={handleDateSelect}
                            className="p-0 [&_td]:w-full"
                            disabled={(date) => date > new Date() || date < subDays(new Date(), 365)}
                        />
                    </AccordionContent>
                </Card>
            </AccordionItem>
        </Accordion>
    )
}
