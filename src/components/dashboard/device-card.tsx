
'use client';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Shield } from 'lucide-react';

export default function DeviceCard({
  userId,
  initial,
}: {
  userId: string;
  initial?: {
    healthkit?: boolean;
    healthconnect?: boolean;
    ble?: { connected: boolean; name?: string } | null;
    autoDetect?: boolean;
    autoLog?: boolean;
    lastSync?: string;
  };
}) {
  const [state, setState] = useState(initial ?? {});

  const connectHK = async () => {
    // open native bridge / prompt; on success:
    setState(s => ({ ...s, healthkit: true }));
    // write to Firestore: users/{userId}.devices
  };

  const connectHC = async () => {
    // request Health Connect perms, then:
    setState(s => ({ ...s, healthconnect: true }));
  };

  const scanBLE = async () => {
    // start BLE scan & connect to band; save token/deviceId
    setState(s => ({ ...s, ble: { connected: true, name: 'Dhuwa Band' }}));
  };

  const toggleAutoDetect = async (v: boolean) => {
    setState(s => ({ ...s, autoDetect: v }));
    // update users/{userId}.settings.autoDetect
  };

  const toggleAutoLog = async (v: boolean) => {
    setState(s => ({ ...s, autoLog: v }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Health Data Sync</CardTitle>
        <CardDescription>
          Connect your watch/band to enable smart smoke detection.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex gap-2 flex-wrap">
          <Button onClick={connectHK} disabled={!!state.healthkit}>Connect Apple Health</Button>
          <Button onClick={connectHC} disabled={!!state.healthconnect}>Connect Health Connect</Button>
          <Button variant="outline" onClick={scanBLE} disabled={!!state.ble?.connected}>
            {state.ble?.connected ? `Connected: ${state.ble?.name ?? 'Band'}` : 'Pair Dhuwa Band (BLE)'}
          </Button>
        </div>

        <div className="space-y-4 rounded-lg border p-4">
             <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Auto-detect smoking</div>
                <div className="text-sm text-muted-foreground">
                  Analyze heart rate & movement to ask for quick confirmation.
                </div>
              </div>
              <Switch checked={!!state.autoDetect} onCheckedChange={toggleAutoDetect} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Auto-log after confirmation</div>
                <div className="text-sm text-muted-foreground">
                  If you tap “Yes”, we’ll log the moment automatically.
                </div>
              </div>
              <Switch checked={!!state.autoLog} onCheckedChange={toggleAutoLog} />
            </div>
        </div>

        <Alert>
            <Shield className="h-4 w-4" />
            <AlertTitle>Your Privacy is Paramount</AlertTitle>
            <AlertDescription>
                We do not collect Wi-Fi information. Health permissions can be revoked at any time in your device settings.
            </AlertDescription>
        </Alert>

        <div className="text-xs text-muted-foreground text-center">
          {state.lastSync ? `Last sync: ${state.lastSync}` : 'Awaiting data from a connected source.'}
        </div>
      </CardContent>
    </Card>
  );
}

    