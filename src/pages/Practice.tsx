import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { FileText, Search, Building2, ChevronDown, ChevronUp, Code, Brain, Database } from 'lucide-react';

interface PastQuestion {
  id: string;
  company: string;
  role: string | null;
  question_text: string;
  answer: string | null;
  category: string;
  difficulty: string;
  year: number | null;
}

interface PracticeTest {
  id: string;
  title: string;
  category: string;
  total_questions: number;
  correct_answers: number;
  time_taken_seconds: number | null;
  completed_at: string | null;
}

const categories = ['DSA', 'System Design', 'CS Fundamentals', 'Behavioral'];

export default function Practice() {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<PastQuestion[]>([]);
  const [tests, setTests] = useState<PracticeTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    const [questionsRes, testsRes] = await Promise.all([
      supabase.from('past_questions').select('*').order('company', { ascending: true }),
      user ? supabase.from('practice_tests').select('*').eq('user_id', user.id).order('created_at', { ascending: false }) : Promise.resolve({ data: [] }),
    ]);

    if (questionsRes.error) {
      toast.error('Failed to fetch questions');
    } else {
      setQuestions(questionsRes.data || []);
    }

    setTests(testsRes.data || []);
    setLoading(false);
  };

  const filteredQuestions = questions.filter(q => {
    const matchesSearch = 
      q.company.toLowerCase().includes(search.toLowerCase()) ||
      q.question_text.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || q.category === filter;
    return matchesSearch && matchesFilter;
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 'text-success';
      case 'medium': return 'text-warning';
      case 'hard': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'DSA': return <Code className="w-4 h-4" />;
      case 'System Design': return <Database className="w-4 h-4" />;
      default: return <Brain className="w-4 h-4" />;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold mb-2">Practice & Past Questions</h1>
          <p className="text-muted-foreground">Prepare with previous interview questions</p>
        </div>

        <Tabs defaultValue="questions" className="space-y-6">
          <TabsList>
            <TabsTrigger value="questions">Past Questions</TabsTrigger>
            <TabsTrigger value="history">Test History</TabsTrigger>
          </TabsList>

          <TabsContent value="questions" className="space-y-6">
            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search questions or companies..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="input-field pl-10"
                />
              </div>
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
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : filteredQuestions.length === 0 ? (
              <Card className="glass-card">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="w-12 h-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium mb-2">No questions found</p>
                  <p className="text-muted-foreground">Try a different search or filter</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredQuestions.map(question => (
                  <Card key={question.id} className="glass-card">
                    <CardContent className="p-0">
                      <button
                        onClick={() => setExpandedQuestion(expandedQuestion === question.id ? null : question.id)}
                        className="w-full p-4 text-left flex items-start justify-between"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Building2 className="w-4 h-4 text-primary" />
                            <span className="font-medium">{question.company}</span>
                            {question.role && (
                              <span className="text-sm text-muted-foreground">• {question.role}</span>
                            )}
                            {question.year && (
                              <span className="text-sm text-muted-foreground">• {question.year}</span>
                            )}
                          </div>
                          <p className="text-sm line-clamp-2">{question.question_text}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="status-badge bg-secondary text-secondary-foreground flex items-center gap-1">
                              {getCategoryIcon(question.category)}
                              {question.category}
                            </span>
                            <span className={`text-xs font-medium ${getDifficultyColor(question.difficulty)}`}>
                              {question.difficulty}
                            </span>
                          </div>
                        </div>
                        {expandedQuestion === question.id ? (
                          <ChevronUp className="w-5 h-5 text-muted-foreground ml-4 flex-shrink-0" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-muted-foreground ml-4 flex-shrink-0" />
                        )}
                      </button>
                      
                      {expandedQuestion === question.id && question.answer && (
                        <div className="px-4 pb-4 pt-0 border-t border-border/50 mt-2">
                          <h4 className="font-medium mb-2 mt-4">Answer / Solution</h4>
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{question.answer}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            {tests.length === 0 ? (
              <Card className="glass-card">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="w-12 h-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium mb-2">No practice tests yet</p>
                  <p className="text-muted-foreground">Your test history will appear here</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tests.map(test => (
                  <Card key={test.id} className="glass-card">
                    <CardContent className="p-5">
                      <h3 className="font-semibold mb-2">{test.title}</h3>
                      <p className="text-sm text-muted-foreground mb-3">{test.category}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold text-primary">
                          {test.correct_answers}/{test.total_questions}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {Math.round((test.correct_answers / test.total_questions) * 100)}%
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}