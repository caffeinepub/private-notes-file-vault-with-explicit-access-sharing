import { useState, useEffect } from 'react';
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
import { Download, Trash2, Share2, File, Lock, Edit2, X, Check, ArrowLeft, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import ErrorBanner from '../common/ErrorBanner';
import { getPreviewType, getMimeType, canPlayVideo } from '../../utils/filePreview';

interface FilePreviewPanelProps {
  fileId: string | null;
  onClose: () => void;
}

export default function FilePreviewPanel({ fileId, onClose }: FilePreviewPanelProps) {
  const { data: file, isLoading, error } = useGetFile(fileId);
  const { principal } = useCurrentIdentity();
  const { decryptFileBytes } = useEncryptionSettings();
  const deleteFile = useDeleteFile();
  const updateFileMetadata = useUpdateFileMetadata();

  const [isEditing, setIsEditing] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editDescription, setEditDescription] = useState('');

  // Preview state
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  // Load and decrypt file for preview
  useEffect(() => {
    let isMounted = true;
    let currentUrl: string | null = null;

    const loadPreview = async () => {
      if (!file) return;

      const previewType = getPreviewType(file.displayName);
      if (previewType === 'unsupported') return;

      setPreviewLoading(true);
      setPreviewError(null);

      try {
        const bytes = await file.content.getBytes();
        const decryptedBytes = await decryptFileBytes(bytes);
        
        // Create a fresh Uint8Array to ensure proper ArrayBuffer type
        const previewBytes = new Uint8Array(decryptedBytes.length);
        previewBytes.set(decryptedBytes);

        const mimeType = getMimeType(file.displayName);
        const blob = new Blob([previewBytes], { type: mimeType });
        const url = URL.createObjectURL(blob);

        if (isMounted) {
          currentUrl = url;
          setPreviewUrl(url);
        } else {
          URL.revokeObjectURL(url);
        }
      } catch (error: any) {
        if (isMounted) {
          setPreviewError(error.message || 'Failed to load preview');
        }
      } finally {
        if (isMounted) {
          setPreviewLoading(false);
        }
      }
    };

    loadPreview();

    return () => {
      isMounted = false;
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl);
      }
    };
  }, [file, decryptFileBytes]);

  // Cleanup preview URL when file changes
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [fileId]);

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

  const handleRetryPreview = () => {
    setPreviewError(null);
    setPreviewLoading(true);
    // Trigger re-render by updating a dependency
    if (file) {
      const previewType = getPreviewType(file.displayName);
      if (previewType !== 'unsupported') {
        // Force reload by clearing and re-setting
        setPreviewUrl(null);
      }
    }
  };

  if (!fileId) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <File className="w-16 h-16 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">No file selected</h3>
        <p className="text-sm text-muted-foreground">
          Select a file from the list to preview it
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-96 w-full" />
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
  const previewType = getPreviewType(file.displayName);
  const mimeType = getMimeType(file.displayName);

  const renderPreview = () => {
    if (previewLoading) {
      return (
        <div className="flex items-center justify-center h-96 bg-muted/20 rounded-lg">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-muted-foreground">Loading preview...</p>
          </div>
        </div>
      );
    }

    if (previewError) {
      return (
        <div className="flex flex-col items-center justify-center h-96 bg-muted/20 rounded-lg p-8">
          <AlertCircle className="w-12 h-12 text-destructive mb-4" />
          <p className="text-sm text-muted-foreground mb-4 text-center">{previewError}</p>
          <Button onClick={handleRetryPreview} variant="outline" size="sm">
            Retry
          </Button>
        </div>
      );
    }

    if (previewType === 'image' && previewUrl) {
      return (
        <div className="bg-muted/20 rounded-lg p-4 flex items-center justify-center min-h-96">
          <img
            src={previewUrl}
            alt={file.displayName}
            className="max-w-full max-h-[600px] object-contain rounded"
          />
        </div>
      );
    }

    if (previewType === 'pdf' && previewUrl) {
      return (
        <div className="bg-muted/20 rounded-lg overflow-hidden">
          <iframe
            src={previewUrl}
            title={file.displayName}
            className="w-full h-[600px] border-0"
          />
        </div>
      );
    }

    if (previewType === 'video' && previewUrl) {
      const canPlay = canPlayVideo(mimeType);
      
      if (!canPlay) {
        return (
          <div className="flex flex-col items-center justify-center h-96 bg-muted/20 rounded-lg p-8">
            <File className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground mb-2 text-center">
              Your browser cannot play this video format.
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              Use the download button to save the file.
            </p>
          </div>
        );
      }

      return (
        <div className="bg-muted/20 rounded-lg p-4">
          <video
            src={previewUrl}
            controls
            className="w-full max-h-[600px] rounded"
          >
            Your browser does not support the video tag.
          </video>
        </div>
      );
    }

    // Unsupported type
    return (
      <div className="flex flex-col items-center justify-center h-96 bg-muted/20 rounded-lg p-8">
        <File className="w-12 h-12 text-muted-foreground mb-4" />
        <p className="text-sm text-muted-foreground mb-2 text-center">
          Preview not available for this file type.
        </p>
        <p className="text-xs text-muted-foreground">
          Use the download button to save the file.
        </p>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header with Back Button and Actions */}
      <div className="p-6 border-b border-border bg-card">
        <div className="flex items-start justify-between gap-4 mb-4">
          <Button variant="ghost" size="sm" onClick={onClose}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Files
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
            {isOwner && (
              <>
                <ShareManagerDialog
                  itemType="file"
                  itemId={fileId}
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
                    <Button variant="outline" size="sm">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete File</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "{file.displayName}"? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {deleteFile.isPending ? 'Deleting...' : 'Delete'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
          </div>
        </div>

        {/* File Metadata */}
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
      </div>

      {/* Preview Area */}
      <div className="flex-1 overflow-auto p-6">
        {renderPreview()}
      </div>
    </div>
  );
}
