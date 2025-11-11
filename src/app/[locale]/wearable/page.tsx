
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Wifi, Watch, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import type { Locale } from '@/i18n';

export default function WearablePage() {
    const { locale } = useParams() as { locale: Locale };
    const [isScanning, setIsScanning] = useState(false);
    const [devices, setDevices] = useState<{ id: string, name: string }[]>([]);
    const [connectedDevice, setConnectedDevice] = useState<string | null>(null);
    const [progress, setProgress] = useState(0);

    const handleScan = () => {
        setIsScanning(true);
        setConnectedDevice(null);
        setDevices([]);
        setProgress(0);

        const interval = setInterval(() => {
            setProgress(p => {
                if (p >= 100) {
                    clearInterval(interval);
                    setIsScanning(false);
                    setDevices([
                        { id: 'dhuwa-band-x1', name: 'Dhuwa Band X1' },
                        { id: 'smartwatch-A2', name: 'HealthWatch A2' },
                    ]);
                    return 100;
                }
                return p + 10;
            });
        }, 300);
    };
    
    const handleConnect = (deviceId: string) => {
        setConnectedDevice(deviceId);
    };

    const handleDisconnect = () => {
        setConnectedDevice(null);
        setDevices([]);
    }

    return (
        <div className="min-h-screen bg-background text-foreground">
            <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
                <div className="mx-auto max-w-md px-4 sm:px-6 md:px-8 h-16 flex items-center gap-4">
                    <Link href={`/${locale}/dashboard`} className="p-2 rounded-full hover:bg-secondary">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div className="flex flex-col">
                        <h1 className="text-xl font-bold">Connect Wearable</h1>
                        <p className="text-sm text-muted-foreground">Sync your health data automatically.</p>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-md p-4 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                           <Watch /> Wearable Sync
                        </CardTitle>
                        <CardDescription>
                            Connect a compatible device to automatically detect potential smoking events based on heart rate spikes.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {!connectedDevice ? (
                             <>
                                <Button onClick={handleScan} disabled={isScanning} className="w-full">
                                    <Wifi className="mr-2 h-4 w-4" />
                                    {isScanning ? 'Scanning for Devices...' : 'Scan for Devices'}
                                </Button>
                                {isScanning && <Progress value={progress} className="w-full" />}
                                
                                {devices.length > 0 && !isScanning && (
                                    <div className="space-y-2">
                                        <h3 className="text-sm font-medium">Devices Found:</h3>
                                        {devices.map(device => (
                                            <div key={device.id} className="flex items-center justify-between p-3 rounded-md border">
                                                <p className="font-semibold">{device.name}</p>
                                                <Button size="sm" onClick={() => handleConnect(device.id)}>Connect</Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                             </>
                        ) : (
                             <Alert variant="default" className="bg-primary/10 border-primary/30">
                                <CheckCircle className="h-4 w-4 text-primary" />
                                <AlertTitle>Connected!</AlertTitle>
                                <AlertDescription className="flex justify-between items-center">
                                   <span>
                                     Your {devices.find(d => d.id === connectedDevice)?.name} is now synced.
                                   </span>
                                   <Button variant="link" className="p-0 h-auto text-primary" onClick={handleDisconnect}>Disconnect</Button>
                                </AlertDescription>
                            </Alert>
                        )}
                    </CardContent>
                </Card>
                 <Alert>
                    <AlertTitle>How it Works</AlertTitle>
                    <AlertDescription>
                        When your device detects a sudden, sustained heart rate spike, the app will send you a notification to confirm if you smoked. If you say yes, the moment will be logged automatically.
                    </AlertDescription>
                </Alert>
                 <Alert variant="destructive">
                    <AlertTitle>Privacy and Disclaimer</AlertTitle>
                    <AlertDescription>
                        Heart rate data is processed on-device and is not stored long-term. This feature is for pattern recognition only and is not a medical diagnostic tool.
                    </AlertDescription>
                </Alert>
            </main>
        </div>
    );
}
