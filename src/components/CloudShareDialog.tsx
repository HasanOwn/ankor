import { useState } from 'react';
import { Cloud, Upload, Search, Download, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { VocabSet } from '@/types/word';
import { toast } from 'sonner';
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

  const handleUpload = async () => {
    if (!username.trim()) {
      toast.error('Please enter your username');
      return;
    }

    if (!selectedSet) {
      toast.error('Please select a set to upload');
      return;
    }

    const setToUpload = vocabSets.find(s => s.id === selectedSet);
    if (!setToUpload) return;

    setIsUploading(true);
    try {
      const { error } = await supabase
        .from('vocab_sets')
        .insert([{
          username: username.trim().toLowerCase(),
          set_name: setToUpload.name,
          data: setToUpload.words as any
        }]);

      if (error) throw error;

      toast.success(`☁️ "${setToUpload.name}" uploaded successfully!`);
      setSelectedSet('');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload set. Please try again.');
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

      setSearchResults(data || []);
      
      if (!data || data.length === 0) {
        toast.info(`No sets found for "${searchUsername}"`);
      } else {
        toast.success(`📚 Found ${data.length} set(s) from ${searchUsername}!`);
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Failed to search. Please try again.');
    } finally {
      setIsSearching(false);
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
      const newSets: VocabSet[] = searchResults.map(cloudSet => ({
        id: `set-${Date.now()}-${Math.random()}`,
        name: cloudSet.set_name,
        words: cloudSet.data,
        createdAt: Date.now()
      }));

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
                    {searchResults.map((cloudSet) => (
                      <div
                        key={cloudSet.id}
                        className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                      >
                        <div>
                          <p className="font-medium">{cloudSet.set_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {cloudSet.data?.length || 0} words
                          </p>
                        </div>
                        <Button
                          onClick={() => handleImportSet(cloudSet)}
                          variant="ghost"
                          size="sm"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Add
                        </Button>
                      </div>
                    ))}
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
