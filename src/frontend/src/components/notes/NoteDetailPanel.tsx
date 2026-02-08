import { useState, useEffect } from 'react';
import { useReadNote, useUpdateNote, useDeleteNote } from '../../hooks/useQueries';
import { useCurrentIdentity } from '../../hooks/useCurrentIdentity';
import { useEncryptionSettings } from '../../hooks/encryption/useEncryptionSettings';
import ShareManagerDialog from '../sharing/ShareManagerDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Save, Trash2, Share2, FileText, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import ErrorBanner from '../common/ErrorBanner';

interface NoteDetailPanelProps {
  noteId: string | null;
  onClose: () => void;
}

export default function NoteDetailPanel({ noteId, onClose }: NoteDetailPanelProps) {
  const { data: note, isLoading, error } = useReadNote(noteId);
  const { principal } = useCurrentIdentity();
  const { decryptContent, encryptContent } = useEncryptionSettings();
  const updateNote = useUpdateNote();
  const deleteNote = useDeleteNote();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [decryptedContent, setDecryptedContent] = useState<string | null>(null);

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      // Attempt to decrypt content
      decryptContent(note.content).then(setDecryptedContent);
    }
  }, [note, decryptContent]);

  const handleSave = async () => {
    if (!noteId || !note) return;

    try {
      const contentToStore = await encryptContent(content);
      await updateNote.mutateAsync({ id: noteId, title, content: contentToStore });
      toast.success('Note updated successfully');
      setIsEditing(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update note');
    }
  };

  const handleDelete = async () => {
    if (!noteId) return;

    try {
      await deleteNote.mutateAsync(noteId);
      toast.success('Note deleted successfully');
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete note');
    }
  };

  const handleEdit = () => {
    if (decryptedContent !== null) {
      setContent(decryptedContent);
    } else {
      setContent(note?.content || '');
    }
    setIsEditing(true);
  };

  if (!noteId) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <FileText className="w-16 h-16 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">No note selected</h3>
        <p className="text-sm text-muted-foreground">
          Select a note from the list to view its details
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
        <ErrorBanner message={(error as Error).message || 'Failed to load note'} />
      </div>
    );
  }

  if (!note) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <FileText className="w-16 h-16 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">Note not found</h3>
      </div>
    );
  }

  const isOwner = note.owner.toString() === principal;

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 border-b border-border bg-card">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-xl font-semibold"
              />
            ) : (
              <h2 className="text-xl font-semibold truncate">{note.title}</h2>
            )}
            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
              <span>{isOwner ? 'Owner' : 'Shared with you'}</span>
              {note.cryptedSymmetricKey && (
                <>
                  <span>•</span>
                  <Lock className="w-3 h-3" />
                  <span>Encrypted</span>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isOwner && (
              <>
                {isEditing ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(false)}
                      disabled={updateNote.isPending}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSave}
                      disabled={updateNote.isPending}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {updateNote.isPending ? 'Saving...' : 'Save'}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" size="sm" onClick={handleEdit}>
                      Edit
                    </Button>
                    <ShareManagerDialog
                      itemType="note"
                      itemId={note.id}
                      sharedWith={note.sharedWith}
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
                          <AlertDialogTitle>Delete Note</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this note? This action cannot be
                            undone.
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
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {isEditing ? (
          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full min-h-[400px] px-3 py-2 text-sm rounded-md border border-input bg-background font-mono"
            />
          </div>
        ) : (
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <pre className="whitespace-pre-wrap font-sans text-sm">
              {decryptedContent !== null ? decryptedContent : note.content}
            </pre>
          </div>
        )}
      </div>

      {!isOwner && (
        <div className="p-4 border-t border-border bg-muted/50">
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Shared Access</h3>
            <p className="text-xs text-muted-foreground">
              You have read-only access to this note. Contact the owner to request edit
              permissions.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

