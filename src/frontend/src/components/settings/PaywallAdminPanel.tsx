import { useState } from 'react';
import { useGetCallerPaywallStatus, useIsCallerAdmin, useSetPaywallStatus } from '../../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, Users } from 'lucide-react';
import { getPaywallStatusLabel, formatExpirationDate } from '../../utils/paywall';
import ErrorBanner from '../common/ErrorBanner';

interface PaywallAdminPanelProps {
  onViewAccessList?: () => void;
}

export default function PaywallAdminPanel({ onViewAccessList }: PaywallAdminPanelProps) {
  const { data: paywallStatus, isLoading: statusLoading } = useGetCallerPaywallStatus();
  const { data: isAdmin, isLoading: adminLoading } = useIsCallerAdmin();
  const setPaywallStatus = useSetPaywallStatus();

  const [targetPrincipal, setTargetPrincipal] = useState('');
  const [planLabel, setPlanLabel] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleGrantAccess = async () => {
    setError(null);
    
    if (!targetPrincipal.trim()) {
      setError('Please enter a principal ID');
      return;
    }

    try {
      await setPaywallStatus.mutateAsync({
        user: targetPrincipal.trim(),
        hasPaid: true,
        planLabel: planLabel.trim() || null,
        paidUntil: null,
      });
      setTargetPrincipal('');
      setPlanLabel('');
    } catch (err: any) {
      setError(err.message || 'Failed to grant access');
    }
  };

  const handleRevokeAccess = async () => {
    setError(null);
    
    if (!targetPrincipal.trim()) {
      setError('Please enter a principal ID');
      return;
    }

    try {
      await setPaywallStatus.mutateAsync({
        user: targetPrincipal.trim(),
        hasPaid: false,
        planLabel: null,
        paidUntil: null,
      });
      setTargetPrincipal('');
      setPlanLabel('');
    } catch (err: any) {
      setError(err.message || 'Failed to revoke access');
    }
  };

  if (statusLoading || adminLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Paywall Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const statusLabel = getPaywallStatusLabel(paywallStatus);
  const expirationDate = formatExpirationDate(paywallStatus?.paidUntil);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Your Paywall Status</CardTitle>
          <CardDescription>Current storage access status</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Status:</span>
            <Badge variant={statusLabel === 'Active' ? 'default' : 'secondary'}>
              {statusLabel}
            </Badge>
          </div>
          {paywallStatus?.planLabel && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Plan:</span>
              <span className="text-sm text-muted-foreground">{paywallStatus.planLabel}</span>
            </div>
          )}
          {expirationDate && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Expires:</span>
              <span className="text-sm text-muted-foreground">{expirationDate}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>Admin Controls</CardTitle>
            <CardDescription>Manage storage access for users</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && <ErrorBanner message={error} />}
            
            <div className="space-y-2">
              <Label htmlFor="principal">Principal ID</Label>
              <Input
                id="principal"
                placeholder="Enter principal ID"
                value={targetPrincipal}
                onChange={(e) => setTargetPrincipal(e.target.value)}
                disabled={setPaywallStatus.isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="plan">Plan Label (optional)</Label>
              <Input
                id="plan"
                placeholder="e.g., Premium, Basic"
                value={planLabel}
                onChange={(e) => setPlanLabel(e.target.value)}
                disabled={setPaywallStatus.isPending}
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleGrantAccess}
                disabled={setPaywallStatus.isPending}
                className="flex-1"
              >
                {setPaywallStatus.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Grant Access'
                )}
              </Button>
              <Button
                onClick={handleRevokeAccess}
                disabled={setPaywallStatus.isPending}
                variant="destructive"
                className="flex-1"
              >
                {setPaywallStatus.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Revoke Access'
                )}
              </Button>
            </div>

            {onViewAccessList && (
              <div className="pt-4 border-t border-border">
                <Button
                  onClick={onViewAccessList}
                  variant="outline"
                  className="w-full"
                >
                  <Users className="w-4 h-4 mr-2" />
                  View Access List
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
