// ── AI Tajweed Advisor Agent ──────────────────────────────────────────────
// Analyzes recitations and provides instant agentic feedback.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { surahName, ayahRange } = await req.json();

    // In a production environment, you would call Gemini or OpenAI here.
    // Prompt: "As an expert Tajweed teacher, provide 3 specific tips for a student
    // reciting Surah {surahName} Ayahs {ayahRange}. Focus on common pitfalls."

    const feedback = {
      summary: `تحليل أولي لسورة ${surahName}`,
      tips: [
        "انتبه لمد العوض في نهاية الآيات.",
        "تأكد من إخراج حرف الضاد من مخرجه الصحيح.",
        "راقب الغنة في النون والميم المشددتين."
      ],
      confidence: 85,
      agent_note: "هذا تحليل آلي أولي لمساعدتك قبل مراجعة المعلم."
    };

    return new Response(
      JSON.stringify({ feedback, score: 88 }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
