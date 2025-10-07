'use client';

import type { MessagePayload } from "firebase/messaging";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Bell, X } from "lucide-react";
import { useState, useEffect } from "react";

interface NotificationCardProps {
    lastMessage: MessagePayload | null;
}

export function NotificationCard({ lastMessage }: NotificationCardProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [message, setMessage] = useState<MessagePayload | null>(null);

    useEffect(() => {
        if (lastMessage) {
            setMessage(lastMessage);
            setIsVisible(true);
        }
    }, [lastMessage]);

    if (!isVisible || !message) {
        return null;
    }

    const title = message.notification?.title;
    const body = message.notification?.body;

    return (
        <Card className="relative bg-secondary/30 border-secondary-foreground/20">
            <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-7 w-7 text-muted-foreground"
                onClick={() => setIsVisible(false)}
            >
                <X className="h-4 w-4" />
            </Button>
            <CardHeader>
                <div className="flex items-center gap-3">
                    <Bell className="w-5 h-5 text-secondary-foreground" />
                    <CardTitle>{title || "Notification"}</CardTitle>
                </div>
                {body && (
                    <CardDescription className="pt-2">
                        {body}
                    </CardDescription>
                )}
            </CardHeader>
        </Card>
    );
}
