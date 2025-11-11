
'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import type { Locale } from '@/i18n';
import DeviceCard from '@/components/dashboard/device-card';
import { useUser } from '@/firebase';


export default function WearablePage() {
    const { locale } = useParams() as { locale: Locale };
    const { user } = useUser();

    return (
        <div className="min-h-screen bg-background text-foreground">
            <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
                <div className="mx-auto max-w-md px-4 sm:px-6 md:px-8 h-16 flex items-center gap-4">
                    <Link href={`/${locale}/dashboard`} className="p-2 rounded-full hover:bg-secondary">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div className="flex flex-col">
                        <h1 className="text-xl font-bold">Devices & Health Sync</h1>
                        <p className="text-sm text-muted-foreground">Connect your health data sources.</p>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-md p-4 space-y-6">
                {user && <DeviceCard userId={user.uid} />}
            </main>
        </div>
    );
}


    