import Formula from "./components/Formula.astro";
import Callout from "./components/Callout.astro";
import Derivation from "./components/Derivation.astro";
import CodeBlock from "./components/CodeBlock.astro";
import SelfCheck from "./components/SelfCheck.astro";
import Quiz from "./components/Quiz.astro";
import Simulation from "./components/Simulation.astro";
import Example from "./components/Example.astro";
import Solution from "./components/Solution.astro";
import Answer from "./components/Answer.astro";
import LearningGoals from "./components/LearningGoals.astro";
import ExamFocus from "./components/ExamFocus.astro";
import Figure from "./components/Figure.astro";
import Steps from "./components/Steps.astro";
import Step from "./components/Step.astro";
import KeyTakeaways from "./components/KeyTakeaways.astro";
import Hints from "./components/Hints.astro";
import Hint from "./components/Hint.astro";
import Compare from "./components/Compare.astro";
import CompareCol from "./components/CompareCol.astro";
import Statement from "./components/Statement.astro";
import Term from "./components/Term.astro";
import FormulaRef from "./components/FormulaRef.astro";

/**
 * Components made available to every MDX section by name, without the author
 * importing anything. The injected page passes this map to `<Content
 * components={mdxComponents} />`, which is Astro MDX's mechanism for providing
 * components by name. So `<Formula .../>` in a section just works.
 *
 * Keep this the single source of truth for which widgets authors may use.
 */
export const mdxComponents = {
  Formula,
  Callout,
  Derivation,
  CodeBlock,
  SelfCheck,
  Quiz,
  Simulation,
  Example,
  Solution,
  Answer,
  LearningGoals,
  ExamFocus,
  Figure,
  Steps,
  Step,
  KeyTakeaways,
  Hints,
  Hint,
  Compare,
  CompareCol,
  Statement,
  Term,
  FormulaRef,
};

export default mdxComponents;
