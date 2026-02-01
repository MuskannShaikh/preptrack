import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Plus, ExternalLink, Trash2, BookOpen, Video, FileText, Link2 } from 'lucide-react';

interface Resource {
  id: string;
  title: string;
  url: string | null;
  category: string;
  resource_type: string;
  notes: string | null;
  is_completed: boolean;
  created_at: string;
}

const categories = ['DSA', 'System Design', 'CS Fundamentals', 'Behavioral', 'Language Specific', 'Other'];
const resourceTypes = ['article', 'video', 'course', 'book', 'documentation'];

export default function Resources() {
  const { user } = useAuth();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    if (user) fetchResources();
  }, [user]);

  const fetchResources = async () => {
    const { data, error } = await supabase
      .from('resources')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to fetch resources');
    } else {
      setResources(data || []);
    }
    setLoading(false);
  };

  const handleAddResource = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const { error } = await supabase.from('resources').insert({
      user_id: user!.id,
      title: formData.get('title') as string,
      url: formData.get('url') as string || null,
      category: formData.get('category') as string,
      resource_type: formData.get('type') as string,
      notes: formData.get('notes') as string || null,
    });

    if (error) {
      toast.error('Failed to add resource');
    } else {
      toast.success('Resource added!');
      setDialogOpen(false);
      fetchResources();
    }
  };

  const toggleComplete = async (id: string, completed: boolean) => {
    const { error } = await supabase
      .from('resources')
      .update({ is_completed: !completed })
      .eq('id', id);

    if (error) {
      toast.error('Failed to update');
    } else {
      fetchResources();
    }
  };

  const deleteResource = async (id: string) => {
    const { error } = await supabase.from('resources').delete().eq('id', id);
    if (error) {
      toast.error('Failed to delete');
    } else {
      toast.success('Resource deleted');
      fetchResources();
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="w-4 h-4" />;
      case 'article': return <FileText className="w-4 h-4" />;
      case 'course': return <BookOpen className="w-4 h-4" />;
      default: return <Link2 className="w-4 h-4" />;
    }
  };

  const filteredResources = filter === 'all' 
    ? resources 
    : resources.filter(r => r.category === filter);

  const completedCount = resources.filter(r => r.is_completed).length;

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Resources</h1>
            <p className="text-muted-foreground">
              Track your preparation materials • {completedCount}/{resources.length} completed
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="btn-primary">
                <Plus className="w-4 h-4 mr-2" />
                Add Resource
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-card">
              <DialogHeader>
                <DialogTitle>Add New Resource</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddResource} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input id="title" name="title" required className="input-field" placeholder="e.g., Neetcode 150" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="url">URL (optional)</Label>
                  <Input id="url" name="url" type="url" className="input-field" placeholder="https://..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select name="category" defaultValue="DSA">
                      <SelectTrigger className="input-field">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(cat => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select name="type" defaultValue="article">
                      <SelectTrigger className="input-field">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {resourceTypes.map(type => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (optional)</Label>
                  <Textarea id="notes" name="notes" className="input-field" placeholder="Key takeaways..." />
                </div>
                <Button type="submit" className="w-full btn-primary">Add Resource</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filter */}
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            All
          </Button>
          {categories.map(cat => (
            <Button
              key={cat}
              variant={filter === cat ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(cat)}
            >
              {cat}
            </Button>
          ))}
        </div>

        {/* Resources Grid */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : filteredResources.length === 0 ? (
          <Card className="glass-card">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookOpen className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">No resources yet</p>
              <p className="text-muted-foreground mb-4">Start adding your study materials</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredResources.map(resource => (
              <Card key={resource.id} className={`glass-card transition-all ${resource.is_completed ? 'opacity-70' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={resource.is_completed}
                      onCheckedChange={() => toggleComplete(resource.id, resource.is_completed)}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {getTypeIcon(resource.resource_type)}
                        <h3 className={`font-medium truncate ${resource.is_completed ? 'line-through' : ''}`}>
                          {resource.title}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="status-badge bg-primary/20 text-primary">{resource.category}</span>
                        <span className="text-xs text-muted-foreground">{resource.resource_type}</span>
                      </div>
                      {resource.notes && (
                        <p className="text-sm text-muted-foreground line-clamp-2">{resource.notes}</p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      {resource.url && (
                        <a
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-lg hover:bg-secondary transition-colors"
                        >
                          <ExternalLink className="w-4 h-4 text-muted-foreground" />
                        </a>
                      )}
                      <button
                        onClick={() => deleteResource(resource.id)}
                        className="p-2 rounded-lg hover:bg-destructive/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}