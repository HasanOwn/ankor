import { useState } from 'react';
import { X, Upload, Download, Bold, Italic, List, ListOrdered, Underline as UnderlineIcon, AlignLeft, AlignCenter, AlignRight, Highlighter, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { toast } from 'sonner';
import { VocabSet, Document } from '@/types/word';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Color from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import Highlight from '@tiptap/extension-highlight';
import FontFamily from '@tiptap/extension-font-family';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';

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
      TextStyle,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
      FontFamily.configure({
        types: ['textStyle'],
      }),
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

  const loadDocument = (doc: Document) => {
    setCurrentDoc(doc);
    setTitle(doc.title);
    editor?.commands.setContent(doc.content);
  };

  const getDocumentsFromSet = () => {
    const set = vocabSets.find(s => s.id === selectedSetId);
    return set?.documents || [];
  };

  return (
    <div className="bg-card border border-border rounded-2xl shadow-2xl max-h-[90vh] flex flex-col w-full max-w-7xl">
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

      <div className="flex-1 flex gap-4 min-h-0 p-4">
        {/* Document List Sidebar */}
        <div className="w-64 flex flex-col gap-2">
          <h3 className="font-semibold text-sm">My Documents</h3>
          <ScrollArea className="flex-1 border border-border rounded-lg p-2">
            {selectedSetId && getDocumentsFromSet().map((doc) => (
              <Button
                key={doc.id}
                variant="ghost"
                className="w-full justify-start mb-1 text-left"
                onClick={() => loadDocument(doc)}
              >
                <FileText className="h-4 w-4 mr-2" />
                <span className="truncate">{doc.title}</span>
              </Button>
            ))}
            {selectedSetId && getDocumentsFromSet().length === 0 && (
              <p className="text-sm text-muted-foreground p-2">No documents yet</p>
            )}
          </ScrollArea>
        </div>

        {/* Editor Area */}
        <div className="flex-1 flex flex-col gap-4 min-h-0">
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
            {/* Font Family */}
            <Select
              value={editor?.getAttributes('textStyle').fontFamily || 'Arial'}
              onValueChange={(value) => editor?.chain().focus().setFontFamily(value).run()}
            >
              <SelectTrigger className="w-[140px] h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Arial">Arial</SelectItem>
                <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                <SelectItem value="cursive">Cursive</SelectItem>
              </SelectContent>
            </Select>

            {/* Text Formatting */}
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

            {/* Headings */}
            <Select
              value={
                editor?.isActive('heading', { level: 1 }) ? '1' :
                editor?.isActive('heading', { level: 2 }) ? '2' :
                editor?.isActive('heading', { level: 3 }) ? '3' :
                editor?.isActive('heading', { level: 4 }) ? '4' :
                editor?.isActive('heading', { level: 5 }) ? '5' :
                editor?.isActive('heading', { level: 6 }) ? '6' : 'p'
              }
              onValueChange={(value) => {
                if (value === 'p') {
                  editor?.chain().focus().setParagraph().run();
                } else {
                  editor?.chain().focus().toggleHeading({ level: parseInt(value) as 1 | 2 | 3 | 4 | 5 | 6 }).run();
                }
              }}
            >
              <SelectTrigger className="w-[100px] h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="p">Paragraph</SelectItem>
                <SelectItem value="1">Heading 1</SelectItem>
                <SelectItem value="2">Heading 2</SelectItem>
                <SelectItem value="3">Heading 3</SelectItem>
                <SelectItem value="4">Heading 4</SelectItem>
                <SelectItem value="5">Heading 5</SelectItem>
                <SelectItem value="6">Heading 6</SelectItem>
              </SelectContent>
            </Select>

            {/* Text Color */}
            <input
              type="color"
              onInput={(e) => editor?.chain().focus().setColor(e.currentTarget.value).run()}
              value={editor?.getAttributes('textStyle').color || '#000000'}
              className="h-8 w-12 rounded border border-border cursor-pointer"
              title="Text Color"
            />

            {/* Highlight Color */}
            <div className="flex gap-1">
              <input
                type="color"
                onInput={(e) => editor?.chain().focus().toggleHighlight({ color: e.currentTarget.value }).run()}
                className="h-8 w-12 rounded border border-border cursor-pointer"
                title="Highlight Color"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor?.chain().focus().toggleHighlight().run()}
                className={editor?.isActive('highlight') ? 'bg-accent' : ''}
              >
                <Highlighter className="h-4 w-4" />
              </Button>
            </div>

            {/* Lists */}
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

            {/* Alignment */}
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
    </div>
  );
};

export default NotesEditor;
