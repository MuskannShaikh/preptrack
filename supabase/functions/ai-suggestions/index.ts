import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { resourcesByCategory, interviewOutcomes, applicationCount } = await req.json();

    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Build context for AI
    let context = "Based on the user's interview preparation data:\n\n";
    
    if (resourcesByCategory && resourcesByCategory.length > 0) {
      context += "**Study Resources:**\n";
      resourcesByCategory.forEach((r: { category: string; total: number; completed: number }) => {
        const percentage = r.total > 0 ? Math.round((r.completed / r.total) * 100) : 0;
        context += `- ${r.category}: ${r.completed}/${r.total} completed (${percentage}%)\n`;
      });
      context += "\n";
    }

    if (interviewOutcomes && interviewOutcomes.length > 0) {
      context += "**Interview Outcomes:**\n";
      interviewOutcomes.forEach((o: { outcome: string; count: number }) => {
        context += `- ${o.outcome}: ${o.count} interviews\n`;
      });
      context += "\n";
    }

    if (applicationCount) {
      context += `**Total Applications:** ${applicationCount}\n\n`;
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          {
            role: 'system',
            content: `You are an expert career coach and interview preparation advisor. Analyze the user's interview preparation data and provide 3-5 specific, actionable suggestions to improve their chances of success. Focus on:
1. Identifying weak areas based on resource completion rates
2. Interview performance patterns
3. Application strategy
4. Recommended topics to study
Be concise, encouraging, and specific. Use bullet points.`
          },
          {
            role: 'user',
            content: context + "Please provide personalized suggestions for my interview preparation based on this data."
          }
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('AI API error:', error);
      throw new Error('Failed to get AI response');
    }

    const result = await response.json();
    const suggestions = result.choices?.[0]?.message?.content || 'Unable to generate suggestions at this time.';

    return new Response(
      JSON.stringify({ suggestions }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in ai-suggestions:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});