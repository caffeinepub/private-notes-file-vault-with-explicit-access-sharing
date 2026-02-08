import { useState } from 'react';
import { useShareItem, useRevokeAccess } from '../../hooks/useQueries';
import { useCurrentIdentity } from '../../hooks/useCurrentIdentity';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { UserPlus, X } from 'lucide-react';
import { toast } from 'sonner';
import type { Principal } from '@dfinity/principal';

interface ShareManagerDialogProps {
  itemType: 'note' | 'file';
  itemId: string;
  sharedWith: Principal[];
  trigger: React.ReactNode;
}

export default function ShareManagerDialog({
  itemType,
  itemId,
  sharedWith,
  trigger,
}: ShareManagerDialogProps) {
  const { principal } = useCurrentIdentity();
  const shareItem = useShareItem();
  const revokeAccess = useRevokeAccess();
  const [recipientPrincipal, setRecipientPrincipal] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const handleShare = async () => {
    if (!recipientPrincipal.trim()) {
      toast.error('Please enter a principal ID');
      return;
    }

    try {
      await shareItem.mutateAsync({
        itemType,
        id: itemId,
        recipient: recipientPrincipal.trim(),
      });
      toast.success('Access granted successfully');
      setRecipientPrincipal('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to grant access');
    }
  };

  const handleRevoke = async (recipient: string) => {
    try {
      await revokeAccess.mutateAsync({
        itemType,
        id: itemId,
        recipient,
      });
      toast.success('Access revoked successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to revoke access');
    }
  };

  const otherUsers = sharedWith.filter((p) => p.toString() !== principal);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Access</DialogTitle>
          <DialogDescription>
            Share this {itemType} with other users by entering their principal ID
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="principal">Principal ID</Label>
            <div className="flex gap-2">
              <Input
                id="principal"
                value={recipientPrincipal}
                onChange={(e) => setRecipientPrincipal(e.target.value)}
                placeholder="Enter principal ID"
                className="flex-1"
              />
              <Button
                onClick={handleShare}
                disabled={shareItem.isPending}
                size="icon"
              >
                <UserPlus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {otherUsers.length > 0 && (
            <div className="space-y-2">
              <Label>Shared With</Label>
              <div className="space-y-2 max-h-48 overflow-auto">
                {otherUsers.map((user) => (
                  <div
                    key={user.toString()}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-mono truncate">{user.toString()}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRevoke(user.toString())}
                      disabled={revokeAccess.isPending}
                      className="flex-shrink-0 ml-2"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {otherUsers.length === 0 && (
            <div className="text-center py-6">
              <Badge variant="outline">Private</Badge>
              <p className="text-sm text-muted-foreground mt-2">
                Not shared with anyone yet
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

