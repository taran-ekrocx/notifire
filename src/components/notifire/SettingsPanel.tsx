'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  Settings,
  Rss,
  Tag,
  Key,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  AlertCircle,
  Loader2,
  RefreshCw,
  Eye,
  EyeOff,
  Download,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface RssSource {
  id: string;
  url: string;
  authority: number;
  isActive: boolean;
  categoryId: string;
  category: { id: string; name: string; label: string; emoji: string; color: string };
}

interface RssCategory {
  id: string;
  name: string;
  label: string;
  emoji: string;
  color: string;
  isActive: boolean;
  rssSources: RssSource[];
}

// ─── Seed Banner ─────────────────────────────────────────────────────────────

function SeedBanner({ onSeeded }: { onSeeded: () => void }) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function seed() {
    setLoading(true);
    try {
      await fetch('/api/admin/seed', { method: 'POST' });
      setDone(true);
      onSeeded();
    } finally {
      setLoading(false);
    }
  }

  if (done) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 p-3 mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 text-sm"
    >
      <AlertCircle className="size-4 text-amber-500 shrink-0" />
      <span className="flex-1 text-amber-700 dark:text-amber-300">
        No categories found in database. Import defaults from the hardcoded config?
      </span>
      <Button size="sm" variant="outline" onClick={seed} disabled={loading} className="shrink-0">
        {loading ? <Loader2 className="size-3.5 animate-spin" /> : <Download className="size-3.5" />}
        Import defaults
      </Button>
    </motion.div>
  );
}

// ─── Categories Tab ───────────────────────────────────────────────────────────

interface CategoryFormState {
  name: string;
  label: string;
  emoji: string;
  color: string;
}

const EMPTY_CAT_FORM: CategoryFormState = { name: '', label: '', emoji: '', color: '#6366f1' };

function CategoriesTab({
  categories,
  onRefresh,
}: {
  categories: RssCategory[];
  onRefresh: () => void;
}) {
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<RssCategory | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RssCategory | null>(null);
  const [form, setForm] = useState<CategoryFormState>(EMPTY_CAT_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function openAdd() {
    setForm(EMPTY_CAT_FORM);
    setError('');
    setAddOpen(true);
  }

  function openEdit(cat: RssCategory) {
    setForm({ name: cat.name, label: cat.label, emoji: cat.emoji, color: cat.color });
    setError('');
    setEditTarget(cat);
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      if (editTarget) {
        const res = await fetch(`/api/admin/categories/${editTarget.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ label: form.label, emoji: form.emoji, color: form.color }),
        });
        if (!res.ok) {
          const d = await res.json();
          throw new Error(d.error || 'Failed to update');
        }
        setEditTarget(null);
      } else {
        const res = await fetch('/api/admin/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
        if (!res.ok) {
          const d = await res.json();
          throw new Error(d.error || 'Failed to create');
        }
        setAddOpen(false);
      }
      onRefresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(cat: RssCategory) {
    await fetch(`/api/admin/categories/${cat.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !cat.isActive }),
    });
    onRefresh();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    await fetch(`/api/admin/categories/${deleteTarget.id}`, { method: 'DELETE' });
    setDeleteTarget(null);
    onRefresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {categories.length} {categories.length === 1 ? 'category' : 'categories'} configured
        </p>
        <Button size="sm" onClick={openAdd} className="gap-1.5">
          <Plus className="size-3.5" />
          Add Category
        </Button>
      </div>

      {categories.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          No categories yet. Import defaults or add one manually.
        </p>
      ) : (
        <div className="grid gap-2">
          {categories.map((cat) => (
            <motion.div
              key={cat.id}
              layout
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 p-3 rounded-lg border border-border/60 bg-card"
            >
              <span className="text-xl">{cat.emoji}</span>
              <div
                className="size-3 rounded-full shrink-0"
                style={{ backgroundColor: cat.color }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{cat.label}</p>
                <p className="text-xs text-muted-foreground">{cat.name} · {cat.rssSources.length} sources</p>
              </div>
              <Switch
                checked={cat.isActive}
                onCheckedChange={() => toggleActive(cat)}
                aria-label={`Toggle ${cat.label}`}
              />
              <Button size="icon" variant="ghost" className="size-7 shrink-0" onClick={() => openEdit(cat)}>
                <Pencil className="size-3.5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="size-7 shrink-0 text-destructive hover:text-destructive"
                onClick={() => setDeleteTarget(cat)}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Category</DialogTitle>
          </DialogHeader>
          <CategoryForm form={form} onChange={setForm} error={error} isEdit={false} />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="size-3.5 animate-spin" />}
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editTarget} onOpenChange={(o) => !o && setEditTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
          </DialogHeader>
          <CategoryForm form={form} onChange={setForm} error={error} isEdit />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditTarget(null)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="size-3.5 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &ldquo;{deleteTarget?.label}&rdquo;?</AlertDialogTitle>
            <AlertDialogDescription>
              This will also delete all RSS sources for this category. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function CategoryForm({
  form,
  onChange,
  error,
  isEdit,
}: {
  form: CategoryFormState;
  onChange: (f: CategoryFormState) => void;
  error: string;
  isEdit: boolean;
}) {
  return (
    <div className="space-y-4 py-2">
      {!isEdit && (
        <div className="space-y-1.5">
          <Label>Name (slug)</Label>
          <Input
            placeholder="e.g. blockchain"
            value={form.name}
            onChange={(e) => onChange({ ...form, name: e.target.value })}
          />
          <p className="text-xs text-muted-foreground">Lowercase, no spaces. Used as the category identifier.</p>
        </div>
      )}
      <div className="space-y-1.5">
        <Label>Display Label</Label>
        <Input
          placeholder="e.g. Blockchain"
          value={form.label}
          onChange={(e) => onChange({ ...form, label: e.target.value })}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Emoji</Label>
          <Input
            placeholder="🔗"
            value={form.emoji}
            onChange={(e) => onChange({ ...form, emoji: e.target.value })}
            className="text-center text-lg"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Color</Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={form.color}
              onChange={(e) => onChange({ ...form, color: e.target.value })}
              className="w-10 h-9 rounded border border-border cursor-pointer bg-transparent"
            />
            <Input
              value={form.color}
              onChange={(e) => onChange({ ...form, color: e.target.value })}
              placeholder="#6366f1"
              className="flex-1 font-mono text-sm"
            />
          </div>
        </div>
      </div>
      {error && (
        <p className="text-sm text-destructive flex items-center gap-1.5">
          <AlertCircle className="size-3.5" />
          {error}
        </p>
      )}
    </div>
  );
}

// ─── RSS Sources Tab ──────────────────────────────────────────────────────────

interface SourceFormState {
  categoryId: string;
  url: string;
}

const EMPTY_SOURCE_FORM: SourceFormState = { categoryId: '', url: '' };

function RssSourcesTab({
  categories,
  onRefresh,
}: {
  categories: RssCategory[];
  onRefresh: () => void;
}) {
  const [filterCat, setFilterCat] = useState('all');
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<RssSource | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RssSource | null>(null);
  const [form, setForm] = useState<SourceFormState>(EMPTY_SOURCE_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const allSources: RssSource[] = categories.flatMap((c) => c.rssSources.map((s) => ({ ...s, category: c })));
  const visible = filterCat === 'all' ? allSources : allSources.filter((s) => s.categoryId === filterCat);

  function openAdd() {
    setForm({ ...EMPTY_SOURCE_FORM, categoryId: filterCat !== 'all' ? filterCat : (categories[0]?.id ?? '') });
    setError('');
    setAddOpen(true);
  }

  function openEdit(src: RssSource) {
    setForm({ categoryId: src.categoryId, url: src.url });
    setError('');
    setEditTarget(src);
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      if (editTarget) {
        const res = await fetch(`/api/admin/rss-sources/${editTarget.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: form.url,
            categoryId: form.categoryId,
          }),
        });
        if (!res.ok) {
          const d = await res.json();
          throw new Error(d.error || 'Failed to update');
        }
        setEditTarget(null);
      } else {
        const res = await fetch('/api/admin/rss-sources', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            categoryId: form.categoryId,
            url: form.url,
          }),
        });
        if (!res.ok) {
          const d = await res.json();
          throw new Error(d.error || 'Failed to create');
        }
        setAddOpen(false);
      }
      onRefresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(src: RssSource) {
    await fetch(`/api/admin/rss-sources/${src.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !src.isActive }),
    });
    onRefresh();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    await fetch(`/api/admin/rss-sources/${deleteTarget.id}`, { method: 'DELETE' });
    setDeleteTarget(null);
    onRefresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <Select value={filterCat} onValueChange={setFilterCat}>
          <SelectTrigger className="w-48 h-8 text-sm">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.emoji} {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2 ml-auto">
          <p className="text-sm text-muted-foreground">{visible.length} sources</p>
          <Button size="sm" onClick={openAdd} className="gap-1.5" disabled={categories.length === 0}>
            <Plus className="size-3.5" />
            Add Source
          </Button>
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          No RSS sources found.
        </p>
      ) : (
        <div className="grid gap-2">
          <AnimatePresence mode="popLayout">
            {visible.map((src) => (
              <motion.div
                key={src.id}
                layout
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="flex items-center gap-3 p-3 rounded-lg border border-border/60 bg-card"
              >
                <span className="text-base">{src.category.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-mono text-foreground truncate">{src.url}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                      {src.category.label}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">
                      authority: {src.authority.toFixed(2)}
                    </span>
                  </div>
                </div>
                <Switch
                  checked={src.isActive}
                  onCheckedChange={() => toggleActive(src)}
                  aria-label="Toggle source"
                />
                <Button size="icon" variant="ghost" className="size-7 shrink-0" onClick={() => openEdit(src)}>
                  <Pencil className="size-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-7 shrink-0 text-destructive hover:text-destructive"
                  onClick={() => setDeleteTarget(src)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Add dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add RSS Source</DialogTitle>
          </DialogHeader>
          <SourceForm form={form} onChange={setForm} categories={categories} error={error} />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="size-3.5 animate-spin" />}
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editTarget} onOpenChange={(o) => !o && setEditTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit RSS Source</DialogTitle>
          </DialogHeader>
          <SourceForm form={form} onChange={setForm} categories={categories} error={error} />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditTarget(null)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="size-3.5 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this RSS source?</AlertDialogTitle>
            <AlertDialogDescription className="font-mono text-xs break-all">
              {deleteTarget?.url}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function SourceForm({
  form,
  onChange,
  categories,
  error,
}: {
  form: SourceFormState;
  onChange: (f: SourceFormState) => void;
  categories: RssCategory[];
  error: string;
}) {
  return (
    <div className="space-y-4 py-2">
      <div className="space-y-1.5">
        <Label>Category</Label>
        <Select value={form.categoryId} onValueChange={(v) => onChange({ ...form, categoryId: v })}>
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.emoji} {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label>Feed URL</Label>
        <Input
          placeholder="https://example.com/feed.xml"
          value={form.url}
          onChange={(e) => onChange({ ...form, url: e.target.value })}
          className="font-mono text-sm"
        />
      </div>
      {error && (
        <p className="text-sm text-destructive flex items-center gap-1.5">
          <AlertCircle className="size-3.5" />
          {error}
        </p>
      )}
    </div>
  );
}

// ─── API Settings Tab ─────────────────────────────────────────────────────────

function ApiSettingsTab() {
  const [geminiKey, setGeminiKey] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((r) => r.json())
      .then((d) => {
        setGeminiKey(d.settings?.GEMINI_API_KEY ?? '');
        setLoading(false);
      });
  }, []);

  async function handleSave() {
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ GEMINI_API_KEY: geminiKey }),
      });
      if (!res.ok) throw new Error('Failed to save');
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  const masked = geminiKey ? geminiKey.slice(0, 6) + '•'.repeat(Math.max(0, geminiKey.length - 10)) + geminiKey.slice(-4) : '';

  return (
    <div className="space-y-6 max-w-lg">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Key className="size-4 text-violet-500" />
            Google Gemini API Key
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Used for trend detection, article authentication, and AI summarization. The key stored
            here overrides the environment variable at runtime.
          </p>
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin" />
              Loading…
            </div>
          ) : (
            <>
              <div className="space-y-1.5">
                <Label>API Key</Label>
                <div className="flex gap-2">
                  <Input
                    type={showKey ? 'text' : 'password'}
                    value={geminiKey}
                    onChange={(e) => setGeminiKey(e.target.value)}
                    placeholder="AIzaSy…"
                    className="font-mono text-sm flex-1"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setShowKey((s) => !s)}
                    aria-label={showKey ? 'Hide key' : 'Show key'}
                  >
                    {showKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </Button>
                </div>
                {geminiKey && !showKey && (
                  <p className="text-xs font-mono text-muted-foreground">{masked}</p>
                )}
              </div>

              {error && (
                <p className="text-sm text-destructive flex items-center gap-1.5">
                  <AlertCircle className="size-3.5" />
                  {error}
                </p>
              )}

              <Button onClick={handleSave} disabled={saving || !geminiKey} className="gap-1.5">
                {saving ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : saved ? (
                  <Check className="size-3.5" />
                ) : (
                  <Key className="size-3.5" />
                )}
                {saved ? 'Saved!' : 'Save Key'}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="border-amber-500/20 bg-amber-500/5">
        <CardContent className="pt-4 pb-3">
          <div className="flex gap-2.5 text-xs text-amber-700 dark:text-amber-300">
            <AlertCircle className="size-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold mb-0.5">Important</p>
              <p>
                The key is stored as plain text in the database. For production use, ensure the
                database is properly secured. The environment variable{' '}
                <code className="font-mono bg-amber-500/10 px-1 rounded">GEMINI_API_KEY</code> in{' '}
                <code className="font-mono bg-amber-500/10 px-1 rounded">.env.local</code> serves as
                a fallback when no DB key is set.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Main SettingsPanel ───────────────────────────────────────────────────────

export function SettingsPanel() {
  const [categories, setCategories] = useState<RssCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('categories');

  const loadCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const needsSeed = !loading && categories.length === 0 && activeTab !== 'api';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Settings className="size-5 text-violet-500" />
        <h2 className="text-base font-semibold">Admin Settings</h2>
      </div>

      <Separator />

      {needsSeed && (
        <SeedBanner onSeeded={loadCategories} />
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full sm:w-auto grid grid-cols-3 sm:inline-flex h-9">
          <TabsTrigger value="categories" className="gap-1.5 text-xs sm:text-sm">
            <Tag className="size-3.5" />
            Categories
          </TabsTrigger>
          <TabsTrigger value="rss" className="gap-1.5 text-xs sm:text-sm">
            <Rss className="size-3.5" />
            RSS Sources
          </TabsTrigger>
          <TabsTrigger value="api" className="gap-1.5 text-xs sm:text-sm">
            <Key className="size-3.5" />
            API Keys
          </TabsTrigger>
        </TabsList>

        <TabsContent value="categories" className="mt-4">
          {loading ? (
            <div className="flex items-center gap-2 py-8 justify-center text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Loading categories…
            </div>
          ) : (
            <CategoriesTab categories={categories} onRefresh={loadCategories} />
          )}
        </TabsContent>

        <TabsContent value="rss" className="mt-4">
          {loading ? (
            <div className="flex items-center gap-2 py-8 justify-center text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Loading sources…
            </div>
          ) : (
            <RssSourcesTab categories={categories} onRefresh={loadCategories} />
          )}
        </TabsContent>

        <TabsContent value="api" className="mt-4">
          <ApiSettingsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
