import { useState, useCallback } from 'react';
import { useUploadFile } from '../../hooks/useQueries';
import { useEncryptionSettings } from '../../hooks/encryption/useEncryptionSettings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileUp, X, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { ExternalBlob } from '../../backend';

interface FileUploadCardProps {
  hasStorageAccess: boolean;
}

export default function FileUploadCard({ hasStorageAccess }: FileUploadCardProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const uploadFile = useUploadFile();
  const { encryptFileBytes } = useEncryptionSettings();

  const handleFileSelect = (file: File) => {
    if (!hasStorageAccess) {
      toast.error('You need to pay to access storage');
      return;
    }
    setSelectedFile(file);
    setUploadProgress(0);
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (hasStorageAccess) {
      setIsDragging(true);
    }
  }, [hasStorageAccess]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (!hasStorageAccess) {
      toast.error('You need to pay to access storage');
      return;
    }
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [hasStorageAccess]);

  const handleUpload = async () => {
    if (!selectedFile) return;
    if (!hasStorageAccess) {
      toast.error('You need to pay to access storage');
      return;
    }

    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      const encryptedBytes = await encryptFileBytes(bytes);
      // Create a fresh Uint8Array to ensure proper ArrayBuffer type
      const uploadBytes = new Uint8Array(encryptedBytes.length);
      uploadBytes.set(encryptedBytes);
      const blob = ExternalBlob.fromBytes(uploadBytes).withUploadProgress((percentage) => {
        setUploadProgress(percentage);
      });

      await uploadFile.mutateAsync({
        displayName: selectedFile.name,
        blob,
      });

      toast.success('File uploaded successfully');
      setSelectedFile(null);
      setUploadProgress(0);
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to upload file';
      toast.error(errorMessage);
      setUploadProgress(0);
    }
  };

  const isUploading = uploadFile.isPending;

  if (!hasStorageAccess) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Upload File</CardTitle>
          <CardDescription>
            Storage access required to upload files
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <Lock className="h-4 w-4" />
            <AlertDescription>
              You need to pay to access storage and upload files. Please contact an administrator to enable storage access for your account.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload File</CardTitle>
        <CardDescription>
          Drag and drop a file or click to select one from your device
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragging
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50'
          }`}
        >
          {selectedFile ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-3">
                <FileUp className="w-8 h-8 text-primary" />
                <div className="flex-1 text-left">
                  <p className="font-medium truncate">{selectedFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                {!isUploading && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedFile(null)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>

              {isUploading && (
                <div className="space-y-2">
                  <Progress value={uploadProgress} />
                  <p className="text-sm text-muted-foreground">
                    Uploading... {uploadProgress}%
                  </p>
                </div>
              )}

              <Button
                onClick={handleUpload}
                disabled={isUploading}
                className="w-full"
              >
                <Upload className="w-4 h-4 mr-2" />
                {isUploading ? 'Uploading...' : 'Upload File'}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Upload className="w-12 h-12 text-muted-foreground mx-auto" />
              <div>
                <p className="text-sm font-medium mb-1">
                  Drop your file here or click to browse
                </p>
                <p className="text-xs text-muted-foreground">
                  All files are encrypted before upload
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (file) handleFileSelect(file);
                  };
                  input.click();
                }}
              >
                Select File
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
