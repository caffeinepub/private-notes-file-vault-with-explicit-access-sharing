import { useListFiles } from '../../hooks/useQueries';
import { useCurrentIdentity } from '../../hooks/useCurrentIdentity';
import { Badge } from '@/components/ui/badge';
import { FolderOpen, File, Lock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface FilesListPanelProps {
  selectedFileId: string | null;
  onSelectFile: (id: string) => void;
}

export default function FilesListPanel({ selectedFileId, onSelectFile }: FilesListPanelProps) {
  const { data: files, isLoading } = useListFiles();
  const { principal } = useCurrentIdentity();

  const getStatusBadge = (file: any) => {
    const isOwner = file.owner.toString() === principal;
    const isShared = file.sharedWith.length > 1;

    if (!isOwner) {
      return <Badge variant="secondary">Shared with you</Badge>;
    }
    if (isShared) {
      return <Badge variant="default">Shared</Badge>;
    }
    return <Badge variant="outline">Private</Badge>;
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border bg-card">
        <h2 className="text-lg font-semibold">Files</h2>
      </div>

      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : files && files.length > 0 ? (
          <div className="divide-y divide-border">
            {files.map((file) => (
              <button
                key={file.id}
                onClick={() => onSelectFile(file.id)}
                className={`w-full text-left p-4 hover:bg-accent transition-colors ${
                  selectedFileId === file.id ? 'bg-accent' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <File className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{file.displayName}</h3>
                      {file.description && (
                        <p className="text-sm text-muted-foreground truncate mt-0.5">
                          {file.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        {getStatusBadge(file)}
                        {file.cryptedSymmetricKey && (
                          <Lock className="w-3 h-3 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <FolderOpen className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No files yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Upload your first file to get started
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
