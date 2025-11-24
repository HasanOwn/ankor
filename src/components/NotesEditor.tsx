import { useState } from 'react';
import { X, Upload, Download, Bold, Italic, List, ListOrdered, Underline as UnderlineIcon, AlignLeft, AlignCenter, AlignRight, AlignJustify } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { toast } from 'sonner';
import { Document } from '@/types/word';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import FontFamily from '@tiptap/extension-font-family';
import { TextStyle } from '@tiptap/extension-text-style';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import FontSize from '@tiptap/extension-font-size';

interface NotesEditorProps {
  onClose: () => void;
}

const NotesEditor = ({ onClose }: NotesEditorProps) => {
  const [documents, setDocuments] = useLocalStorage<Document[]>('my-documents', []);
  const [currentDoc, setCurrentDoc] = useState<Document | null>(null);
  const [title, setTitle] = useState('');

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      FontFamily.configure({
        types: ['textStyle'],
      }),
      FontSize,
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

    const content = editor.getHTML();
    const now = Date.now();

    const newDoc: Document = currentDoc
      ? { ...currentDoc, title, content, updatedAt: now }
      : { id: crypto.randomUUID(), title, content, createdAt: now, updatedAt: now };

    const updatedDocs = documents.filter(d => d.id !== newDoc.id);
    updatedDocs.push(newDoc);

    setDocuments(updatedDocs);
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

  return (
    <div className="bg-card border border-border rounded-2xl shadow-2xl max-h-[90vh] flex flex-col w-full max-w-5xl">
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

      <div className="flex-1 flex flex-col gap-4 p-4 min-h-0">
        <Input
          placeholder="Document Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
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

          {/* Font Size */}
          <Select
            value={editor?.getAttributes('textStyle').fontSize || '16px'}
            onValueChange={(value) => editor?.chain().focus().setFontSize(value).run()}
          >
            <SelectTrigger className="w-[80px] h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="12px">12</SelectItem>
              <SelectItem value="14px">14</SelectItem>
              <SelectItem value="16px">16</SelectItem>
              <SelectItem value="18px">18</SelectItem>
              <SelectItem value="20px">20</SelectItem>
              <SelectItem value="24px">24</SelectItem>
              <SelectItem value="32px">32</SelectItem>
            </SelectContent>
          </Select>

          <div className="w-px h-6 bg-border" />

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

          <div className="w-px h-6 bg-border" />

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

          <div className="w-px h-6 bg-border" />

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
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor?.chain().focus().setTextAlign('justify').run()}
            className={editor?.isActive({ textAlign: 'justify' }) ? 'bg-accent' : ''}
          >
            <AlignJustify className="h-4 w-4" />
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
