import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Plus, Briefcase, ExternalLink, Trash2, Pencil } from 'lucide-react';
import { format } from 'date-fns';

interface Application {
  id: string;
  company: string;
  role: string;
  status: string;
  applied_date: string;
  notes: string | null;
  job_url: string | null;
  salary_range: string | null;
  location: string | null;
}

const statuses = ['Applied', 'Shortlisted', 'Interview', 'Rejected', 'Selected', 'Withdrawn'];

export default function Applications() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<Application | null>(null);

  useEffect(() => {
    if (user) fetchApplications();
  }, [user]);

  const fetchApplications = async () => {
    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .eq('user_id', user!.id)
      .order('applied_date', { ascending: false });

    if (error) {
      toast.error('Failed to fetch applications');
    } else {
      setApplications(data || []);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const appData = {
      user_id: user!.id,
      company: formData.get('company') as string,
      role: formData.get('role') as string,
      status: formData.get('status') as string,
      applied_date: formData.get('date') as string,
      job_url: formData.get('url') as string || null,
      salary_range: formData.get('salary') as string || null,
      location: formData.get('location') as string || null,
      notes: formData.get('notes') as string || null,
    };

    if (editingApp) {
      const { error } = await supabase
        .from('applications')
        .update(appData)
        .eq('id', editingApp.id);

      if (error) {
        toast.error('Failed to update application');
      } else {
        toast.success('Application updated!');
      }
    } else {
      const { error } = await supabase.from('applications').insert(appData);

      if (error) {
        toast.error('Failed to add application');
      } else {
        toast.success('Application added!');
      }
    }

    setDialogOpen(false);
    setEditingApp(null);
    fetchApplications();
  };

  const deleteApplication = async (id: string) => {
    const { error } = await supabase.from('applications').delete().eq('id', id);
    if (error) {
      toast.error('Failed to delete');
    } else {
      toast.success('Application deleted');
      fetchApplications();
    }
  };

  const getStatusClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'applied': return 'status-applied';
      case 'shortlisted': case 'interview': return 'status-shortlisted';
      case 'rejected': case 'withdrawn': return 'status-rejected';
      case 'selected': return 'status-selected';
      default: return 'status-applied';
    }
  };

  const openEdit = (app: Application) => {
    setEditingApp(app);
    setDialogOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Applications</h1>
            <p className="text-muted-foreground">
              Track your job applications • {applications.length} total
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) setEditingApp(null);
          }}>
            <DialogTrigger asChild>
              <Button className="btn-primary">
                <Plus className="w-4 h-4 mr-2" />
                Add Application
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-card max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingApp ? 'Edit Application' : 'Add New Application'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="company">Company</Label>
                    <Input 
                      id="company" 
                      name="company" 
                      required 
                      className="input-field" 
                      defaultValue={editingApp?.company}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Input 
                      id="role" 
                      name="role" 
                      required 
                      className="input-field"
                      defaultValue={editingApp?.role}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select name="status" defaultValue={editingApp?.status || 'Applied'}>
                      <SelectTrigger className="input-field">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statuses.map(s => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date">Applied Date</Label>
                    <Input 
                      id="date" 
                      name="date" 
                      type="date" 
                      required 
                      className="input-field"
                      defaultValue={editingApp?.applied_date || format(new Date(), 'yyyy-MM-dd')}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input 
                      id="location" 
                      name="location" 
                      className="input-field" 
                      placeholder="Remote / City"
                      defaultValue={editingApp?.location || ''}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="salary">Salary Range</Label>
                    <Input 
                      id="salary" 
                      name="salary" 
                      className="input-field" 
                      placeholder="$100k - $150k"
                      defaultValue={editingApp?.salary_range || ''}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="url">Job URL</Label>
                  <Input 
                    id="url" 
                    name="url" 
                    type="url" 
                    className="input-field" 
                    placeholder="https://..."
                    defaultValue={editingApp?.job_url || ''}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea 
                    id="notes" 
                    name="notes" 
                    className="input-field" 
                    placeholder="Any additional notes..."
                    defaultValue={editingApp?.notes || ''}
                  />
                </div>
                <Button type="submit" className="w-full btn-primary">
                  {editingApp ? 'Update Application' : 'Add Application'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : applications.length === 0 ? (
          <Card className="glass-card">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Briefcase className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">No applications yet</p>
              <p className="text-muted-foreground">Start tracking your job applications</p>
            </CardContent>
          </Card>
        ) : (
          <Card className="glass-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-border/50">
                  <TableHead>Company</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Applied</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.map(app => (
                  <TableRow key={app.id} className="border-border/50">
                    <TableCell className="font-medium">{app.company}</TableCell>
                    <TableCell>{app.role}</TableCell>
                    <TableCell>
                      <span className={`status-badge ${getStatusClass(app.status)}`}>
                        {app.status}
                      </span>
                    </TableCell>
                    <TableCell>{format(new Date(app.applied_date), 'MMM d, yyyy')}</TableCell>
                    <TableCell>{app.location || '-'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {app.job_url && (
                          <a
                            href={app.job_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-lg hover:bg-secondary transition-colors"
                          >
                            <ExternalLink className="w-4 h-4 text-muted-foreground" />
                          </a>
                        )}
                        <button
                          onClick={() => openEdit(app)}
                          className="p-2 rounded-lg hover:bg-secondary transition-colors"
                        >
                          <Pencil className="w-4 h-4 text-muted-foreground" />
                        </button>
                        <button
                          onClick={() => deleteApplication(app.id)}
                          className="p-2 rounded-lg hover:bg-destructive/10 transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}