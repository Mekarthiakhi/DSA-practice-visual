import { LEETCODE_PROBLEMS } from '../data/leetcodeProblems';
import { interpretCode } from '../utils/jsInterpreter';

describe('All 144 Problems Visualization & Execution Audit', () => {
  it('audits all catalog problems with solutions', () => {
    const withSolution = LEETCODE_PROBLEMS.filter(p => !!p.solution?.javascript);
    console.log(`Problems with runnable JavaScript solutions: ${withSolution.length} / ${LEETCODE_PROBLEMS.length}`);

    const failedExecution: Array<{ id: string; title: string; error: string }> = [];
    const missingDSAState: Array<{ id: string; title: string }> = [];

    for (const problem of withSolution) {
      const code = problem.solution.javascript!;
      try {
        const result = interpretCode(code);
        if (result.error) {
          failedExecution.push({ id: problem.id, title: problem.title, error: result.error });
          continue;
        }

        const dsaSteps = (result.steps || []).filter(s => !!s.dsaState);
        if (dsaSteps.length === 0) {
          missingDSAState.push({ id: problem.id, title: problem.title });
        }
      } catch (err: any) {
        failedExecution.push({ id: problem.id, title: problem.title, error: err.message });
      }
    }

    console.log(`Failed execution: ${failedExecution.length}`);
    console.log(`Missing DSA visualization steps: ${missingDSAState.length}`);
    if (failedExecution.length > 0) {
      console.log('Failed:', failedExecution);
    }
    if (missingDSAState.length > 0) {
      console.log('Missing DSA:', missingDSAState);
    }

    expect(failedExecution.length).toBe(0);
    expect(missingDSAState.length).toBe(0);
  });
});
