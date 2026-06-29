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
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

interface CloudShareDialogProps {
  vocabSets: VocabSet[];
  onImport: (sets: VocabSet[]) => void;
  trigger?: React.ReactNode;
}

interface CloudSet {
  id: string;
  username: string;
  set_name: string;
  data: any;
  created_at: string;
}

export const CloudShareDialog = ({ vocabSets, onImport, trigger }: CloudShareDialogProps) => {
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
        toast.success(`Found ${uniqueResults.length} set(s) from ${searchUsername}`);
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
        {trigger ?? (
          <Button variant="outline" size="sm">
            <Cloud className="h-4 w-4 mr-2" />
            Cloud Share
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[460px] p-0 overflow-hidden">
        <div className="px-6 pt-6 pb-4 bg-gradient-to-b from-primary/5 to-transparent">
          <DialogHeader>
            <div className="mx-auto w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-2">
              <Cloud className="h-6 w-6 text-primary" />
            </div>
            <DialogTitle className="text-center text-xl">Cloud Share</DialogTitle>
            <DialogDescription className="text-center text-xs">
              Sync your decks & notes across devices
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-6 pb-6">
          <Tabs defaultValue="upload" className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-10 rounded-xl bg-muted/60">
              <TabsTrigger value="upload" className="rounded-lg text-xs">
                <Upload className="h-3.5 w-3.5 mr-1.5" />Upload
              </TabsTrigger>
              <TabsTrigger value="search" className="rounded-lg text-xs">
                <Download className="h-3.5 w-3.5 mr-1.5" />Download
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="space-y-4 mt-5">
              <div className="space-y-1.5">
                <Label htmlFor="username" className="text-xs text-muted-foreground">Your username</Label>
                <Input
                  id="username"
                  placeholder="e.g. kamoliddin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="rounded-xl h-11 bg-muted/40 border-border/60"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="set-select" className="text-xs text-muted-foreground">Pick a deck</Label>
                <select
                  id="set-select"
                  className="flex h-11 w-full rounded-xl border border-border/60 bg-muted/40 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  value={selectedSet}
                  onChange={(e) => setSelectedSet(e.target.value)}
                >
                  <option value="">Choose a deck…</option>
                  {vocabSets.map(set => (
                    <option key={set.id} value={set.id}>
                      {set.name} · {set.words.length} cards
                    </option>
                  ))}
                </select>
              </div>

              <Button
                onClick={handleUpload}
                disabled={isUploading || !username || !selectedSet}
                className="w-full h-11 rounded-xl"
              >
                {isUploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                Upload deck
              </Button>

              <div className="pt-4 border-t border-border/60">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm font-medium">My Notes</p>
                    <p className="text-xs text-muted-foreground">{documents.length} document{documents.length === 1 ? '' : 's'}</p>
                  </div>
                  <Button
                    onClick={handleUploadNotes}
                    disabled={isUploading || !username || !documents.length}
                    variant="outline"
                    size="sm"
                    className="rounded-lg"
                  >
                    {isUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><Upload className="h-3.5 w-3.5 mr-1.5" />Upload</>}
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="search" className="space-y-4 mt-5">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Search by username</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter username…"
                    value={searchUsername}
                    onChange={(e) => setSearchUsername(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="rounded-xl h-11 bg-muted/40 border-border/60"
                  />
                  <Button onClick={handleSearch} disabled={isSearching} className="rounded-xl h-11 px-4">
                    {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {searchResults.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      {searchResults.length} item{searchResults.length === 1 ? '' : 's'}
                    </p>
                    <Button onClick={handleImportAll} variant="ghost" size="sm" className="h-8 text-xs">
                      <Download className="h-3.5 w-3.5 mr-1.5" />Add all decks
                    </Button>
                  </div>

                  <ScrollArea className="h-[260px] -mx-1 px-1">
                    <div className="space-y-2">
                      {searchResults.map((cloudSet) => {
                        const isNotes = isNotesCloudSet(cloudSet);
                        const itemCount = Array.isArray(cloudSet.data) ? cloudSet.data.length : 0;
                        return (
                          <div
                            key={cloudSet.id}
                            className="flex items-center justify-between p-3 rounded-xl bg-muted/40 hover:bg-muted/70 transition-colors"
                          >
                            <div className="min-w-0">
                              <p className="font-medium text-sm truncate">{cloudSet.set_name}</p>
                              <p className="text-xs text-muted-foreground">
                                {itemCount} {isNotes ? 'notes' : 'cards'}
                              </p>
                            </div>
                            <Button
                              onClick={() => (isNotes ? importNotesFromCloud(cloudSet) : handleImportSet(cloudSet))}
                              size="sm"
                              variant="ghost"
                              className="h-8 rounded-lg shrink-0"
                            >
                              <Download className="h-3.5 w-3.5 mr-1.5" />
                              Add
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
        </div>
      </DialogContent>
    </Dialog>
  );
};
