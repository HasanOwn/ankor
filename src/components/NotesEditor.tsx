import { useState } from 'react';
import { X, Upload, Download, Bold, Italic, List, ListOrdered, Underline as UnderlineIcon, AlignLeft, AlignCenter, AlignRight, AlignJustify, FileText, Trash2, Save } from 'lucide-react';
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
import { Color } from '@tiptap/extension-color';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import FontSize from '@tiptap/extension-font-size';
interface NotesEditorProps {
  onClose: () => void;
}
const NotesEditor = ({
  onClose
}: NotesEditorProps) => {
  const [documents, setDocuments] = useLocalStorage<Document[]>('my-documents', []);
  const [currentDoc, setCurrentDoc] = useState<Document | null>(null);
  const [title, setTitle] = useState('');
  const [showNotes, setShowNotes] = useState(false);
  const [viewDoc, setViewDoc] = useState<Document | null>(null);
  const textColors = ['#000000', '#FF0000', '#0000FF', '#00FF00', '#FF6B00'];
  const editor = useEditor({
    extensions: [StarterKit, Underline, TextStyle, Color, FontFamily.configure({
      types: ['textStyle']
    }), FontSize, TextAlign.configure({
      types: ['heading', 'paragraph']
    })],
    content: '',
    editorProps: {
      attributes: {
        class: 'prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[400px] p-4',
        spellcheck: 'false'
      }
    }
  });
  const handleSave = () => {
    if (!editor || !title.trim()) {
      toast.error('Please enter a title');
      return;
    }
    const content = editor.getHTML();
    const now = Date.now();
    const newDoc: Document = currentDoc ? {
      ...currentDoc,
      title,
      content,
      updatedAt: now
    } : {
      id: crypto.randomUUID(),
      title,
      content,
      createdAt: now,
      updatedAt: now
    };
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
    const dataBlob = new Blob([content], {
      type: 'text/html'
    });
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
    reader.onload = e => {
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
    setShowNotes(false);
  };
  const handleDelete = (docId: string) => {
    const updatedDocs = documents.filter(d => d.id !== docId);
    setDocuments(updatedDocs);
    if (currentDoc?.id === docId) {
      setCurrentDoc(null);
      setTitle('');
      editor?.commands.setContent('');
    }
    toast.success('Document deleted! ✅');
  };
  const handleExportDoc = (doc: Document) => {
    const dataBlob = new Blob([doc.content], {
      type: 'text/html'
    });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${doc.title.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.html`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Document exported! ✅');
  };
  return <div className="bg-card border border-border rounded-2xl shadow-2xl max-h-[90vh] flex flex-col w-full max-w-5xl">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h2 className="text-xl font-semibold">📝 Note





      </h2>
        <div className="flex items-center gap-2">
          <label htmlFor="import-doc">
            <Button variant="ghost" size="icon" asChild>
              <span>
                <Upload className="h-5 w-5" />
              </span>
            </Button>
            <input id="import-doc" type="file" accept=".html,.txt" onChange={handleImport} className="hidden" />
          </label>
          <Button variant="ghost" size="icon" onClick={handleExport}>
            <Download className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-4 p-4 min-h-0">
        <div className="flex items-center gap-2">
          <Input placeholder="Document Title" value={title} onChange={e => setTitle(e.target.value)} className="flex-1 h-9" />
          <Button variant="outline" size="sm" onClick={handleSave} className="h-9 w-9 p-0">
            <Save className="h-4 w-4" />
          </Button>
          <Sheet open={showNotes} onOpenChange={setShowNotes}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 h-9">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">My Notes</span>
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>My Documents</SheetTitle>
              </SheetHeader>
              <ScrollArea className="h-[calc(100vh-8rem)] mt-4">
                <div className="flex flex-col gap-2">
                  {documents.length === 0 ? <p className="text-sm text-muted-foreground text-center py-8">No documents yet</p> : documents.map(doc => <div key={doc.id} className="p-3 border border-border rounded-lg hover:bg-accent transition-colors">
                        <div className="flex items-start justify-between gap-2">
                          <button onClick={() => setViewDoc(doc)} className="flex-1 text-left">
                            <p className="font-medium text-sm">{doc.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(doc.updatedAt).toLocaleDateString()}
                            </p>
                          </button>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleExportDoc(doc)}>
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(doc.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>)}
                </div>
              </ScrollArea>
            </SheetContent>
          </Sheet>
        </div>

        <div className="flex flex-wrap items-center gap-1 sm:gap-2 p-2 bg-muted rounded-lg">
          {/* Font Family */}
          <Select value={editor?.getAttributes('textStyle').fontFamily || 'Arial'} onValueChange={value => editor?.chain().focus().setFontFamily(value).run()}>
            <SelectTrigger className="w-[100px] sm:w-[120px] h-8 text-xs sm:text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Arial">Arial</SelectItem>
              <SelectItem value="Times New Roman">Times</SelectItem>
              <SelectItem value="cursive">Cursive</SelectItem>
            </SelectContent>
          </Select>

          {/* Font Size */}
          <Select value={editor?.getAttributes('textStyle').fontSize || '16px'} onValueChange={value => editor?.chain().focus().setFontSize(value).run()}>
            <SelectTrigger className="w-[60px] sm:w-[70px] h-8 text-xs sm:text-sm">
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

          <div className="w-px h-6 bg-border hidden sm:block" />

          {/* Text Formatting */}
          <Button variant="ghost" size="sm" onClick={() => editor?.chain().focus().toggleBold().run()} className={`h-8 w-8 p-0 ${editor?.isActive('bold') ? 'bg-accent' : ''}`}>
            <Bold className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => editor?.chain().focus().toggleItalic().run()} className={`h-8 w-8 p-0 ${editor?.isActive('italic') ? 'bg-accent' : ''}`}>
            <Italic className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => editor?.chain().focus().toggleUnderline().run()} className={`h-8 w-8 p-0 ${editor?.isActive('underline') ? 'bg-accent' : ''}`}>
            <UnderlineIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </Button>

          <div className="w-px h-6 bg-border hidden sm:block" />

          {/* Lists */}
          <Button variant="ghost" size="sm" onClick={() => editor?.chain().focus().toggleBulletList().run()} className={`h-8 w-8 p-0 ${editor?.isActive('bulletList') ? 'bg-accent' : ''}`}>
            <List className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => editor?.chain().focus().toggleOrderedList().run()} className={`h-8 w-8 p-0 ${editor?.isActive('orderedList') ? 'bg-accent' : ''}`}>
            <ListOrdered className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </Button>

          <div className="w-px h-6 bg-border hidden sm:block" />

          {/* Alignment */}
          <Button variant="ghost" size="sm" onClick={() => editor?.chain().focus().setTextAlign('left').run()} className={`h-8 w-8 p-0 ${editor?.isActive({
          textAlign: 'left'
        }) ? 'bg-accent' : ''}`}>
            <AlignLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => editor?.chain().focus().setTextAlign('center').run()} className={`h-8 w-8 p-0 ${editor?.isActive({
          textAlign: 'center'
        }) ? 'bg-accent' : ''}`}>
            <AlignCenter className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => editor?.chain().focus().setTextAlign('right').run()} className={`h-8 w-8 p-0 ${editor?.isActive({
          textAlign: 'right'
        }) ? 'bg-accent' : ''}`}>
            <AlignRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => editor?.chain().focus().setTextAlign('justify').run()} className={`h-8 w-8 p-0 ${editor?.isActive({
          textAlign: 'justify'
        }) ? 'bg-accent' : ''}`}>
            <AlignJustify className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </Button>

          <div className="w-px h-6 bg-border hidden sm:block" />

          {/* Text Colors */}
          <div className="flex items-center gap-1">
            {textColors.map(color => <button key={color} onClick={() => editor?.chain().focus().setColor(color).run()} className={`h-5 w-5 rounded-full border-2 transition-transform hover:scale-110 ${editor?.getAttributes('textStyle').color === color ? 'border-foreground scale-110' : 'border-border'}`} style={{
            backgroundColor: color
          }} aria-label={`Set text color to ${color}`} />)}
          </div>
        </div>

        <div className="flex-1 min-h-0 border border-border rounded-lg overflow-auto bg-background">
          <EditorContent editor={editor} />
        </div>

        {viewDoc && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="bg-card border border-border rounded-3xl shadow-2xl w-full max-w-4xl mx-4 max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <div>
                  <h3 className="text-lg font-semibold">{viewDoc.title}</h3>
                  <p className="text-xs text-muted-foreground">
                    Last updated {new Date(viewDoc.updatedAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      loadDocument(viewDoc);
                      setViewDoc(null);
                    }}
                  >
                    Edit
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setViewDoc(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="flex-1 w-full max-h-[78vh] overflow-y-auto overflow-x-hidden px-6 py-5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                <div
                  className="prose prose-sm dark:prose-invert max-w-none break-words whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(viewDoc.content || '') }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>;
};
export default NotesEditor;