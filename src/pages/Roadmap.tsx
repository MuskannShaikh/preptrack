import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Plus, Map, CheckCircle, Circle, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

interface RoadmapItem {
  id: string;
  title: string;
  description: string | null;
  target_date: string | null;
  status: string;
  priority: string;
  week_number: number | null;
}

const priorities = ['low', 'medium', 'high'];
const statusOptions = ['pending', 'in_progress', 'completed'];

export default function Roadmap() {
  const { user } = useAuth();
  const [items, setItems] = useState<RoadmapItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (user) fetchItems();
  }, [user]);

  const fetchItems = async () => {
    const { data, error } = await supabase
      .from('roadmap_items')
      .select('*')
      .eq('user_id', user!.id)
      .order('week_number', { ascending: true })
      .order('priority', { ascending: false });

    if (error) {
      toast.error('Failed to fetch roadmap');
    } else {
      setItems(data || []);
    }
    setLoading(false);
  };

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const { error } = await supabase.from('roadmap_items').insert({
      user_id: user!.id,
      title: formData.get('title') as string,
      description: formData.get('description') as string || null,
      target_date: formData.get('date') as string || null,
      priority: formData.get('priority') as string,
      week_number: parseInt(formData.get('week') as string) || null,
    });

    if (error) {
      toast.error('Failed to add item');
    } else {
      toast.success('Item added!');
      setDialogOpen(false);
      fetchItems();
    }
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from('roadmap_items')
      .update({ status })
      .eq('id', id);

    if (error) {
      toast.error('Failed to update');
    } else {
      fetchItems();
    }
  };

  const deleteItem = async (id: string) => {
    const { error } = await supabase.from('roadmap_items').delete().eq('id', id);
    if (error) {
      toast.error('Failed to delete');
    } else {
      toast.success('Item deleted');
      fetchItems();
    }
  };

  const completedCount = items.filter(i => i.status === 'completed').length;
  const progress = items.length > 0 ? (completedCount / items.length) * 100 : 0;

  const groupedByWeek = items.reduce((acc, item) => {
    const week = item.week_number || 0;
    if (!acc[week]) acc[week] = [];
    acc[week].push(item);
    return acc;
  }, {} as Record<number, RoadmapItem[]>);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-destructive';
      case 'medium': return 'text-warning';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Learning Roadmap</h1>
            <p className="text-muted-foreground">Plan and track your preparation journey</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="btn-primary">
                <Plus className="w-4 h-4 mr-2" />
                Add Goal
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-card">
              <DialogHeader>
                <DialogTitle>Add Learning Goal</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAdd} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input id="title" name="title" required className="input-field" placeholder="e.g., Complete Binary Trees" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" name="description" className="input-field" placeholder="Details about this goal..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="week">Week Number</Label>
                    <Input id="week" name="week" type="number" min="1" className="input-field" placeholder="1" />
                  </div>
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select name="priority" defaultValue="medium">
                      <SelectTrigger className="input-field">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {priorities.map(p => (
                          <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Target Date</Label>
                  <Input id="date" name="date" type="date" className="input-field" />
                </div>
                <Button type="submit" className="w-full btn-primary">Add Goal</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Progress Overview */}
        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-medium">Overall Progress</h3>
                <p className="text-sm text-muted-foreground">{completedCount} of {items.length} goals completed</p>
              </div>
              <span className="text-2xl font-bold text-primary">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : items.length === 0 ? (
          <Card className="glass-card">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Map className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">No roadmap items yet</p>
              <p className="text-muted-foreground">Create your learning plan</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedByWeek).sort(([a], [b]) => Number(a) - Number(b)).map(([week, weekItems]) => (
              <Card key={week} className="glass-card">
                <CardHeader>
                  <CardTitle className="text-lg">
                    {week === '0' ? 'Unscheduled' : `Week ${week}`}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {weekItems.map(item => (
                    <div 
                      key={item.id} 
                      className={`flex items-start gap-3 p-3 rounded-lg bg-secondary/30 ${item.status === 'completed' ? 'opacity-60' : ''}`}
                    >
                      <button
                        onClick={() => updateStatus(item.id, item.status === 'completed' ? 'pending' : 'completed')}
                        className="mt-0.5"
                      >
                        {item.status === 'completed' ? (
                          <CheckCircle className="w-5 h-5 text-primary" />
                        ) : (
                          <Circle className="w-5 h-5 text-muted-foreground" />
                        )}
                      </button>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className={`font-medium ${item.status === 'completed' ? 'line-through' : ''}`}>
                            {item.title}
                          </h4>
                          <span className={`text-xs font-medium capitalize ${getPriorityColor(item.priority)}`}>
                            {item.priority}
                          </span>
                        </div>
                        {item.description && (
                          <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                        )}
                        {item.target_date && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Target: {format(new Date(item.target_date), 'MMM d, yyyy')}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => deleteItem(item.id)}
                        className="p-2 rounded-lg hover:bg-destructive/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}