'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Type,
  FileOutput,
  Brain,
  Bot,
  Layers,
  Wrench,
  GitBranch,
  Route,
  Repeat,
  Timer,
  Database,
  Variable,
  FileText,
  Globe,
  Search,
  Braces,
  TextCursor,
  GitMerge,
  ChevronDown,
  Search as SearchIcon,
} from 'lucide-react';
import type { NodeType, NodeCategory } from '@/types/flow';
import { NODE_TEMPLATES } from '@/types/flow';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Type,
  FileOutput,
  Brain,
  Bot,
  Layers,
  Wrench,
  GitBranch,
  Route,
  Repeat,
  Timer,
  Database,
  Variable,
  FileText,
  Globe,
  Search,
  Braces,
  TextCursor,
  GitMerge,
};

const categoryLabels: Record<NodeCategory, string> = {
  input: 'Ввод',
  output: 'Вывод',
  processing: 'Обработка',
  agent: 'Агенты',
  tool: 'Инструменты',
  logic: 'Логика',
  memory: 'Память',
  utility: 'Утилиты',
  data: 'Данные',
};

const categoryOrder: NodeCategory[] = [
  'input',
  'output',
  'processing',
  'agent',
  'tool',
  'logic',
  'memory',
  'data',
  'utility',
];

interface NodePaletteProps {
  onDragStart: (type: NodeType) => void;
}

export function NodePalette({ onDragStart }: NodePaletteProps) {
  const [search, setSearch] = useState('');
  const [openCategories, setOpenCategories] = useState<NodeCategory[]>(categoryOrder);

  const filteredTemplates = NODE_TEMPLATES.filter(
    (template) =>
      template.name.toLowerCase().includes(search.toLowerCase()) ||
      template.description.toLowerCase().includes(search.toLowerCase())
  );

  const groupedTemplates = categoryOrder.reduce((acc, category) => {
    const templates = filteredTemplates.filter((t) => t.category === category);
    if (templates.length > 0) {
      acc[category] = templates;
    }
    return acc;
  }, {} as Record<NodeCategory, typeof NODE_TEMPLATES>);

  const toggleCategory = (category: NodeCategory) => {
    setOpenCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Search */}
      <div className="p-3 border-b">
        <div className="relative">
          <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Поиск узлов..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9"
          />
        </div>
      </div>

      {/* Node List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {Object.entries(groupedTemplates).map(([category, templates]) => (
            <Collapsible
              key={category}
              open={openCategories.includes(category as NodeCategory)}
              onOpenChange={() => toggleCategory(category as NodeCategory)}
            >
              <CollapsibleTrigger className="flex items-center justify-between w-full px-2 py-1.5 text-sm font-medium rounded hover:bg-muted">
                <span>{categoryLabels[category as NodeCategory]}</span>
                <ChevronDown
                  className={cn(
                    'h-4 w-4 transition-transform',
                    openCategories.includes(category as NodeCategory) && 'rotate-180'
                  )}
                />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="grid grid-cols-2 gap-1 mt-1 px-1">
                  {templates.map((template) => {
                    const Icon = iconMap[template.icon] || Type;
                    return (
                      <div
                        key={template.type}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('application/reactflow', template.type);
                          e.dataTransfer.effectAllowed = 'move';
                          onDragStart(template.type);
                        }}
                        className="flex flex-col items-center gap-1 p-2 rounded-lg border cursor-grab hover:bg-muted hover:border-primary/50 transition-colors active:cursor-grabbing"
                      >
                        <div
                          className="flex h-10 w-10 items-center justify-center rounded-lg"
                          style={{ backgroundColor: `${template.color}15` }}
                        >
                          <Icon
                            className="h-5 w-5"
                            style={{ color: template.color }}
                          />
                        </div>
                        <span className="text-xs font-medium text-center">
                          {template.name}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      </ScrollArea>

      {/* Help text */}
      <div className="p-3 border-t text-xs text-muted-foreground">
        <p>Перетащите узлы на холст, чтобы добавить их в поток.</p>
      </div>
    </div>
  );
}
