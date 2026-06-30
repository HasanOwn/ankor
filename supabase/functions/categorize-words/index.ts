import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY is not configured');

    const expectedToken = Deno.env.get('CATEGORIZE_CLIENT_TOKEN');
    const providedToken = req.headers.get('x-app-token');
    if (!expectedToken || providedToken !== expectedToken) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { words } = await req.json();
    if (!Array.isArray(words) || words.length === 0) {
      return new Response(JSON.stringify({ error: 'words array required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const items = words.slice(0, 500).map((w: any) => ({
      id: w.id,
      term: w.term ?? w.korean ?? '',
      translation: w.translation ?? w.uzbek ?? w.meaning ?? '',
    }));

    const systemPrompt = `You categorize vocabulary words into a small number of meaningful semantic categories (e.g. "Food", "Animals", "Verbs - Movement", "Family", "Time", "Numbers", "Emotions"). Use 3-12 categories total, in Title Case. Return ALL provided word ids.`;

    const userPrompt = `Categorize these vocabulary words. Each item has an id, the term and its translation. Group semantically. Return via the assign_categories tool.\n\n${JSON.stringify(items)}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'assign_categories',
            description: 'Assign a category to each word.',
            parameters: {
              type: 'object',
              properties: {
                assignments: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'number' },
                      category: { type: 'string' },
                    },
                    required: ['id', 'category'],
                    additionalProperties: false,
                  },
                },
              },
              required: ['assignments'],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: 'function', function: { name: 'assign_categories' } },
      }),
    });

    if (response.status === 429) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded, try again shortly.' }), {
        status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (response.status === 402) {
      return new Response(JSON.stringify({ error: 'AI credits exhausted. Please add credits to your Lovable workspace.' }), {
        status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!response.ok) {
      const txt = await response.text();
      console.error('AI error', response.status, txt);
      throw new Error(`AI gateway error ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    const args = toolCall ? JSON.parse(toolCall.function.arguments) : { assignments: [] };

    return new Response(JSON.stringify({ assignments: args.assignments ?? [] }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('categorize-words error', e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
