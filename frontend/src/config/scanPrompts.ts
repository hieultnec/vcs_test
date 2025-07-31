import { Shield, Bug, Code, Search } from "lucide-react";

// Jinja2 template for User Story
export const userStoryTemplate = `
Scan the given source code for security vulnerabilities, especially those from the OWASP Top 10 list.

In addition, consider the following User Story and check if the implementation meets its intent and does not introduce security risks or logic flaws.

User Story:
"{{ prompt }}"

For any issue or vulnerability (security or logic), return the following information:
- Bug summary (short name)
- Description (root cause, possible impact)
- Severity (Low | Medium | High | Critical)
- Status (default: 'open')
- Code line(s)
- Code path or file path
- If related to the User Story, briefly explain the connection

Output format (valid JSON only):
{
  "bugs": [
    {
      "summary": "string",
      "description": "string",
      "severity": "string",
      "status": "string (optional, default: 'open')",
      "created_by": "string (optional, default: 'system')"
    }
  ]
}
Return only this JSON object in your response.`;

// Security Scan Template
export const securityScanTemplate = `
Perform a comprehensive security scan of the provided source code focusing on:

1. OWASP Top 10 vulnerabilities
2. Authentication and authorization flaws
3. Input validation issues
4. SQL injection and XSS vulnerabilities
5. Insecure data handling
6. Cryptographic weaknesses
7. Session management issues

Analyze the following code:
"{{ prompt }}"

For each security vulnerability found, provide:
- Bug summary (concise vulnerability name)
- Description (detailed explanation of the security risk)
- Severity (Low | Medium | High | Critical)
- Status (default: 'open')
- Affected code lines
- File path
- Recommended security fix

Output format (valid JSON only):
{
  "bugs": [
    {
      "summary": "string",
      "description": "string",
      "severity": "string",
      "status": "string (optional, default: 'open')",
      "created_by": "string (optional, default: 'security_scanner')"
    }
  ]
}
Return only this JSON object in your response.`;

// Code Quality Scan Template
export const codeQualityScanTemplate = `
Analyze the provided source code for quality issues and best practices violations:

1. Code complexity and maintainability
2. Performance bottlenecks
3. Memory leaks and resource management
4. Error handling patterns
5. Code duplication
6. Design pattern violations
7. Naming conventions and readability

Code to analyze:
"{{ prompt }}"

For each quality issue found, provide:
- Bug summary (brief issue description)
- Description (impact on code quality and maintainability)
- Severity (Low | Medium | High | Critical)
- Status (default: 'open')
- Code location
- File path
- Improvement suggestions

Output format (valid JSON only):
{
  "bugs": [
    {
      "summary": "string",
      "description": "string",
      "severity": "string",
      "status": "string (optional, default: 'open')",
      "created_by": "string (optional, default: 'quality_scanner')"
    }
  ]
}
Return only this JSON object in your response.`;

// Bug Fix Generator Template
export const bugFixTemplate = `
Generate automated fixes for the following bug report:

Bug Details:
"{{ prompt }}"

Provide a comprehensive fix solution including:
1. Root cause analysis
2. Step-by-step fix implementation
3. Code changes with before/after examples
4. Testing recommendations
5. Prevention strategies

Output format (valid JSON only):
{
  "fixes": [
    {
      "summary": "Fix for [bug summary]",
      "description": "Detailed fix implementation steps",
      "code_changes": "Before and after code examples",
      "testing_steps": "How to test the fix",
      "prevention": "How to prevent similar issues",
      "priority": "string (Low | Medium | High | Critical)"
    }
  ]
}
Return only this JSON object in your response.`;

// Security Fix Generator Template
export const securityFixTemplate = `
Generate security-focused fixes for the following vulnerability:

Security Issue:
"{{ prompt }}"

Provide a security-hardened solution including:
1. Vulnerability assessment
2. Security fix implementation
3. Secure code examples
4. Security testing procedures
5. Compliance considerations
6. Additional security measures

Output format (valid JSON only):
{
  "security_fixes": [
    {
      "summary": "Security fix for [vulnerability]",
      "description": "Detailed security fix implementation",
      "secure_code": "Secure code implementation examples",
      "security_testing": "Security testing procedures",
      "compliance_notes": "Relevant security standards",
      "additional_measures": "Extra security recommendations",
      "risk_level": "string (Low | Medium | High | Critical)"
    }
  ]
}
Return only this JSON object in your response.`;

export const scanPrompts = [
  {
    id: 'user-story',
    title: 'User Story Analysis',
    description: 'Analyze code based on user story template',
    icon: Code,
    prompt: userStoryTemplate
  },
  {
    id: 'security-scan',
    title: 'Security Vulnerability Scan',
    description: 'Comprehensive security analysis focusing on OWASP Top 10',
    icon: Shield,
    prompt: securityScanTemplate
  },
  {
    id: 'quality-scan',
    title: 'Code Quality Scan',
    description: 'Analyze code quality, performance, and best practices',
    icon: Search,
    prompt: codeQualityScanTemplate
  },
  {
    id: 'bug-fix',
    title: 'Bug Fix Generator',
    description: 'Generate automated fixes for reported bugs',
    icon: Bug,
    prompt: bugFixTemplate
  },
  {
    id: 'security-fix',
    title: 'Security Fix Generator',
    description: 'Generate security-focused fixes for vulnerabilities',
    icon: Shield,
    prompt: securityFixTemplate
  }
];

// Function to render Jinja2 template with prompt
export const renderUserStoryTemplate = (prompt: string, role: string = "developer", goal: string = "analyze code", benefit: string = "ensure quality and security"): string => {
  return userStoryTemplate
    .replace(/\{\{\s*prompt\s*\}\}/g, prompt)
    .replace(/\{\{\s*role\s*\}\}/g, role)
    .replace(/\{\{\s*goal\s*\}\}/g, goal)
    .replace(/\{\{\s*benefit\s*\}\}/g, benefit);
};

// Function to render any template with prompt
export const renderTemplate = (template: string, prompt: string): string => {
  return template.replace(/\{\{\s*prompt\s*\}\}/g, prompt);
};

// Function to create ChatGPT URL with pre-filled prompt
export const createCodexUrl = (prompt: string): string => {
  const encodedPrompt = encodeURIComponent(prompt);
  return `https://chatgpt.com/codex/?prompt=${encodedPrompt}`;
};