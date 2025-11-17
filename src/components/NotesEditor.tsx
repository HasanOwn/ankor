import { useState, useEffect } from 'react';
import { X, Upload, Download, Bold, Italic, List, ListOrdered, Heading1, Heading2, Underline as UnderlineIcon, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { toast } from 'sonner';
import { VocabSet, Document } from '@/types/word';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface NotesEditorProps {
  onClose: () => void;
}

const NotesEditor = ({ onClose }: NotesEditorProps) => {
  const [vocabSets, setVocabSets] = useLocalStorage<VocabSet[]>('vocab-sets', []);
  const [currentDoc, setCurrentDoc] = useState<Document | null>(null);
  const [title, setTitle] = useState('');
  const [selectedSetId, setSelectedSetId] = useState<string>('');

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[400px] p-4',
      },
    },
  });

  const handleSave = () => {
    if (!editor || !title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    if (!selectedSetId) {
      toast.error('Please select a set');
      return;
    }

    const content = editor.getHTML();
    const now = Date.now();

    const newDoc: Document = currentDoc
      ? { ...currentDoc, title, content, updatedAt: now }
      : { id: crypto.randomUUID(), title, content, createdAt: now, updatedAt: now };

    const updatedSets = vocabSets.map(set => {
      if (set.id === selectedSetId) {
        const existingDocs = set.documents || [];
        const docIndex = existingDocs.findIndex(d => d.id === newDoc.id);
        
        if (docIndex >= 0) {
          existingDocs[docIndex] = newDoc;
        } else {
          existingDocs.push(newDoc);
        }

        return { ...set, documents: existingDocs };
      }
      return set;
    });

    setVocabSets(updatedSets);
    setCurrentDoc(newDoc);
    toast.success('Document saved! ✅');
  };

  const handleExport = () => {
    if (!editor || !title) {
      toast.error('Please create a document first');
      return;
    }

    const content = editor.getHTML();
    const dataBlob = new Blob([content], { type: 'text/html' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.html`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Document exported! ✅');
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      editor?.commands.setContent(content);
      toast.success('Document imported! ✅');
    };
    reader.readAsText(file);
  };

  return (
    <div className="bg-card border border-border rounded-2xl shadow-2xl max-h-[90vh] flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h2 className="text-xl font-semibold">📝 Document Editor</h2>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={handleExport}>
            <Download className="h-5 w-5" />
          </Button>
          <label htmlFor="import-doc">
            <Button variant="ghost" size="icon" asChild>
              <span>
                <Upload className="h-5 w-5" />
              </span>
            </Button>
            <input
              id="import-doc"
              type="file"
              accept=".html,.txt"
              onChange={handleImport}
              className="hidden"
            />
          </label>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0 p-4 space-y-4">
        <div className="flex gap-4">
          <Input
            placeholder="Document Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="flex-1"
          />
          <Select value={selectedSetId} onValueChange={setSelectedSetId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select a set" />
            </SelectTrigger>
            <SelectContent>
              {vocabSets.map(set => (
                <SelectItem key={set.id} value={set.id}>
                  {set.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap gap-1 p-2 bg-muted rounded-lg">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor?.chain().focus().toggleBold().run()}
            className={editor?.isActive('bold') ? 'bg-accent' : ''}
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor?.chain().focus().toggleItalic().run()}
            className={editor?.isActive('italic') ? 'bg-accent' : ''}
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor?.chain().focus().toggleUnderline().run()}
            className={editor?.isActive('underline') ? 'bg-accent' : ''}
          >
            <UnderlineIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
            className={editor?.isActive('heading', { level: 1 }) ? 'bg-accent' : ''}
          >
            <Heading1 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
            className={editor?.isActive('heading', { level: 2 }) ? 'bg-accent' : ''}
          >
            <Heading2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
            className={editor?.isActive('bulletList') ? 'bg-accent' : ''}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
            className={editor?.isActive('orderedList') ? 'bg-accent' : ''}
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor?.chain().focus().setTextAlign('left').run()}
            className={editor?.isActive({ textAlign: 'left' }) ? 'bg-accent' : ''}
          >
            <AlignLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor?.chain().focus().setTextAlign('center').run()}
            className={editor?.isActive({ textAlign: 'center' }) ? 'bg-accent' : ''}
          >
            <AlignCenter className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor?.chain().focus().setTextAlign('right').run()}
            className={editor?.isActive({ textAlign: 'right' }) ? 'bg-accent' : ''}
          >
            <AlignRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 min-h-0 border border-border rounded-lg overflow-auto bg-background">
          <EditorContent editor={editor} />
        </div>

        <Button onClick={handleSave} className="w-full btn-glow">
          Save Document
        </Button>
      </div>
    </div>
  );
};

export default NotesEditor;
