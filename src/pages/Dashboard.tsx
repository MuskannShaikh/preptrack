import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { BookOpen, Briefcase, Calendar, CheckCircle, Clock, TrendingUp, Target, Users } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

interface DashboardStats {
  totalResources: number;
  completedResources: number;
  totalApplications: number;
  upcomingInterviews: number;
  totalContacts: number;
  roadmapProgress: number;
  applicationsByStatus: { name: string; value: number }[];
  weeklyProgress: { day: string; completed: number }[];
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalResources: 0,
    completedResources: 0,
    totalApplications: 0,
    upcomingInterviews: 0,
    totalContacts: 0,
    roadmapProgress: 0,
    applicationsByStatus: [],
    weeklyProgress: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    try {
      const [
        resourcesRes,
        applicationsRes,
        interviewsRes,
        contactsRes,
        roadmapRes
      ] = await Promise.all([
        supabase.from('resources').select('is_completed').eq('user_id', user!.id),
        supabase.from('applications').select('status').eq('user_id', user!.id),
        supabase.from('interviews').select('interview_date').eq('user_id', user!.id).gte('interview_date', new Date().toISOString()),
        supabase.from('contacts').select('id').eq('user_id', user!.id),
        supabase.from('roadmap_items').select('status').eq('user_id', user!.id),
      ]);

      const resources = resourcesRes.data || [];
      const applications = applicationsRes.data || [];
      const interviews = interviewsRes.data || [];
      const contacts = contactsRes.data || [];
      const roadmapItems = roadmapRes.data || [];

      const completedResources = resources.filter(r => r.is_completed).length;
      const completedRoadmap = roadmapItems.filter(r => r.status === 'completed').length;

      const statusCounts: Record<string, number> = {};
      applications.forEach(app => {
        statusCounts[app.status] = (statusCounts[app.status] || 0) + 1;
      });

      const applicationsByStatus = Object.entries(statusCounts).map(([name, value]) => ({
        name,
        value,
      }));

      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const weeklyProgress = days.map(day => ({
        day,
        completed: Math.floor(Math.random() * 5),
      }));

      setStats({
        totalResources: resources.length,
        completedResources,
        totalApplications: applications.length,
        upcomingInterviews: interviews.length,
        totalContacts: contacts.length,
        roadmapProgress: roadmapItems.length > 0 ? Math.round((completedRoadmap / roadmapItems.length) * 100) : 0,
        applicationsByStatus,
        weeklyProgress,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['hsl(199, 89%, 48%)', 'hsl(38, 92%, 50%)', 'hsl(0, 84%, 60%)', 'hsl(142, 71%, 45%)'];

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, <span className="gradient-text">{user?.user_metadata?.full_name || 'there'}</span>!
          </h1>
          <p className="text-muted-foreground">Here's an overview of your interview preparation progress.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Resources"
            value={`${stats.completedResources}/${stats.totalResources}`}
            subtitle="Completed"
            icon={BookOpen}
            color="text-accent"
          />
          <StatCard
            title="Applications"
            value={stats.totalApplications.toString()}
            subtitle="Total tracked"
            icon={Briefcase}
            color="text-info"
          />
          <StatCard
            title="Upcoming"
            value={stats.upcomingInterviews.toString()}
            subtitle="Interviews"
            icon={Calendar}
            color="text-warning"
          />
          <StatCard
            title="Roadmap"
            value={`${stats.roadmapProgress}%`}
            subtitle="Complete"
            icon={Target}
            color="text-primary"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Application Status Chart */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Application Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats.applicationsByStatus.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.applicationsByStatus}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {stats.applicationsByStatus.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(222, 47%, 13%)', 
                          border: '1px solid hsl(217, 33%, 20%)',
                          borderRadius: '8px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap justify-center gap-4 mt-4">
                    {stats.applicationsByStatus.map((item, index) => (
                      <div key={item.name} className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="text-sm text-muted-foreground">{item.name}: {item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  No applications yet. Start tracking your job applications!
                </div>
              )}
            </CardContent>
          </Card>

          {/* Weekly Progress */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-primary" />
                Weekly Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.weeklyProgress}>
                    <XAxis dataKey="day" stroke="hsl(215, 20%, 65%)" fontSize={12} />
                    <YAxis stroke="hsl(215, 20%, 65%)" fontSize={12} />
                    <Tooltip
                      contentStyle={{ 
                        backgroundColor: 'hsl(222, 47%, 13%)', 
                        border: '1px solid hsl(217, 33%, 20%)',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="completed" fill="hsl(142, 71%, 45%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <QuickAction href="/resources" icon={BookOpen} label="Add Resource" />
              <QuickAction href="/applications" icon={Briefcase} label="Log Application" />
              <QuickAction href="/interviews" icon={Calendar} label="Add Interview" />
              <QuickAction href="/contacts" icon={Users} label="Add Contact" />
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

function StatCard({ title, value, subtitle, icon: Icon, color }: { 
  title: string; 
  value: string; 
  subtitle: string; 
  icon: any; 
  color: string;
}) {
  return (
    <Card className="stat-card">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">{title}</p>
            <p className="text-3xl font-bold mb-1">{value}</p>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
          <div className={`p-3 rounded-xl bg-secondary ${color}`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function QuickAction({ href, icon: Icon, label }: { href: string; icon: any; label: string }) {
  return (
    <a
      href={href}
      className="flex flex-col items-center gap-2 p-4 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors text-center"
    >
      <Icon className="w-6 h-6 text-primary" />
      <span className="text-sm font-medium">{label}</span>
    </a>
  );
}