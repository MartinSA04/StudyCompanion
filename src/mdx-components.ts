import Formula from "./components/Formula.astro";
import Callout from "./components/Callout.astro";
import Derivation from "./components/Derivation.astro";
import CodeBlock from "./components/CodeBlock.astro";
import SelfCheck from "./components/SelfCheck.astro";
import Quiz from "./components/Quiz.astro";
import Simulation from "./components/Simulation.astro";

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
};

export default mdxComponents;
