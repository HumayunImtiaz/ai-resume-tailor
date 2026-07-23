import Groq from 'groq-sdk';
import { env } from '../config/env';

export const analyzeMatch = async (resumeText: string, jobText: string) => {
  try {
    const groq = new Groq({ apiKey: env.groqApiKey });

    const systemPrompt = `You are an expert ATS (Applicant Tracking System) and resume-matching analyst.
Your task is to compare the provided resume text with the job description and rewrite the resume for maximum impact.

Rules for rewriting:
1. Never invent experience, skills, employers, dates, or achievements that are not in the original resume.
2. Only rephrase, reorder, and emphasize existing content using language and keywords from the job description.
3. Preserve factual accuracy — this is a hard requirement, not a suggestion.

You MUST respond with exactly a valid JSON object and nothing else. Avoid using markdown formatting (like \`\`\`json) or adding any conversational text.
The JSON object must match this structure exactly:
{
  "matchScore": <integer between 0 and 100 representing the match percentage>,
  "missingKeywords": [<array of important skills or terms from the job description missing from the resume>],
  "tailoredText": "<the rewritten resume text, reframed using the job description's language, with no fabricated content>"
}`;

    const userPrompt = `Job Description:
${jobText}

Resume:
${resumeText}

Analyze the match and provide the exact JSON response.`;

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.2,
      response_format: { type: 'json_object' }, // Force JSON output
    });

    let rawJson = completion.choices[0]?.message?.content || '';

    // Strip out markdown fences defensively
    rawJson = rawJson.replace(/```json/gi, '').replace(/```/g, '').trim();

    const data = JSON.parse(rawJson);

    // Minor validation to ensure we got what we expect
    if (typeof data.matchScore !== 'number' || !Array.isArray(data.missingKeywords) || typeof data.tailoredText !== 'string') {
      throw new Error('Invalid JSON structure returned by model');
    }

    return {
      success: true,
      data: {
        matchScore: data.matchScore,
        missingKeywords: data.missingKeywords,
        tailoredText: data.tailoredText,
      },
    };
  } catch (error) {
    console.error('AI analysis failed:', error);
    return {
      success: false,
      error: 'AI analysis failed',
    };
  }
};
