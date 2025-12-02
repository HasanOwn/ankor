import { useState, useEffect } from 'react';
import { Cloud, Upload, Search, Download, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { VocabSet, Document } from '@/types/word';
import { toast } from 'sonner';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CloudShareDialogProps {
  vocabSets: VocabSet[];
  onImport: (sets: VocabSet[]) => void;
}

interface CloudSet {
  id: string;
  username: string;
  set_name: string;
  data: any;
  created_at: string;
}

export const CloudShareDialog = ({ vocabSets, onImport }: CloudShareDialogProps) => {
  const [username, setUsername] = useState('');
  const [searchUsername, setSearchUsername] = useState('');
  const [searchResults, setSearchResults] = useState<CloudSet[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedSet, setSelectedSet] = useState<string>('');
  const [open, setOpen] = useState(false);
  const [documents, setDocuments] = useLocalStorage<Document[]>('my-documents', []);

  useEffect(() => {
    if (!open) return;

    try {
      const item = window.localStorage.getItem('my-documents');
      if (item) {
        setDocuments(JSON.parse(item));
      }
    } catch (error) {
      console.error('Error syncing notes from localStorage:', error);
    }
  }, [open, setDocuments]);

  const handleUpload = async () => {
    if (!username.trim()) {
      toast.error('Please enter your username');
      return;
    }

    if (!selectedSet) {
      toast.error('Please select a set to upload');
      return;
    }

    const setToUpload = vocabSets.find((s) => s.id === selectedSet);
    if (!setToUpload) return;

    const cleanedUsername = username.trim().toLowerCase();

    setIsUploading(true);
    try {
      // Check if a set with the same name already exists for this user
      const { data: existing, error: fetchError } = await supabase
        .from('vocab_sets')
        .select('id')
        .eq('username', cleanedUsername)
        .eq('set_name', setToUpload.name)
        .limit(1)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (existing) {
        // Update existing cloud set instead of creating a duplicate
        const { error: updateError } = await supabase
          .from('vocab_sets')
          .update({
            data: setToUpload.words as any,
            created_at: new Date().toISOString(),
          })
          .eq('id', existing.id);

        if (updateError) throw updateError;
        toast.success(`☁️ "${setToUpload.name}" updated in cloud!`);
      } else {
        // Create a new cloud set
        const { error: insertError } = await supabase.from('vocab_sets').insert([
          {
            username: cleanedUsername,
            set_name: setToUpload.name,
            data: setToUpload.words as any,
          },
        ]);

        if (insertError) throw insertError;
        toast.success(`☁️ "${setToUpload.name}" uploaded successfully!`);
      }

      setSelectedSet('');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload set. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleUploadNotes = async () => {
    if (!username.trim()) {
      toast.error('Please enter your username');
      return;
    }

    if (!documents.length) {
      toast.error('You have no notes to upload');
      return;
    }

    const cleanedUsername = username.trim().toLowerCase();

    setIsUploading(true);
    try {
      // Check if cloud notes already exist for this user
      const { data: existing, error: fetchError } = await supabase
        .from('vocab_sets')
        .select('id')
        .eq('username', cleanedUsername)
        .eq('set_name', 'My Notes')
        .limit(1)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (existing) {
        const { error: updateError } = await supabase
          .from('vocab_sets')
          .update({
            data: documents as any,
            created_at: new Date().toISOString(),
          })
          .eq('id', existing.id);

        if (updateError) throw updateError;
        toast.success('☁️ Your notes in cloud were updated!');
      } else {
        const { error: insertError } = await supabase.from('vocab_sets').insert([
          {
            username: cleanedUsername,
            set_name: 'My Notes',
            data: documents as any,
          },
        ]);

        if (insertError) throw insertError;
        toast.success('☁️ Your notes uploaded successfully!');
      }
    } catch (error) {
      console.error('Upload notes error:', error);
      toast.error('Failed to upload notes. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchUsername.trim()) {
      toast.error('Please enter a username to search');
      return;
    }

    setIsSearching(true);
    try {
      const { data, error } = await supabase
        .from('vocab_sets')
        .select('*')
        .eq('username', searchUsername.trim().toLowerCase())
        .order('created_at', { ascending: false });

      if (error) throw error;

      const allItems = (data || []) as CloudSet[];
      const uniqueMap = new Map<string, CloudSet>();

      for (const item of allItems) {
        const key = `${item.username}-${item.set_name}`;
        if (!uniqueMap.has(key)) {
          uniqueMap.set(key, item);
        }
      }

      const uniqueResults = Array.from(uniqueMap.values());
      setSearchResults(uniqueResults);
      
      if (uniqueResults.length === 0) {
        toast.info(`No sets found for "${searchUsername}"`);
      } else {
        toast.success(`📚 Found ${uniqueResults.length} set(s) from ${searchUsername}!`);
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Failed to search. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };
  const isNotesCloudSet = (cloudSet: CloudSet) => {
    return Array.isArray(cloudSet.data) && cloudSet.data.length > 0 && cloudSet.data[0]?.title && cloudSet.data[0]?.content;
  };

  const importNotesFromCloud = (cloudSet: CloudSet) => {
    try {
      const cloudDocs = (cloudSet.data || []) as Document[];
      if (!Array.isArray(cloudDocs) || cloudDocs.length === 0) {
        toast.error('No notes found in this item');
        return;
      }

      const existingTitles = new Set(documents.map((d) => d.title.toLowerCase()));
      const newDocs = cloudDocs
        .filter((doc) => !existingTitles.has(doc.title.toLowerCase()))
        .map((doc) => ({
          ...doc,
          id: doc.id || crypto.randomUUID(),
          createdAt: doc.createdAt || Date.now(),
          updatedAt: doc.updatedAt || Date.now(),
        }));

      if (newDocs.length === 0) {
        toast.info('All notes are already in your collection');
        return;
      }

      setDocuments([...documents, ...newDocs]);
      toast.success(`Added ${newDocs.length} note(s) from "${cloudSet.set_name}"`);
    } catch (error) {
      console.error('Import notes error:', error);
      toast.error('Failed to import notes');
    }
  };

  const handleImportSet = (cloudSet: CloudSet) => {
    try {
      const newSet: VocabSet = {
        id: `set-${Date.now()}-${Math.random()}`,
        name: cloudSet.set_name,
        words: cloudSet.data,
        createdAt: Date.now()
      };

      onImport([newSet]);
      toast.success(`Added "${cloudSet.set_name}"!`);
    } catch (error) {
      toast.error('Failed to import set');
    }
  };

  const handleImportAll = () => {
    try {
      const setCloudItems = searchResults.filter((cloudSet) => !isNotesCloudSet(cloudSet));
      const newSets: VocabSet[] = setCloudItems.map(cloudSet => ({
        id: `set-${Date.now()}-${Math.random()}`,
        name: cloudSet.set_name,
        words: cloudSet.data,
        createdAt: Date.now()
      }));

      if (newSets.length === 0) {
        toast.info('No new sets to import');
        return;
      }

      onImport(newSets);
      toast.success(`Added all ${newSets.length} set(s)!`);
      setSearchResults([]);
      setSearchUsername('');
    } catch (error) {
      toast.error('Failed to import sets');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Cloud className="h-4 w-4 mr-2" />
          Cloud Share
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>☁️ Cloud Share</DialogTitle>
          <DialogDescription>
            Upload your sets or download sets from other users
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">Upload</TabsTrigger>
            <TabsTrigger value="search">Search & Download</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Your Username</Label>
              <Input
                id="username"
                placeholder="kamoliddin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="set-select">Select Set to Upload</Label>
              <select
                id="set-select"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={selectedSet}
                onChange={(e) => setSelectedSet(e.target.value)}
              >
                <option value="">Choose a set...</option>
                {vocabSets.map(set => (
                  <option key={set.id} value={set.id}>
                    {set.name} ({set.words.length} words)
                  </option>
                ))}
              </select>
            </div>

            <Button 
              onClick={handleUpload} 
              disabled={isUploading || !username || !selectedSet}
              className="w-full"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Set
                </>
              )}
            </Button>

            <div className="pt-4 border-t border-border space-y-2">
              <Label>Upload All Notes</Label>
              <p className="text-xs text-muted-foreground">
                Upload your "My Notes" documents so you can download them on another device.
              </p>
              <Button
                onClick={handleUploadNotes}
                disabled={isUploading || !username || !documents.length}
                variant="outline"
                className="w-full"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Notes ({documents.length})
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="search" className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  placeholder="Enter username to search..."
                  value={searchUsername}
                  onChange={(e) => setSearchUsername(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <Button onClick={handleSearch} disabled={isSearching}>
                {isSearching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>

            {searchResults.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    📚 {searchResults.length} set(s) found from {searchUsername}
                  </p>
                  <Button onClick={handleImportAll} variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Add All Sets
                  </Button>
                </div>

                <ScrollArea className="h-[300px] rounded-md border p-4">
                  <div className="space-y-2">
                    {searchResults.map((cloudSet) => {
                      const isNotes = isNotesCloudSet(cloudSet);
                      const itemCount = Array.isArray(cloudSet.data) ? cloudSet.data.length : 0;

                      return (
                        <div
                          key={cloudSet.id}
                          className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                        >
                          <div>
                            <p className="font-medium">{cloudSet.set_name}</p>
                            <p className="text-sm text-muted-foreground">
                              {itemCount} {isNotes ? 'notes' : 'words'}
                            </p>
                          </div>
                          <Button
                            onClick={() => (isNotes ? importNotesFromCloud(cloudSet) : handleImportSet(cloudSet))}
                            variant="ghost"
                            size="sm"
                          >
                            <Download className="h-4 w-4 mr-2" />
                            {isNotes ? 'Add Notes' : 'Add'}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
