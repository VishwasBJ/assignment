import { Injectable } from '@nestjs/common';
import { AiAdapterService } from '../ai-providers/ai-adapter.service';
import { ReviewTemplate } from '@prisma/client';

export interface ReviewIssue {
  line?: number;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  category: string;
  title: string;
  description: string;
  suggestion?: string;
  file?: string;
}

export interface ReviewResult {
  summary: string;
  issues: ReviewIssue[];
  recommendations: string[];
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
}

const SYSTEM_PROMPTS: Record<ReviewTemplate, string> = {
  SECURITY: `You are a senior security engineer performing a thorough security code review.
Focus on:
- Authentication & authorization flaws (broken auth, privilege escalation, IDOR)
- Injection vulnerabilities (SQL injection, XSS, command injection, SSRF)
- Sensitive data exposure (hardcoded secrets, unencrypted PII, insecure storage)
- Insecure dependencies and third-party risks
- Input validation and sanitization issues
- Cryptography misuse
- OWASP Top 10 violations

Respond ONLY with valid JSON matching this schema (no markdown, no extra text):
{
  "summary": "string — 2-3 sentence executive summary",
  "issues": [
    {
      "severity": "CRITICAL|HIGH|MEDIUM|LOW",
      "category": "string — e.g. SQL Injection, XSS, Hardcoded Secret",
      "title": "string — short title",
      "description": "string — what the issue is and why it matters",
      "suggestion": "string — how to fix it",
      "file": "string — filename if identifiable",
      "line": number or null
    }
  ],
  "recommendations": ["string — general recommendation"],
  "severity": "CRITICAL|HIGH|MEDIUM|LOW — overall worst severity found"
}`,

  PERFORMANCE: `You are a performance engineering expert reviewing code for efficiency issues.
Focus on:
- Algorithmic complexity (O(n²) loops, unnecessary iterations)
- Memory leaks and excessive allocations
- N+1 query problems and missing database indexes
- Blocking I/O in async contexts
- Caching opportunities
- Bundle size and lazy loading opportunities
- Unnecessary re-renders (React/frontend)
- Resource cleanup

Respond ONLY with valid JSON matching this schema (no markdown, no extra text):
{
  "summary": "string — 2-3 sentence executive summary",
  "issues": [
    {
      "severity": "CRITICAL|HIGH|MEDIUM|LOW",
      "category": "string — e.g. N+1 Query, Memory Leak, O(n²) Algorithm",
      "title": "string — short title",
      "description": "string — what the performance problem is",
      "suggestion": "string — how to improve it",
      "file": "string — filename if identifiable",
      "line": number or null
    }
  ],
  "recommendations": ["string — general performance recommendation"],
  "severity": "CRITICAL|HIGH|MEDIUM|LOW — overall worst severity found"
}`,

  CODE_QUALITY: `You are a senior software engineer reviewing code for quality, maintainability and best practices.
Focus on:
- Code duplication and DRY violations
- Single responsibility principle violations
- Poor naming (variables, functions, classes)
- Missing or insufficient error handling
- Code complexity (cyclomatic complexity, deep nesting)
- Missing or incorrect TypeScript types
- Dead code and unused imports
- Test coverage gaps
- Documentation and comment quality
- Design pattern misuse or missed opportunities

Respond ONLY with valid JSON matching this schema (no markdown, no extra text):
{
  "summary": "string — 2-3 sentence executive summary",
  "issues": [
    {
      "severity": "CRITICAL|HIGH|MEDIUM|LOW",
      "category": "string — e.g. Code Duplication, Poor Naming, Missing Error Handling",
      "title": "string — short title",
      "description": "string — what the quality issue is",
      "suggestion": "string — how to improve it",
      "file": "string — filename if identifiable",
      "line": number or null
    }
  ],
  "recommendations": ["string — general code quality recommendation"],
  "severity": "CRITICAL|HIGH|MEDIUM|LOW — overall worst severity found"
}`,
};

@Injectable()
export class ReviewEngineService {
  constructor(private aiAdapter: AiAdapterService) {}

  async reviewFiles(
    files: { name: string; path: string; content: string }[],
    template: ReviewTemplate,
    userId: string,
    providerId?: string,
  ): Promise<ReviewResult> {
    const codeBlock = files
      .map(
        (f) =>
          `=== FILE: ${f.path} ===\n\`\`\`\n${f.content.slice(0, 8000)}\n\`\`\``,
      )
      .join('\n\n');

    const userMessage = `Please review the following code:\n\n${codeBlock}`;

    const raw = await this.aiAdapter.complete({
      userId,
      providerId,
      messages: [
        { role: 'system', content: SYSTEM_PROMPTS[template] },
        { role: 'user', content: userMessage },
      ],
      maxTokens: 4096,
      temperature: 0.2,
    });

    return this.parseReviewResponse(raw);
  }

  private parseReviewResponse(raw: string): ReviewResult {
    try {
      // Strip markdown code fences if present
      const cleaned = raw.replace(/^```json\s*/i, '').replace(/\s*```$/, '').trim();
      return JSON.parse(cleaned);
    } catch {
      // If AI returned non-JSON, wrap it
      return {
        summary: raw.slice(0, 500),
        issues: [],
        recommendations: ['Unable to parse structured response from AI provider.'],
        severity: 'LOW',
      };
    }
  }
}
