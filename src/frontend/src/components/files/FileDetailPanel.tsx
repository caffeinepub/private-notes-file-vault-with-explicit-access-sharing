import { useState } from 'react';
import { useGetFile, useDeleteFile, useUpdateFileMetadata } from '../../hooks/useQueries';
import { useCurrentIdentity } from '../../hooks/useCurrentIdentity';
import { useEncryptionSettings } from '../../hooks/encryption/useEncryptionSettings';
import ShareManagerDialog from '../sharing/ShareManagerDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Download, Trash2, Share2, File, Lock, Edit2, X, Check } from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import ErrorBanner from '../common/ErrorBanner';

interface FileDetailPanelProps {
  fileId: string | null;
  onClose: () => void;
}

export default function FileDetailPanel({ fileId, onClose }: FileDetailPanelProps) {
  const { data: file, isLoading, error } = useGetFile(fileId);
  const { principal } = useCurrentIdentity();
  const { decryptFileBytes } = useEncryptionSettings();
  const deleteFile = useDeleteFile();
  const updateFileMetadata = useUpdateFileMetadata();

  const [isEditing, setIsEditing] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editDescription, setEditDescription] = useState('');

  const handleDownload = async () => {
    if (!file) return;

    try {
      const bytes = await file.content.getBytes();
      const decryptedBytes = await decryptFileBytes(bytes);
      // Create a fresh Uint8Array to ensure proper ArrayBuffer type
      const downloadBytes = new Uint8Array(decryptedBytes.length);
      downloadBytes.set(decryptedBytes);
      const blob = new Blob([downloadBytes]);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.displayName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('File downloaded successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to download file');
    }
  };

  const handleDelete = async () => {
    if (!fileId) return;

    try {
      await deleteFile.mutateAsync(fileId);
      toast.success('File deleted successfully');
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete file');
    }
  };

  const handleStartEdit = () => {
    if (!file) return;
    setEditDisplayName(file.displayName);
    setEditDescription(file.description);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditDisplayName('');
    setEditDescription('');
  };

  const handleSaveEdit = async () => {
    if (!fileId || !editDisplayName.trim()) {
      toast.error('File name cannot be empty');
      return;
    }

    try {
      await updateFileMetadata.mutateAsync({
        id: fileId,
        displayName: editDisplayName.trim(),
        description: editDescription.trim(),
      });
      toast.success('File updated successfully');
      setIsEditing(false);
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to update file';
      if (errorMessage.includes('Unauthorized') || errorMessage.includes('Only the owner')) {
        toast.error('You do not have permission to edit this file');
      } else if (errorMessage.includes('not found')) {
        toast.error('File not found');
      } else {
        toast.error(errorMessage);
      }
    }
  };

  if (!fileId) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <File className="w-16 h-16 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">No file selected</h3>
        <p className="text-sm text-muted-foreground">
          Select a file from the list to view its details
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <ErrorBanner message={(error as Error).message || 'Failed to load file'} />
      </div>
    );
  }

  if (!file) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <File className="w-16 h-16 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">File not found</h3>
      </div>
    );
  }

  const isOwner = file.owner.toString() === principal;

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 border-b border-border bg-card">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <div className="space-y-3">
                <div>
                  <Label htmlFor="edit-name" className="text-sm font-medium">
                    File Name
                  </Label>
                  <Input
                    id="edit-name"
                    value={editDisplayName}
                    onChange={(e) => setEditDisplayName(e.target.value)}
                    placeholder="Enter file name"
                    className="mt-1"
                    disabled={updateFileMetadata.isPending}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-description" className="text-sm font-medium">
                    Description
                  </Label>
                  <Textarea
                    id="edit-description"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="Add a description (optional)"
                    rows={3}
                    className="mt-1"
                    disabled={updateFileMetadata.isPending}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={handleSaveEdit}
                    disabled={updateFileMetadata.isPending || !editDisplayName.trim()}
                  >
                    <Check className="w-4 h-4 mr-2" />
                    {updateFileMetadata.isPending ? 'Saving...' : 'Save'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCancelEdit}
                    disabled={updateFileMetadata.isPending}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-semibold truncate">{file.displayName}</h2>
                  {isOwner && (
                    <Button variant="ghost" size="sm" onClick={handleStartEdit}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                {file.description && (
                  <p className="text-sm text-muted-foreground mt-2">{file.description}</p>
                )}
                <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                  <span>{isOwner ? 'Owner' : 'Shared with you'}</span>
                  {file.cryptedSymmetricKey && (
                    <>
                      <span>•</span>
                      <Lock className="w-3 h-3" />
                      <span>Encrypted</span>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
          {!isEditing && (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              {isOwner && (
                <>
                  <ShareManagerDialog
                    itemType="file"
                    itemId={file.id}
                    sharedWith={file.sharedWith}
                    trigger={
                      <Button variant="outline" size="sm">
                        <Share2 className="w-4 h-4 mr-2" />
                        Share
                      </Button>
                    }
                  />
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete File</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this file? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDelete}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="bg-muted rounded-lg p-8 text-center">
          <File className="w-24 h-24 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">{file.displayName}</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Click the download button to save this file to your device
          </p>
        </div>
      </div>

      {!isOwner && (
        <div className="p-4 border-t border-border bg-muted/50">
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Shared Access</h3>
            <p className="text-xs text-muted-foreground">
              You have download access to this file. Contact the owner for more information.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
