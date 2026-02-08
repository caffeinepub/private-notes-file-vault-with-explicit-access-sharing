import { useState } from 'react';
import { useListNotes, useCreateNote } from '../../hooks/useQueries';
import { useCurrentIdentity } from '../../hooks/useCurrentIdentity';
import { useEncryptionSettings } from '../../hooks/encryption/useEncryptionSettings';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, FileText, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

interface NotesListPanelProps {
  selectedNoteId: string | null;
  onSelectNote: (id: string) => void;
  hasStorageAccess: boolean;
}

export default function NotesListPanel({ selectedNoteId, onSelectNote, hasStorageAccess }: NotesListPanelProps) {
  const { data: notes, isLoading } = useListNotes();
  const { principal } = useCurrentIdentity();
  const { encryptContent } = useEncryptionSettings();
  const createNote = useCreateNote();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');

  const handleCreate = async () => {
    if (!hasStorageAccess) {
      toast.error('You need to pay to access storage');
      return;
    }

    if (!newTitle.trim()) {
      toast.error('Please enter a title');
      return;
    }

    try {
      const contentToStore = await encryptContent(newContent);
      await createNote.mutateAsync({ title: newTitle.trim(), content: contentToStore });
      toast.success('Note created successfully');
      setIsDialogOpen(false);
      setNewTitle('');
      setNewContent('');
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to create note';
      toast.error(errorMessage);
    }
  };

  const getStatusBadge = (note: any) => {
    const isOwner = note.owner.toString() === principal;
    const isShared = note.sharedWith.length > 1;

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
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Notes</h2>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" disabled={!hasStorageAccess}>
                <Plus className="w-4 h-4 mr-2" />
                New Note
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Note</DialogTitle>
                <DialogDescription>
                  Add a new note to your secure vault
                </DialogDescription>
              </DialogHeader>
              {!hasStorageAccess ? (
                <Alert>
                  <Lock className="h-4 w-4" />
                  <AlertDescription>
                    You need to pay to access storage and create notes. Please contact an administrator.
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        placeholder="Enter note title"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="content">Content</Label>
                      <textarea
                        id="content"
                        value={newContent}
                        onChange={(e) => setNewContent(e.target.value)}
                        placeholder="Enter note content"
                        className="w-full min-h-[120px] px-3 py-2 text-sm rounded-md border border-input bg-background"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                      disabled={createNote.isPending}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleCreate} disabled={createNote.isPending}>
                      {createNote.isPending ? 'Creating...' : 'Create Note'}
                    </Button>
                  </DialogFooter>
                </>
              )}
            </DialogContent>
          </Dialog>
        </div>
        {!hasStorageAccess && (
          <Alert className="mt-3">
            <Lock className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Storage access required to create new notes
            </AlertDescription>
          </Alert>
        )}
      </div>

      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : notes && notes.length > 0 ? (
          <div className="divide-y divide-border">
            {notes.map((note) => (
              <button
                key={note.id}
                onClick={() => onSelectNote(note.id)}
                className={`w-full text-left p-4 hover:bg-accent transition-colors ${
                  selectedNoteId === note.id ? 'bg-accent' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <FileText className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{note.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        {getStatusBadge(note)}
                        {note.cryptedSymmetricKey && (
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
            <FileText className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No notes yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {hasStorageAccess 
                ? 'Create your first note to get started'
                : 'Storage access required to create notes'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
