import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { BarChart3, TrendingUp, Target, Lightbulb, Loader2, Sparkles } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

interface AnalyticsData {
  applicationsByMonth: { month: string; count: number }[];
  resourcesByCategory: { category: string; total: number; completed: number }[];
  interviewOutcomes: { outcome: string; count: number }[];
  progressOverTime: { week: string; tasks: number }[];
}

export default function Analytics() {
  const { user } = useAuth();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiSuggestions, setAiSuggestions] = useState<string>('');
  const [loadingAi, setLoadingAi] = useState(false);

  useEffect(() => {
    if (user) fetchAnalytics();
  }, [user]);

  const fetchAnalytics = async () => {
    try {
      const [applicationsRes, resourcesRes, interviewsRes, roadmapRes] = await Promise.all([
        supabase.from('applications').select('applied_date').eq('user_id', user!.id),
        supabase.from('resources').select('category, is_completed').eq('user_id', user!.id),
        supabase.from('interviews').select('outcome').eq('user_id', user!.id),
        supabase.from('roadmap_items').select('status, created_at').eq('user_id', user!.id),
      ]);

      // Process applications by month
      const monthCounts: Record<string, number> = {};
      (applicationsRes.data || []).forEach(app => {
        const month = new Date(app.applied_date).toLocaleDateString('en-US', { month: 'short' });
        monthCounts[month] = (monthCounts[month] || 0) + 1;
      });
      const applicationsByMonth = Object.entries(monthCounts).map(([month, count]) => ({ month, count }));

      // Process resources by category
      const categoryStats: Record<string, { total: number; completed: number }> = {};
      (resourcesRes.data || []).forEach(r => {
        if (!categoryStats[r.category]) {
          categoryStats[r.category] = { total: 0, completed: 0 };
        }
        categoryStats[r.category].total++;
        if (r.is_completed) categoryStats[r.category].completed++;
      });
      const resourcesByCategory = Object.entries(categoryStats).map(([category, stats]) => ({
        category,
        ...stats,
      }));

      // Process interview outcomes
      const outcomeCounts: Record<string, number> = {};
      (interviewsRes.data || []).forEach(i => {
        const outcome = i.outcome || 'Pending';
        outcomeCounts[outcome] = (outcomeCounts[outcome] || 0) + 1;
      });
      const interviewOutcomes = Object.entries(outcomeCounts).map(([outcome, count]) => ({ outcome, count }));

      // Mock weekly progress
      const progressOverTime = ['W1', 'W2', 'W3', 'W4'].map(week => ({
        week,
        tasks: Math.floor(Math.random() * 10) + 1,
      }));

      setData({
        applicationsByMonth,
        resourcesByCategory,
        interviewOutcomes,
        progressOverTime,
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const getAiSuggestions = async () => {
    setLoadingAi(true);
    try {
      const { data: result, error } = await supabase.functions.invoke('ai-suggestions', {
        body: {
          resourcesByCategory: data?.resourcesByCategory,
          interviewOutcomes: data?.interviewOutcomes,
          applicationCount: data?.applicationsByMonth.reduce((sum, m) => sum + m.count, 0),
        },
      });

      if (error) throw error;
      setAiSuggestions(result.suggestions);
    } catch (error) {
      console.error('Error getting AI suggestions:', error);
      toast.error('Failed to get AI suggestions');
    } finally {
      setLoadingAi(false);
    }
  };

  const COLORS = ['hsl(142, 71%, 45%)', 'hsl(199, 89%, 48%)', 'hsl(38, 92%, 50%)', 'hsl(0, 84%, 60%)'];

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
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Performance Analytics</h1>
            <p className="text-muted-foreground">Track your interview preparation progress</p>
          </div>
          <Button onClick={getAiSuggestions} disabled={loadingAi} className="btn-primary">
            {loadingAi ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            Get AI Suggestions
          </Button>
        </div>

        {/* AI Suggestions */}
        {aiSuggestions && (
          <Card className="glass-card border-primary/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-warning" />
                AI-Powered Suggestions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{aiSuggestions}</p>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Applications Over Time */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Applications Over Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data?.applicationsByMonth.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  No application data yet
                </div>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data?.applicationsByMonth}>
                      <XAxis dataKey="month" stroke="hsl(215, 20%, 65%)" fontSize={12} />
                      <YAxis stroke="hsl(215, 20%, 65%)" fontSize={12} />
                      <Tooltip
                        contentStyle={{ 
                          backgroundColor: 'hsl(222, 47%, 13%)', 
                          border: '1px solid hsl(217, 33%, 20%)',
                          borderRadius: '8px'
                        }}
                      />
                      <Line type="monotone" dataKey="count" stroke="hsl(142, 71%, 45%)" strokeWidth={2} dot={{ fill: 'hsl(142, 71%, 45%)' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Interview Outcomes */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Interview Outcomes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data?.interviewOutcomes.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  No interview data yet
                </div>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data?.interviewOutcomes}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="count"
                        nameKey="outcome"
                      >
                        {data?.interviewOutcomes.map((_, index) => (
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
                    {data?.interviewOutcomes.map((item, index) => (
                      <div key={item.outcome} className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="text-sm text-muted-foreground">{item.outcome}: {item.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Resources by Category */}
          <Card className="glass-card lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                Resources by Category
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data?.resourcesByCategory.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  No resource data yet
                </div>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data?.resourcesByCategory}>
                      <XAxis dataKey="category" stroke="hsl(215, 20%, 65%)" fontSize={12} />
                      <YAxis stroke="hsl(215, 20%, 65%)" fontSize={12} />
                      <Tooltip
                        contentStyle={{ 
                          backgroundColor: 'hsl(222, 47%, 13%)', 
                          border: '1px solid hsl(217, 33%, 20%)',
                          borderRadius: '8px'
                        }}
                      />
                      <Bar dataKey="total" fill="hsl(217, 33%, 30%)" radius={[4, 4, 0, 0]} name="Total" />
                      <Bar dataKey="completed" fill="hsl(142, 71%, 45%)" radius={[4, 4, 0, 0]} name="Completed" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}