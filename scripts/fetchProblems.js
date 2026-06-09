import fs from 'fs';
import path from 'path';

const GRAPHQL_URL = 'https://leetcode.com/graphql';

const QUERY = `
query questionData($titleSlug: String!) {
  question(titleSlug: $titleSlug) {
    questionId
    title
    content
    difficulty
    topicTags { name }
    codeSnippets { langSlug code }
  }
}
`;

function stripHtml(html) {
  if (!html) return '';
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

function extractExamples(html) {
  const examples = [];
  if (!html) return examples;
  const blocks = html.split(/<strong(?:[^>]*)>Example \d+:</g).slice(1);
  for (const block of blocks) {
    const preMatch = block.match(/<pre>(.*?)<\/pre>/s);
    if (preMatch) {
      const content = stripHtml(preMatch[1]);
      const lines = content.split('\n').filter(l => l.trim());
      let input = '';
      let output = '';
      let explanation = '';
      for (const line of lines) {
        if (line.startsWith('Input:')) input = line.substring(6).trim();
        else if (line.startsWith('Output:')) output = line.substring(7).trim();
        else if (line.startsWith('Explanation:')) explanation = line.substring(12).trim();
      }
      examples.push({ input, output, explanation });
    }
  }
  return examples;
}

function extractConstraints(html) {
  const constraints = [];
  if (!html) return constraints;
  const match = html.match(/<strong>Constraints:<\/strong>[\s\S]*?<ul>([\s\S]*?)<\/ul>/);
  if (match) {
    const listItems = match[1].match(/<li>(.*?)<\/li>/g);
    if (listItems) {
      for (const item of listItems) {
        constraints.push(stripHtml(item));
      }
    }
  }
  return constraints;
}

async function fetchWithRetry(url, options, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, options);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
}

async function main() {
  console.log('Fetching NeetCode 150 list...');
  const listRes = await fetch('https://raw.githubusercontent.com/krmanik/Anki-NeetCode/main/neetcode-150-list.json');
  const listJson = await listRes.json();

  const generatedProblems = [];
  
  // Flatten the problem list
  let count = 0;
  for (const category of Object.keys(listJson)) {
    for (const title of Object.keys(listJson[category])) {
      const p = listJson[category][title];
      let titleSlug = p.url.split('/problems/')[1];
      if (titleSlug.endsWith('/')) titleSlug = titleSlug.slice(0, -1);
      
      console.log(`[${++count}/150] Fetching ${titleSlug}...`);
      
      try {
        const data = await fetchWithRetry(GRAPHQL_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: QUERY, variables: { titleSlug } })
        });
        
        const q = data.data.question;
        if (!q) {
          console.warn(`  Warning: Not found`);
          continue;
        }

        const jsSnippet = q.codeSnippets?.find(s => s.langSlug === 'javascript')?.code;
        const pySnippet = q.codeSnippets?.find(s => s.langSlug === 'python3' || s.langSlug === 'python')?.code;
        
        const mainDesc = stripHtml(q.content.split('<strong')[0].trim());
        const examples = extractExamples(q.content);
        const constraints = extractConstraints(q.content);

        generatedProblems.push({
          id: q.questionId,
          title: q.title,
          difficulty: q.difficulty,
          category: category, // Use NeetCode's category
          description: mainDesc,
          examples,
          constraints,
          starterCode: {
            javascript: jsSnippet || '',
            python: pySnippet || ''
          },
          solution: {} // Empty solutions for these
        });
      } catch (err) {
        console.error(`  Error fetching ${titleSlug}:`, err.message);
      }
      
      // Delay to avoid rate limiting
      await new Promise(r => setTimeout(r, 300));
    }
  }

  const outputPath = path.join(process.cwd(), 'src', 'data', 'neetcode150.ts');
  const fileContent = `import { LeetCodeProblem } from './leetcodeProblems';

export const NEETCODE_150_PROBLEMS: LeetCodeProblem[] = ${JSON.stringify(generatedProblems, null, 2)};
`;

  fs.writeFileSync(outputPath, fileContent, 'utf-8');
  console.log(`Successfully wrote ${generatedProblems.length} problems to ${outputPath}`);
}

main().catch(console.error);
