'use client';

import { useEffect } from 'react';
import { EditorContent, useEditor, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Heading2,
  Heading3,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Strikethrough,
  Underline as UnderlineIcon,
  Undo2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TermsAndConditionsEditorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

function ToolbarButton({
  editor,
  label,
  active = false,
  onClick,
  children,
}: {
  editor: Editor | null;
  label: string;
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      variant={active ? 'secondary' : 'ghost'}
      size="icon-sm"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={!editor || !editor.isEditable}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}

function ToolbarDivider() {
  return <span aria-hidden="true" className="mx-1 h-6 w-px bg-border" />;
}

export function TermsAndConditionsEditor({ value, onChange, disabled = false }: TermsAndConditionsEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Link.configure({ openOnClick: false }),
    ],
    content: value || '',
    editable: !disabled,
    immediatelyRender: false,
    onUpdate: ({ editor: updatedEditor }) => onChange(updatedEditor.getHTML()),
    editorProps: {
      attributes: {
        class: 'min-h-72 px-4 py-3 text-sm leading-7 outline-none [&_blockquote]:my-3 [&_blockquote]:border-l-2 [&_blockquote]:pl-3 [&_h2]:mb-2 [&_h2]:mt-5 [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:mb-2 [&_h3]:mt-4 [&_h3]:text-lg [&_h3]:font-semibold [&_li]:ml-5 [&_ol]:list-decimal [&_p]:mb-3 [&_ul]:list-disc [&_a]:text-primary [&_a]:underline',
      },
    },
  });

  useEffect(() => {
    if (!editor || editor.isEditable === !disabled) return;
    // `emitUpdate: false` WAJIB — default TipTap memicu event `update`, yang lewat `onUpdate`
    // menimpa nilai form dengan isi editor saat itu. Bila editor dibuat sebelum data Platform
    // termuat, isinya masih kosong, sehingga Terms & Conditions tersimpan sebagai "<p></p>".
    editor.setEditable(!disabled, false);
  }, [disabled, editor]);

  useEffect(() => {
    if (!editor || value === editor.getHTML()) return;
    editor.commands.setContent(value || '', { emitUpdate: false });
  }, [editor, value]);

  function setLink() {
    if (!editor) return;
    const currentHref = editor.getAttributes('link').href as string | undefined;
    const href = window.prompt('URL tautan', currentHref ?? 'https://');
    if (href === null) return;
    const trimmedHref = href.trim();
    if (!trimmedHref) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: trimmedHref }).run();
  }

  return (
    <div className={cn('overflow-hidden rounded-md border bg-background', disabled && 'opacity-70')}>
      <div className="flex flex-wrap items-center gap-0.5 border-b bg-muted/30 p-1" role="toolbar" aria-label="Format konten Terms & Conditions">
        <ToolbarButton editor={editor} label="Tebal" active={editor?.isActive('bold')} onClick={() => editor?.chain().focus().toggleBold().run()}>
          <Bold />
        </ToolbarButton>
        <ToolbarButton editor={editor} label="Miring" active={editor?.isActive('italic')} onClick={() => editor?.chain().focus().toggleItalic().run()}>
          <Italic />
        </ToolbarButton>
        <ToolbarButton editor={editor} label="Garis bawah" active={editor?.isActive('underline')} onClick={() => editor?.chain().focus().toggleUnderline().run()}>
          <UnderlineIcon />
        </ToolbarButton>
        <ToolbarButton editor={editor} label="Coret" active={editor?.isActive('strike')} onClick={() => editor?.chain().focus().toggleStrike().run()}>
          <Strikethrough />
        </ToolbarButton>
        <ToolbarDivider />
        <ToolbarButton editor={editor} label="Heading 2" active={editor?.isActive('heading', { level: 2 })} onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}>
          <Heading2 />
        </ToolbarButton>
        <ToolbarButton editor={editor} label="Heading 3" active={editor?.isActive('heading', { level: 3 })} onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}>
          <Heading3 />
        </ToolbarButton>
        <ToolbarButton editor={editor} label="Daftar bullet" active={editor?.isActive('bulletList')} onClick={() => editor?.chain().focus().toggleBulletList().run()}>
          <List />
        </ToolbarButton>
        <ToolbarButton editor={editor} label="Daftar bernomor" active={editor?.isActive('orderedList')} onClick={() => editor?.chain().focus().toggleOrderedList().run()}>
          <ListOrdered />
        </ToolbarButton>
        <ToolbarButton editor={editor} label="Kutipan" active={editor?.isActive('blockquote')} onClick={() => editor?.chain().focus().toggleBlockquote().run()}>
          <Quote />
        </ToolbarButton>
        <ToolbarDivider />
        <ToolbarButton editor={editor} label="Rata kiri" active={editor?.isActive({ textAlign: 'left' })} onClick={() => editor?.chain().focus().setTextAlign('left').run()}>
          <AlignLeft />
        </ToolbarButton>
        <ToolbarButton editor={editor} label="Rata tengah" active={editor?.isActive({ textAlign: 'center' })} onClick={() => editor?.chain().focus().setTextAlign('center').run()}>
          <AlignCenter />
        </ToolbarButton>
        <ToolbarButton editor={editor} label="Rata kanan" active={editor?.isActive({ textAlign: 'right' })} onClick={() => editor?.chain().focus().setTextAlign('right').run()}>
          <AlignRight />
        </ToolbarButton>
        <ToolbarButton editor={editor} label="Tambah atau ubah tautan" active={editor?.isActive('link')} onClick={setLink}>
          <LinkIcon />
        </ToolbarButton>
        <ToolbarDivider />
        <ToolbarButton editor={editor} label="Urungkan" onClick={() => editor?.chain().focus().undo().run()}>
          <Undo2 />
        </ToolbarButton>
        <ToolbarButton editor={editor} label="Ulangi" onClick={() => editor?.chain().focus().redo().run()}>
          <Redo2 />
        </ToolbarButton>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}