import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Calendar as CalendarIcon, Clock, Building2 } from 'lucide-react';
import { format, isSameDay, startOfMonth, endOfMonth } from 'date-fns';

interface Interview {
  id: string;
  company: string;
  role: string;
  interview_date: string;
  interview_type: string;
}

export default function Schedule() {
  const { user } = useAuth();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [month, setMonth] = useState<Date>(new Date());

  useEffect(() => {
    if (user) fetchInterviews();
  }, [user, month]);

  const fetchInterviews = async () => {
    const start = startOfMonth(month);
    const end = endOfMonth(month);

    const { data, error } = await supabase
      .from('interviews')
      .select('id, company, role, interview_date, interview_type')
      .eq('user_id', user!.id)
      .gte('interview_date', start.toISOString())
      .lte('interview_date', end.toISOString())
      .order('interview_date', { ascending: true });

    if (error) {
      toast.error('Failed to fetch schedule');
    } else {
      setInterviews(data || []);
    }
    setLoading(false);
  };

  const interviewDates = interviews.map(i => new Date(i.interview_date));
  
  const selectedDayInterviews = selectedDate 
    ? interviews.filter(i => isSameDay(new Date(i.interview_date), selectedDate))
    : [];

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold mb-2">Interview Schedule</h1>
          <p className="text-muted-foreground">View and manage your interview calendar</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <Card className="glass-card lg:col-span-2">
            <CardContent className="p-6">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                month={month}
                onMonthChange={setMonth}
                className="rounded-md"
                modifiers={{
                  hasInterview: interviewDates,
                }}
                modifiersStyles={{
                  hasInterview: {
                    backgroundColor: 'hsl(142, 71%, 45%)',
                    color: 'hsl(222, 47%, 11%)',
                    fontWeight: 'bold',
                    borderRadius: '50%',
                  },
                }}
              />
            </CardContent>
          </Card>

          {/* Selected Day Details */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-primary" />
                {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'Select a date'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                </div>
              ) : selectedDayInterviews.length === 0 ? (
                <div className="text-center py-8">
                  <CalendarIcon className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No interviews scheduled</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedDayInterviews.map(interview => (
                    <div key={interview.id} className="p-4 rounded-lg bg-secondary/50">
                      <div className="flex items-center gap-2 mb-2">
                        <Building2 className="w-4 h-4 text-primary" />
                        <span className="font-medium">{interview.company}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{interview.role}</p>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                          <span>{format(new Date(interview.interview_date), 'h:mm a')}</span>
                        </div>
                        <span className="status-badge bg-primary/20 text-primary">
                          {interview.interview_type}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Upcoming List */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Upcoming Interviews</CardTitle>
          </CardHeader>
          <CardContent>
            {interviews.filter(i => new Date(i.interview_date) > new Date()).length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No upcoming interviews this month</p>
            ) : (
              <div className="space-y-3">
                {interviews
                  .filter(i => new Date(i.interview_date) > new Date())
                  .slice(0, 5)
                  .map(interview => (
                    <div key={interview.id} className="flex items-center justify-between p-4 rounded-lg bg-secondary/30">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex flex-col items-center justify-center">
                          <span className="text-xs text-primary font-medium">
                            {format(new Date(interview.interview_date), 'MMM')}
                          </span>
                          <span className="text-lg font-bold text-primary">
                            {format(new Date(interview.interview_date), 'd')}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-medium">{interview.company}</h4>
                          <p className="text-sm text-muted-foreground">{interview.role}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {format(new Date(interview.interview_date), 'h:mm a')}
                        </p>
                        <span className="text-xs text-muted-foreground">{interview.interview_type}</span>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}