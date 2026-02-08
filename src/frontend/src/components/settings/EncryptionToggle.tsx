import { useEncryptionSettings } from '../../hooks/encryption/useEncryptionSettings';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Lock, Unlock } from 'lucide-react';

export default function EncryptionToggle() {
  const { encryptionEnabled, toggleEncryption } = useEncryptionSettings();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="encryption" className="text-base font-medium">
            Client-Side Encryption
          </Label>
          <p className="text-sm text-muted-foreground">
            Encrypt data before uploading to the vault
          </p>
        </div>
        <Switch
          id="encryption"
          checked={encryptionEnabled}
          onCheckedChange={toggleEncryption}
        />
      </div>

      <div className="flex items-start gap-3 p-4 bg-muted rounded-lg">
        {encryptionEnabled ? (
          <>
            <Lock className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="flex-1 text-sm">
              <p className="font-medium mb-1">Encryption Enabled</p>
              <p className="text-muted-foreground">
                All notes and files are encrypted in your browser before being stored. Only you
                and users you explicitly share with can decrypt the content.
              </p>
            </div>
          </>
        ) : (
          <>
            <Unlock className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
            <div className="flex-1 text-sm">
              <p className="font-medium mb-1">Encryption Disabled</p>
              <p className="text-muted-foreground">
                Content is stored without client-side encryption. Backend access control still
                protects your data from unauthorized access.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

