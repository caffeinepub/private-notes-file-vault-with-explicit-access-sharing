import { useState } from 'react';
import { useCurrentIdentity } from '../../hooks/useCurrentIdentity';
import { useGetCallerUserProfile, useGetCallerPaywallStatus, useIsCallerAdmin } from '../../hooks/useQueries';
import LoginButton from '../auth/LoginButton';
import NotesListPanel from '../notes/NotesListPanel';
import NoteDetailPanel from '../notes/NoteDetailPanel';
import FilesListPanel from '../files/FilesListPanel';
import FilePreviewPanel from '../files/FilePreviewPanel';
import FileUploadCard from '../files/FileUploadCard';
import EncryptionToggle from '../settings/EncryptionToggle';
import PaywallAdminPanel from '../settings/PaywallAdminPanel';
import AdminPaywallAccessListScreen from '../settings/AdminPaywallAccessListScreen';
import PaywallPanel from '../paywall/PaywallPanel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, FileText, FolderOpen, Upload, Settings } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { isStorageEnabled } from '../../utils/paywall';

type ViewMode = 'vault' | 'admin-access-list';

export default function VaultLayout() {
  const { principal } = useCurrentIdentity();
  const { data: userProfile } = useGetCallerUserProfile();
  const { data: paywallStatus, isLoading: paywallLoading } = useGetCallerPaywallStatus();
  const { data: isAdmin } = useIsCallerAdmin();
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('notes');
  const [viewMode, setViewMode] = useState<ViewMode>('vault');
  const [settingsOpen, setSettingsOpen] = useState(false);

  const hasStorageAccess = isStorageEnabled(paywallStatus);

  const handleViewAccessList = () => {
    setSettingsOpen(false);
    setViewMode('admin-access-list');
  };

  const handleBackToVault = () => {
    setViewMode('vault');
  };

  // Admin-only access list view
  if (viewMode === 'admin-access-list') {
    if (!isAdmin) {
      setViewMode('vault');
      return null;
    }

    return (
      <div className="flex flex-col h-screen bg-background">
        {/* Header */}
        <header className="border-b border-border bg-card">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Shield className="w-8 h-8 text-primary" />
              <div>
                <h1 className="text-xl font-bold tracking-tight">Secure Vault</h1>
                <p className="text-xs text-muted-foreground">
                  {userProfile?.name || 'Loading...'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <LoginButton />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-hidden">
          <AdminPaywallAccessListScreen onBack={handleBackToVault} />
        </main>

        {/* Footer */}
        <footer className="border-t border-border bg-card py-3">
          <div className="container mx-auto px-4 text-center text-xs text-muted-foreground">
            © 2026. Built with love using{' '}
            <a
              href="https://caffeine.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              caffeine.ai
            </a>
          </div>
        </footer>
      </div>
    );
  }

  // Normal vault view
  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Shield className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-xl font-bold tracking-tight">Secure Vault</h1>
              <p className="text-xs text-muted-foreground">
                {userProfile?.name || 'Loading...'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <Settings className="w-4 h-4" />
                </Button>
              </SheetTrigger>
              <SheetContent className="flex flex-col">
                <SheetHeader className="flex-shrink-0">
                  <SheetTitle>Settings</SheetTitle>
                  <SheetDescription>
                    Configure your vault preferences
                  </SheetDescription>
                </SheetHeader>
                <div className="flex-1 min-h-0 overflow-y-auto mt-6">
                  <div className="space-y-6 pb-6">
                    <EncryptionToggle />
                    <div className="pt-4 border-t border-border">
                      <PaywallAdminPanel onViewAccessList={isAdmin ? handleViewAccessList : undefined} />
                    </div>
                    <div className="pt-4 border-t border-border">
                      <p className="text-xs text-muted-foreground break-all">
                        <span className="font-medium">Principal ID:</span>
                        <br />
                        {principal}
                      </p>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
            <LoginButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <div className="border-b border-border bg-card">
            <div className="container mx-auto px-4">
              <TabsList className="bg-transparent border-0 h-12">
                <TabsTrigger value="notes" className="data-[state=active]:bg-accent">
                  <FileText className="w-4 h-4 mr-2" />
                  Notes
                </TabsTrigger>
                <TabsTrigger value="files" className="data-[state=active]:bg-accent">
                  <FolderOpen className="w-4 h-4 mr-2" />
                  Files
                </TabsTrigger>
                <TabsTrigger value="upload" className="data-[state=active]:bg-accent">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload
                </TabsTrigger>
              </TabsList>
            </div>
          </div>

          <div className="flex-1 overflow-hidden">
            <TabsContent value="notes" className="h-full m-0">
              <div className="h-full grid grid-cols-1 lg:grid-cols-2 gap-0">
                <div className="border-r border-border overflow-auto">
                  <NotesListPanel
                    selectedNoteId={selectedNoteId}
                    onSelectNote={setSelectedNoteId}
                    hasStorageAccess={hasStorageAccess}
                  />
                </div>
                <div className="overflow-auto">
                  <NoteDetailPanel
                    noteId={selectedNoteId}
                    onClose={() => setSelectedNoteId(null)}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="files" className="h-full m-0">
              <div className="h-full grid grid-cols-1 lg:grid-cols-2 gap-0">
                <div className="border-r border-border overflow-auto">
                  <FilesListPanel
                    selectedFileId={selectedFileId}
                    onSelectFile={setSelectedFileId}
                  />
                </div>
                <div className="overflow-auto">
                  <FilePreviewPanel
                    fileId={selectedFileId}
                    onClose={() => setSelectedFileId(null)}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="upload" className="h-full m-0">
              {paywallLoading ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-muted-foreground">Loading...</p>
                  </div>
                </div>
              ) : hasStorageAccess ? (
                <div className="h-full overflow-auto">
                  <div className="container mx-auto px-4 py-8 max-w-2xl">
                    <FileUploadCard hasStorageAccess={hasStorageAccess} />
                  </div>
                </div>
              ) : (
                <PaywallPanel status={paywallStatus} />
              )}
            </TabsContent>
          </div>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-3">
        <div className="container mx-auto px-4 text-center text-xs text-muted-foreground">
          © 2026. Built with love using{' '}
          <a
            href="https://caffeine.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            caffeine.ai
          </a>
        </div>
      </footer>
    </div>
  );
}
