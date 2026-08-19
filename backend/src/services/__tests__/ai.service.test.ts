import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockGroqCreate, GroqMock } = vi.hoisted(() => {
  const mockGroqCreate = vi.fn();

  class GroqMock {
    options: { apiKey: string };

    constructor(options: { apiKey: string }) {
      this.options = options;
    }

    chat = {
      completions: {
        create: mockGroqCreate,
      },
    };
  }

  return { mockGroqCreate, GroqMock };
});

vi.mock('groq-sdk', () => ({
  __esModule: true,
  default: GroqMock,
}));

vi.mock('../../config/env', () => ({
  env: {
    groqApiKey: 'test-key',
    groqModel: 'openai/gpt-oss-120b',
  },
}));

vi.mock('../../config/logger', () => ({
  default: {
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

import { analyzeBaseMatch } from '../ai.service';

describe('analyzeBaseMatch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uses the configured Groq model from env', async () => {
    mockGroqCreate.mockResolvedValue({
      choices: [{
        message: {
          content: JSON.stringify({
            initialMatchScore: 82,
            missingSkills: ['Node.js'],
            missingKeywords: ['TypeScript'],
            strengths: ['Leadership'],
            gaps: ['Cloud'],
          }),
        },
      }],
    });

    await analyzeBaseMatch('resume details', 'job description');

    expect(mockGroqCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'openai/gpt-oss-120b',
      })
    );
  });
});
