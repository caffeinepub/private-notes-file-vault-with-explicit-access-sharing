import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Lock, AlertCircle } from 'lucide-react';
import type { PaywallStatus } from '../../backend';
import { formatExpirationDate } from '../../utils/paywall';

interface PaywallPanelProps {
  status: PaywallStatus | null | undefined;
}

export default function PaywallPanel({ status }: PaywallPanelProps) {
  const expirationDate = status?.paidUntil ? formatExpirationDate(status.paidUntil) : null;
  const planLabel = status?.planLabel || null;

  return (
    <div className="h-full flex items-center justify-center p-8">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <Lock className="w-8 h-8 text-destructive" />
          </div>
          <CardTitle className="text-2xl">Storage Access Required</CardTitle>
          <CardDescription>
            Payment is required to enable storage and upload features
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Access Restricted</AlertTitle>
            <AlertDescription>
              You currently do not have access to create notes or upload files. 
              Please contact the administrator to enable storage access for your account.
            </AlertDescription>
          </Alert>

          {planLabel && (
            <div className="text-sm text-muted-foreground">
              <span className="font-medium">Plan:</span> {planLabel}
            </div>
          )}

          {expirationDate && (
            <div className="text-sm text-muted-foreground">
              <span className="font-medium">Expires:</span> {expirationDate}
            </div>
          )}

          <div className="pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground">
              To enable storage access, an administrator must grant you permission. 
              You can view existing shared content, but cannot create new items until access is granted.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
