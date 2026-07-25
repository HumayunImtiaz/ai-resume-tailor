import Groq from 'groq-sdk';
import { env } from '../config/env';

export const analyzeMatch = async (
  resumeText: string,
  jobText: string,
  links: { text: string; url: string }[] = []
) => {
  try {
    const groq = new Groq({ apiKey: env.groqApiKey });

    const systemPrompt = `You are an expert ATS (Applicant Tracking System) and resume-matching analyst.
Your task is to compare the provided resume text with the job description and rewrite the resume for maximum impact.

Rules for rewriting:
1. Never invent experience, skills, employers, dates, or achievements not present in the original resume text.
2. Reorganize and rephrase existing content to emphasize what's most relevant to the job description — you may reorder bullet points within a section (most relevant first) and reword them using the job description's terminology, but every bullet must trace back to something actually in the original resume.
3. Extract the candidate's actual name and contact info (email, phone, location) exactly as given — do not alter any contact details.
4. Never fabricate a URL. Only use URLs exactly as provided in the links context supplied with the resume. If a label like "GitHub" appears in the resume text but no matching URL was provided, include the label with an empty url (""). Do not invent or guess URLs.

You MUST respond with exactly a valid JSON object and nothing else. Avoid using markdown formatting (like \`\`\`json) or adding any conversational text.
The JSON object must match this structure exactly:
{
  "matchScore": <integer between 0 and 100 representing the match percentage>,
  "missingKeywords": [<array of important skills or terms from the job description missing from the resume>],
  "tailoredResume": {
    "fullName": "<string, extracted from original resume>",
    "title": "<string, a professional title line, e.g. 'Full-Stack Software Engineer' — infer from resume content if not explicit>",
    "contactLine": {
      "email": "<string, extracted from original resume>",
      "phone": "<string, optional, extracted from original resume>",
      "location": "<string, optional, extracted from original resume>",
      "links": [{ "label": "<string, e.g. 'GitHub', 'LinkedIn', 'Portfolio'>", "url": "<exact URL from the provided links array — never fabricate>" }]
    },
    "summary": "<string, 2-4 sentences, rewritten to emphasize fit for this specific job>",
    "skills": [<array of strings, skills grouped or listed, prioritized by relevance to the job description>],
    "experience": [
      {
        "role": "<string>",
        "company": "<string>",
        "dates": "<string>",
        "location": "<string, optional>",
        "bullets": [<array of strings, achievement bullets, reworded/reordered for relevance but factually unchanged>]
      }
    ],
    "education": [
      { "degree": "<string>", "school": "<string>", "dates": "<string>" }
    ],
    "projects": [
      { "name": "<string>", "bullets": [<array of strings>] }
    ],
    "certifications": [<array of strings>]
  }
}`;

    const linksContext = links.length > 0
      ? `\n\nThe candidate's resume contains these hyperlinks (use these exact URLs when referencing GitHub/LinkedIn/Portfolio/etc. in the contactLine.links array — do not invent or alter URLs):\n${JSON.stringify(links)}`
      : '';

    const userPrompt = `Job Description:
${jobText}

Resume:
${resumeText}${linksContext}

Parse the given resume text into the requested structure, using the job description to decide what to emphasize and reorder. Never fabricate missing sections (e.g. if there are no certifications in the original resume, return an empty array, don't invent any). Analyze the match and provide the exact JSON response.`;

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
    const tr = data.tailoredResume;
    if (
      typeof data.matchScore !== 'number' || 
      !Array.isArray(data.missingKeywords) || 
      !tr ||
      typeof tr.fullName !== 'string' ||
      tr.fullName.trim() === '' ||
      typeof tr.summary !== 'string' ||
      tr.summary.trim() === '' ||
      !Array.isArray(tr.experience) ||
      !Array.isArray(tr.skills) ||
      !Array.isArray(tr.education) ||
      !Array.isArray(tr.projects) ||
      !Array.isArray(tr.certifications) ||
      !tr.contactLine ||
      typeof tr.contactLine !== 'object' ||
      typeof tr.contactLine.email !== 'string'
    ) {
      throw new Error('Invalid JSON structure returned by model');
    }

    return {
      success: true,
      data: {
        matchScore: data.matchScore,
        missingKeywords: data.missingKeywords,
        tailoredResume: data.tailoredResume,
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
