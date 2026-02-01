import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Plus, History, Calendar, Trash2, Building2, Briefcase } from 'lucide-react';
import { format, isPast, isFuture } from 'date-fns';

interface Interview {
  id: string;
  company: string;
  role: string;
  interview_date: string;
  interview_type: string;
  outcome: string | null;
  notes: string | null;
  feedback: string | null;
}

const interviewTypes = ['Phone Screen', 'Technical', 'System Design', 'Behavioral', 'HR', 'Final Round', 'Other'];
const outcomes = ['Pending', 'Passed', 'Failed', 'On Hold'];

export default function Interviews() {
  const { user } = useAuth();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [view, setView] = useState<'upcoming' | 'past'>('upcoming');

  useEffect(() => {
    if (user) fetchInterviews();
  }, [user]);

  const fetchInterviews = async () => {
    const { data, error } = await supabase
      .from('interviews')
      .select('*')
      .eq('user_id', user!.id)
      .order('interview_date', { ascending: true });

    if (error) {
      toast.error('Failed to fetch interviews');
    } else {
      setInterviews(data || []);
    }
    setLoading(false);
  };

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const dateStr = formData.get('date') as string;
    const timeStr = formData.get('time') as string;

    const { error } = await supabase.from('interviews').insert({
      user_id: user!.id,
      company: formData.get('company') as string,
      role: formData.get('role') as string,
      interview_date: `${dateStr}T${timeStr}:00`,
      interview_type: formData.get('type') as string,
      outcome: formData.get('outcome') as string || null,
      notes: formData.get('notes') as string || null,
    });

    if (error) {
      toast.error('Failed to add interview');
    } else {
      toast.success('Interview added!');
      setDialogOpen(false);
      fetchInterviews();
    }
  };

  const deleteInterview = async (id: string) => {
    const { error } = await supabase.from('interviews').delete().eq('id', id);
    if (error) {
      toast.error('Failed to delete');
    } else {
      toast.success('Interview deleted');
      fetchInterviews();
    }
  };

  const upcomingInterviews = interviews.filter(i => isFuture(new Date(i.interview_date)));
  const pastInterviews = interviews.filter(i => isPast(new Date(i.interview_date)));
  const displayedInterviews = view === 'upcoming' ? upcomingInterviews : pastInterviews;

  const getOutcomeColor = (outcome: string | null) => {
    switch (outcome?.toLowerCase()) {
      case 'passed': return 'status-selected';
      case 'failed': return 'status-rejected';
      case 'on hold': return 'status-shortlisted';
      default: return 'status-applied';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Interview History</h1>
            <p className="text-muted-foreground">
              {upcomingInterviews.length} upcoming • {pastInterviews.length} past
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="btn-primary">
                <Plus className="w-4 h-4 mr-2" />
                Add Interview
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-card">
              <DialogHeader>
                <DialogTitle>Add Interview</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAdd} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="company">Company</Label>
                    <Input id="company" name="company" required className="input-field" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Input id="role" name="role" required className="input-field" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Date</Label>
                    <Input id="date" name="date" type="date" required className="input-field" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="time">Time</Label>
                    <Input id="time" name="time" type="time" required className="input-field" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select name="type" defaultValue="Technical">
                      <SelectTrigger className="input-field">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {interviewTypes.map(t => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Outcome</Label>
                    <Select name="outcome" defaultValue="Pending">
                      <SelectTrigger className="input-field">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {outcomes.map(o => (
                          <SelectItem key={o} value={o}>{o}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea id="notes" name="notes" className="input-field" placeholder="Interview notes..." />
                </div>
                <Button type="submit" className="w-full btn-primary">Add Interview</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* View Toggle */}
        <div className="flex gap-2">
          <Button
            variant={view === 'upcoming' ? 'default' : 'outline'}
            onClick={() => setView('upcoming')}
          >
            Upcoming ({upcomingInterviews.length})
          </Button>
          <Button
            variant={view === 'past' ? 'default' : 'outline'}
            onClick={() => setView('past')}
          >
            Past ({pastInterviews.length})
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : displayedInterviews.length === 0 ? (
          <Card className="glass-card">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <History className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">No {view} interviews</p>
              <p className="text-muted-foreground">Add your interview schedule</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {displayedInterviews.map(interview => (
              <Card key={interview.id} className="glass-card">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{interview.company}</h3>
                        <p className="text-sm text-muted-foreground">{interview.role}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteInterview(interview.id)}
                      className="p-2 rounded-lg hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm mb-3">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span>{format(new Date(interview.interview_date), 'MMM d, yyyy')}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-muted-foreground">
                        {format(new Date(interview.interview_date), 'h:mm a')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="status-badge bg-secondary text-secondary-foreground">
                      {interview.interview_type}
                    </span>
                    {interview.outcome && (
                      <span className={`status-badge ${getOutcomeColor(interview.outcome)}`}>
                        {interview.outcome}
                      </span>
                    )}
                  </div>

                  {interview.notes && (
                    <p className="text-sm text-muted-foreground mt-3 line-clamp-2">{interview.notes}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}