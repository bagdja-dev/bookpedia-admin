'use client';

import { useRef } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

/** Token template SEO Platform/Book (default). */
export const SEO_TOKENS = ['{{title}}', '{{platform}}', '{{library}}', '{{author}}', '{{bookType}}', '{{prefix}}', '{{suffix}}'];

/**
 * Input template SEO dengan tombol sisip token (mis. {{title}}) di posisi kursor — dipakai
 * Default SEO Platform Settings dan SEO halaman list homepage.
 */
export function SeoTemplateField({
  id,
  label,
  value,
  onChange,
  placeholder,
  multiline = false,
  tokens = SEO_TOKENS,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  /** Token yang ditawarkan; default token Platform/Book. */
  tokens?: string[];
}) {
  const fieldRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  function appendToken(token: string) {
    const field = fieldRef.current;
    const start = field?.selectionStart ?? value.length;
    const end = field?.selectionEnd ?? value.length;
    const nextValue = `${value.slice(0, start)}${token}${value.slice(end)}`;
    onChange(nextValue);

    requestAnimationFrame(() => {
      fieldRef.current?.focus();
      const cursor = start + token.length;
      fieldRef.current?.setSelectionRange(cursor, cursor);
    });
  }

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {multiline ? (
        <Textarea
          ref={(node) => {
            fieldRef.current = node;
          }}
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={2}
        />
      ) : (
        <Input
          ref={(node) => {
            fieldRef.current = node;
          }}
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      )}
      <div className="flex flex-wrap gap-1">
        {tokens.map((token) => (
          <Button
            key={token}
            type="button"
            variant="outline"
            size="sm"
            className="h-3.5 px-0.5 font-mono text-[8px] leading-none"
            onClick={() => appendToken(token)}
          >
            {token}
          </Button>
        ))}
      </div>
    </div>
  );
}
