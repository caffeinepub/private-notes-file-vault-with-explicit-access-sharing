import { useState } from 'react';
import { useGetAllAdminPaywallStates, useSetPaywallStatus } from '../../hooks/useQueries';
import { formatExpirationDate, formatStorageSize } from '../../utils/paywall';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Loader2, Copy, Check } from 'lucide-react';
import ErrorBanner from '../common/ErrorBanner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface AdminPaywallAccessListScreenProps {
  onBack: () => void;
}

export default function AdminPaywallAccessListScreen({ onBack }: AdminPaywallAccessListScreenProps) {
  const { data: accessList, isLoading, error } = useGetAllAdminPaywallStates();
  const setPaywallStatus = useSetPaywallStatus();
  const [revokeTarget, setRevokeTarget] = useState<string | null>(null);
  const [copiedPrincipal, setCopiedPrincipal] = useState<string | null>(null);

  const handleRevoke = async () => {
    if (!revokeTarget) return;

    try {
      await setPaywallStatus.mutateAsync({
        user: revokeTarget,
        hasPaid: false,
        planLabel: null,
        paidUntil: null,
      });
      setRevokeTarget(null);
    } catch (error: any) {
      console.error('Failed to revoke access:', error);
    }
  };

  const handleCopyPrincipal = async (principal: string) => {
    try {
      await navigator.clipboard.writeText(principal);
      setCopiedPrincipal(principal);
      setTimeout(() => setCopiedPrincipal(null), 2000);
    } catch (error) {
      console.error('Failed to copy principal:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading access list...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Button variant="ghost" onClick={onBack} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Settings
        </Button>
        <ErrorBanner message={(error as Error).message || 'Failed to load access list'} />
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Button variant="ghost" onClick={onBack} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Settings
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Paywall Access Management</CardTitle>
            <CardDescription>
              View and manage all principals with storage access
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!accessList || accessList.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No principals with access found
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[300px]">Principal ID</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Expiration</TableHead>
                      <TableHead className="text-right">Storage Used</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {accessList.map((entry) => {
                      const principalStr = entry.principal.toString();
                      const isActive = entry.paywallStatus.hasPaid;
                      const planLabel = entry.paywallStatus.planLabel || '—';
                      const expirationDate = formatExpirationDate(entry.paywallStatus.paidUntil);
                      const storageFormatted = formatStorageSize(entry.totalStorage);
                      const storageBytes = Number(entry.totalStorage).toLocaleString();

                      return (
                        <TableRow key={principalStr}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <code className="text-xs bg-muted px-2 py-1 rounded font-mono break-all">
                                {principalStr}
                              </code>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 flex-shrink-0"
                                onClick={() => handleCopyPrincipal(principalStr)}
                              >
                                {copiedPrincipal === principalStr ? (
                                  <Check className="w-3 h-3 text-green-600" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={isActive ? 'default' : 'secondary'}>
                              {isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell>{planLabel}</TableCell>
                          <TableCell>{expirationDate || '—'}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex flex-col items-end">
                              <span className="font-medium">{storageFormatted}</span>
                              <span className="text-xs text-muted-foreground">
                                {storageBytes} bytes
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            {isActive ? (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => setRevokeTarget(principalStr)}
                                disabled={setPaywallStatus.isPending}
                              >
                                {setPaywallStatus.isPending ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  'Revoke'
                                )}
                              </Button>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <AlertDialog open={!!revokeTarget} onOpenChange={(open) => !open && setRevokeTarget(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Revoke Storage Access</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to revoke storage access for this principal? They will no longer be able to create or upload new content.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={setPaywallStatus.isPending}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleRevoke}
                disabled={setPaywallStatus.isPending}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {setPaywallStatus.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Revoking...
                  </>
                ) : (
                  'Revoke Access'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
