import { useState, useEffect } from 'react';
import { X, Upload, Download, Bold, Italic, List, ListOrdered, Heading1, Heading2, Code } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface NotesEditorProps {
  onClose: () => void;
}

const NotesEditor = ({ onClose }: NotesEditorProps) => {
  const [notes, setNotes] = useLocalStorage<string>('korean-grammar-notes', '');
  const [currentNote, setCurrentNote] = useState(notes);

  useEffect(() => {
    setCurrentNote(notes);
  }, [notes]);

  const handleSave = () => {
    setNotes(currentNote);
    toast.success('Notes saved! ✅');
  };

  const handleExport = () => {
    const dataBlob = new Blob([currentNote], { type: 'text/markdown' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `korean-grammar-notes-${new Date().toISOString().split('T')[0]}.md`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Notes exported! ✅');
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setCurrentNote(content);
      toast.success('Notes imported! ✅');
    };
    reader.readAsText(file);
  };

  const insertMarkdown = (syntax: string, placeholder: string = '') => {
    const textarea = document.getElementById('notes-textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = currentNote.substring(start, end) || placeholder;
    const beforeText = currentNote.substring(0, start);
    const afterText = currentNote.substring(end);

    let newText = '';
    let cursorOffset = 0;

    switch (syntax) {
      case 'bold':
        newText = `${beforeText}**${selectedText}**${afterText}`;
        cursorOffset = start + 2;
        break;
      case 'italic':
        newText = `${beforeText}*${selectedText}*${afterText}`;
        cursorOffset = start + 1;
        break;
      case 'h1':
        newText = `${beforeText}# ${selectedText}${afterText}`;
        cursorOffset = start + 2;
        break;
      case 'h2':
        newText = `${beforeText}## ${selectedText}${afterText}`;
        cursorOffset = start + 3;
        break;
      case 'ul':
        newText = `${beforeText}- ${selectedText}${afterText}`;
        cursorOffset = start + 2;
        break;
      case 'ol':
        newText = `${beforeText}1. ${selectedText}${afterText}`;
        cursorOffset = start + 3;
        break;
      case 'code':
        newText = `${beforeText}\`${selectedText}\`${afterText}`;
        cursorOffset = start + 1;
        break;
      default:
        return;
    }

    setCurrentNote(newText);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(cursorOffset, cursorOffset + selectedText.length);
    }, 0);
  };

  return (
    <div className="bg-card border border-border rounded-2xl shadow-2xl max-h-[90vh] flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h2 className="text-xl font-semibold">📝 Grammar Notes</h2>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={handleExport}>
            <Download className="h-5 w-5" />
          </Button>
          <label htmlFor="import-notes">
            <Button variant="ghost" size="icon" asChild>
              <span>
                <Upload className="h-5 w-5" />
              </span>
            </Button>
            <input
              id="import-notes"
              type="file"
              accept=".md,.txt"
              onChange={handleImport}
              className="hidden"
            />
          </label>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <Tabs defaultValue="edit" className="flex-1 flex flex-col min-h-0">
        <div className="px-4 pt-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="edit">Edit</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="edit" className="flex-1 flex flex-col min-h-0 mt-0 p-4 space-y-4">
          <div className="flex flex-wrap gap-1 p-2 bg-muted rounded-lg">
            <Button variant="ghost" size="sm" onClick={() => insertMarkdown('bold', 'bold text')}>
              <Bold className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => insertMarkdown('italic', 'italic text')}>
              <Italic className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => insertMarkdown('h1', 'Heading 1')}>
              <Heading1 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => insertMarkdown('h2', 'Heading 2')}>
              <Heading2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => insertMarkdown('ul', 'list item')}>
              <List className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => insertMarkdown('ol', 'list item')}>
              <ListOrdered className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => insertMarkdown('code', 'code')}>
              <Code className="h-4 w-4" />
            </Button>
          </div>

          <Textarea
            id="notes-textarea"
            value={currentNote}
            onChange={(e) => setCurrentNote(e.target.value)}
            placeholder="Start writing your Korean grammar notes here..."
            className="flex-1 min-h-[400px] font-mono text-sm resize-none"
          />

          <div className="flex gap-2">
            <Button onClick={handleSave} className="flex-1 btn-glow">
              Save Notes
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="preview" className="flex-1 min-h-0 mt-0 p-4">
          <div className="h-full overflow-auto prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {currentNote || '*Nothing to preview yet. Switch to Edit tab to start writing.*'}
            </ReactMarkdown>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default NotesEditor;
