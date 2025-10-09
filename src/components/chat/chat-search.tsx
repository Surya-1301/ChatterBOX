
'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X, Search as SearchIcon } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

type ChatSearchProps = {
  onSearchChange: (query: string) => void;
  onClose: () => void;
};

export default function ChatSearch({ onSearchChange, onClose }: ChatSearchProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    onSearchChange(e.target.value);
  };

  return (
    <div className="flex items-center gap-2 p-3 border-b bg-secondary">
      <SearchIcon className="h-5 w-5 text-muted-foreground" />
      <Input
        ref={inputRef}
        placeholder="Search in conversation"
        value={query}
        onChange={handleQueryChange}
        className="flex-1 bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0"
      />
      <Button variant="ghost" size="icon" onClick={onClose}>
        <X className="h-5 w-5" />
      </Button>
    </div>
  );
}
