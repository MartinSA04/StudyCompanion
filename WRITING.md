# Writing course prose

Rules for the **words** in a course guide, and for the pictures and sims the words lean on.
`AUTHORING.md` tells you which widget to reach for and how the schema works; this file tells you how
to write a module that teaches. It is binding on every course repo, and on any authoring agent.

Read it before writing a module, and check against §10 before calling one done. §2 is the core.
§4–§8 are the finishing pass, and a module that follows all of them but skips §2 reads like an
encyclopedia article.

---

## 1. Who you are writing for

A student **currently taking this course**, who got in by satisfying its prerequisites. Most of them
come to the guide in the weeks before the exam, and most come to **learn the topic**, not only to be
reminded of it: most students are not comfortable with a subject until after a week of exam
preparation. So a module has to build real understanding from where the prerequisites leave the
reader, and do it efficiently, because their time is short.

**Establish what that background is before you write. Do not infer it from the topic.**

- Open the course's official page — `courseUrl` in `course.yaml`, normally
  `ntnu.no/studier/emner/<CODE>` — and read which year it is taught in, its required and recommended
  prior courses, and its stated expected prior knowledge.
- Read the syllabus and the lecture material in the course repo. What the lecturer assumes on slide 1
  is the best evidence you have.
- If a course-data lookup tool is available in your environment, use it rather than guessing.

A first-semester introductory course and a final-year elective need very different amounts of
scaffolding, and the same sentence can be condescending in one and baffling in the other. Get this
right first; a module that runs long or reads dense usually re-teaches what its reader already knows.

Then **assume that background and do not re-teach it.** A paragraph re-deriving a prerequisite is a
paragraph the reader skips, and it pushes what they came for further down the page. To a reader
who knows it, it also reads as condescending: deriving $1 + 2 + \cdots + (n - 1) = n(n - 1)/2$ for
students in their third year of mathematics is an insult, so state the sum and use it. The same
holds for pictures: a sim of something the reader can already picture teaches nothing («every
physics student knows a double slit»).

---

## 2. How a module teaches

The measure of a module is whether a student who did not understand the topic understands it after
reading. A module organised around the topic (definition, property, formula, next definition) reads
like an encyclopedia article: it goes straight through the subject, everything is stated, nothing is
explained, and the reader has nothing to hang the formulas on. Write it around the learner instead:
build the intuition first, and then the math makes sense.

TFE4146 module 01 «Energibånd og ladningsbærere» (the October 2026 rewrite) is the reference for this
section, and the examples that name «module 01» come from it.

§2 is for modules that teach. Reference pages, labs and side pages apply what the modules taught
(`AUTHORING.md` §4).

### 2.1 Start from how the topic is best taught

- **Decide how to teach it before you write.** Work out what the reader must end up understanding,
  which pictures, sims, analogies and concrete cases get them there, and in which order. Then write.
  The order of the textbook chapter is rarely the order a learner needs. Give each sim a short spec
  before it is built (the one line of argument it serves, its controls, and what the reader sees at
  each setting the text will name), build and look at it, and write the text about it from the built
  sim.
- **Open on a concrete case or problem the module answers**, stated as fact, never as a question in
  the prose (§6), and come back to it when the module has the answer. Module 01 opens on copper,
  glass and silicon (resistivities about 2·10⁻⁶, over 10¹⁰ and 2·10⁵ Ω·cm) and on one phosphorus
  atom per fifty million silicon atoms making silicon 40 000 times more conductive; the doping section
  returns to those numbers.
- **The instance before the machinery.** A section opens on the problem its result solves, or on
  one case the reader can trace; the general definition, recipe or formalism comes after and names
  what they just watched. Introduce a formalism on the smallest case that can be written out in full:
  a two-level system before bras and kets in general, one interval-cover problem before the
  definition of a greedy algorithm, $\vec L \parallel \vec\omega$ before principal axes as
  eigenvectors, two atoms before a band. This is usually a reorder, not an addition.
- **A new method starts with what the old one cannot do.** Show where the reader's current tool loses
  the answer before the first step, not «Behold alle koordinatene» with no reason.

### 2.2 Intuition first, then the math

- **See it, then the reason, then the formula.** Each idea starts from something the reader can see
  happen: a sim, a figure, or a concrete case with numbers. Then the reason in words. Then, where the
  course has one, the abstract picture (the energy picture, the state space, the recurrence). The
  formula comes last and names what the reader already understands. Module 01 gets the hole's charge
  from neutrality in the bond picture before any band, and lets the reader watch two electrons under
  the same push before $m^* = \hbar^2/(d^2E/dk^2)$ appears.
- **Show the mechanism.** Where something runs, flows or has a shape (an algorithm working through a
  graph, a channel pinching off, a hole moving through bonds, two particles in a well), the reader
  gets a picture of it: a `<Figure>` when one frame holds it, a `<Stepper>` when the order of the
  steps is the point, a `<Simulation>` when the reader learns by trying something (§8.1). Write the
  explanation around the picture and point at what it shows («Figur 1 viser …»). A paragraph that says
  in words what an algorithm does, step by step, is the hardest text in a guide to follow.
  `AUTHORING.md` §3 (widgets) and §5 (sims) cover how to build them.
- **Give the physical reason before the algebra.** When a result has a one-line physical reason,
  write it: with no torque, $\vec L$ is fixed in space, so its length is constant; a force
  perpendicular to the velocity does no work; a full band carries no current because every state an
  electron could move into is already taken. Algebra may confirm the result, but does not replace the
  reason.
- **Explaining is not deriving.** The explanation is the picture and the reason in words. A
  derivation is there for rigor, so the reader can check that the result holds, and it usually goes in
  a `<Derivation>` dropdown (§5). The text keeps the result, what it means and the one step that makes
  it; that step is the reason in words, not the first line of the algebra, so the derivation still
  lives in one place. Module 01 says in the text why a field moves every electron through $k$ at the
  same rate, and the algebra for $\hbar\,dk/dt = F$ is in a dropdown. Faced with a page of integrals, a reader skips to the result and accepts it without
  understanding it; a reader of the exchange-force section in the quantum course reported doing
  exactly that.
- **Earn every step.** A number, formula or condition that arrives without its source stops the
  reader.
  - *Construct a formula; do not announce it.* A formula with a specific shape needs the reason for
    that shape: say what it must do, then show which requirement forces which term. The
    charged-particle Lagrangian is built from $\vec E = -\nabla\phi - \partial\vec A/\partial t$: the
    $-q\,\partial\vec A/\partial t$ term is a time derivative, only
    $\frac{d}{dt}\partial U/\partial\dot{\vec r}$ can produce one, so $U$ needs
    $-q\,\dot{\vec r}\cdot\vec A$. If the formula claims to be the most general form, prove that
    too. A check afterwards («og Lagranges ligninger gir Lorentzkraften») confirms a formula, it does
    not explain it.
  - *Earn a concept from what the reader saw.* Module 01 does not state that a band state has a wave
    number $k$; the reader has watched the sign of the wave function flip from bond to bond in the
    sim, and $k$ is introduced as how often it flips.
  - *Show the step that makes the result.* When a model is set up in words, the one inference that
    produces its headline result is the step to show. «Noen energiintervaller mangler løsning uansett
    $k$» needs its reason: the equation has the form $\cos ka = f(E)$, and an energy with
    $|f(E)| > 1$ has no $k$. The same holds for a claim of direction or order («rødt ytterst, fiolett
    innerst» needs red's lower $n$), and for a learning goal that says «Forklar hvorfor»: the text
    gives the counting or the invariant, not an assertion or one hand-picked case.
- **Read the result, then check it.** After a result, one clause says what it predicts or how it
  behaves in a case the reader already knows. $\Omega = (I_3 - I_1)\,\omega_3/I_1$ is zero for a
  sphere; $m^* = \hbar^2/(d^2E/dk^2)$ gives $m_0$ for a free electron. An expectation value is not an
  outcome: say that no single measurement gives $\langle L_z\rangle = 9\hbar/14$.
- **An approximation comes with its test.** State the inequality that allows it (low injection: the
  excess is small next to the majority concentration on the lightly doped side), and let the first
  example that uses it check the inequality with its own numbers. The validity limit is in the
  running text, not only in a caption.
- **Say which way.** A sign or direction the reader must use is stated in words, with its reason, not
  left to sign bookkeeping. «Båndene følger potensialet» says the opposite of the truth; write that
  the band edge is the electron's potential energy, so the bands lie lowest where the potential is
  highest. A flow of carriers gets the direction of its electric current in the same sentence. A
  classical picture of a quantum state (a vector on a cone) says what it draws, the possible
  outcomes, not where the vector points.
- **Tie the pictures together.** When the course describes one thing in two ways (bonds and bands, a
  graph and its adjacency list, a wave and its particle count), show the same event in both and say
  which part of one is which part of the other. Module 01's figure 1 draws one broken bond in the
  bond picture and in the band picture, with the free electron and the hole joined across.
- **Analogies are welcome.** An analogy from something the reader has seen, heard or felt is one of
  the best tools a module has, as long as it is explained in the same paragraph: what in the analogy
  is what in the physics, and, when a reader could carry it too far, where it stops. Module 01 uses a cinema row with one empty seat for how
  a hole moves, two sound waves cancelling in noise-cancelling headphones for bonding and antibonding
  levels, a guitar string's overtones for the levels in a band, and an air bubble in a bottle for why
  holes collect at the top of the valence band. Coupled pendulums were correct for bonding and
  antibonding and still did not land: pick what the reader already has a feel for. What §4.3 forbids
  is made-up names and decorative imagery, never an analogy that teaches.

### 2.3 Let the reader do something

- **Sims and figures carry the module.** Design them with the text, as steps of its argument, not as
  illustrations added afterwards. A module typically has a sim or stepper for each mechanism it
  teaches.
- **The text drives the sim.** While a sim is on screen, the text tells the reader what to try and
  names what they will see, then builds on it: «Sett «Antall bindinger» til 1 i simuleringen. Kurven
  er bølgefunksjonen til nivået du har valgt … Velg det antibindende nivået, og kurven er positiv på
  det ene atomet, negativ på det andre og null midt imellom.» Every such sentence is checked against
  the sim as built (§8.1).
- **Self-checks make the reader take a step.** A `<Quiz>` or `<SelfCheck>` written for the guide puts
  the reader on a case the text did not spell out: new numbers, a direction to predict, an instance
  to classify. It never asks for a sentence the module just stated («Et afokalt system kjennetegnes
  ved …» is a table lookup). Every wrong option is a mistake a reader who half understood the module
  would make, in the same length and form as the right one; «finnes bare i vakuum» and «Fjærene er
  strukket til bristepunktet» test nothing. The explanation says why the answer holds and where the
  tempting wrong option goes wrong. A quoted exam task keeps the paper's options (§3).

### 2.4 Keep it easy to follow

- **One new thing at a time.** A sentence that brings in a symbol, a term and a result at once is
  dense however short it is. Introduce one, use it, then move on.
- **Motivate a formula before you use it.** Before the algebra starts, say which question the formula
  answers and which law or model it starts from.
- **Show a formula before you put values into it.** Write the expression first, then substitute,
  then give the result. «Det første leddet blir …, så konstantene i hakeparentesen blir $\tfrac13$»
  came before the reader had seen the bracket, so neither claim could be checked.
- **The running text carries everything it relies on.** A definition, sign rule, condition or reason
  that a later sentence, a `<Statement>` or a quiz uses is said in the running text. A caption names
  what is shown; a `<Quiz>` explanation, `<SelfCheck>`, glossary entry or `<Derivation>` may repeat or
  apply a fact, but is never its only home. Those are exactly what a reader skims before an exam. The
  rule that the dual of $c\,|a\rangle$ is $c^*\langle a|$ stood only in a `<Formula>` caption, while the
  exam quiz on the same page tested it.
- **Restate each point in a short callout.** Each point a returning reader must take from a section is
  restated in a `<Callout>` of one or two sentences, placed where the text has made that point. The
  callout repeats the running text and explains nothing new. A long section with two results can
  carry two. Keep them few enough to stand out: if most paragraphs end in one, they no longer show
  what matters. §4.4 applies here too, so the callout states the point, not a slogan.
- **Improving an explanation means a better picture, not more scaffolding.** The common failure is
  reading "explain this better" as "explain every step": ten paragraphs of scaffolding around a
  four-line argument. What pays is a picture of the mechanism, a concrete case with numbers, an
  analogy, or the reason in one sentence. A step that is genuinely missing is still added (§2.2). Cut what carries no meaning, and reorder so each step follows from the one
  before. Tables (`<Table>`, `<Compare>`) are cheap in words and carry structure well; prose
  enumeration is expensive.
- **Judge by how easy it is to follow, not by length.** A short paragraph that introduces three symbols
  and skips a step is harder than a longer one that develops one idea beside a figure. Do not count
  words; read the module as the student will and find where they would stall. Length is still a
  check for bloat, never a target: a long run of prose with nothing to look at is where a reader gives
  up. Shorter is not easier by itself: «Tilnærmingen med gradvis kanal» was rated harder to follow
  (6 → 8 on a 9-point scale) after a rewrite made it shorter and denser.
- **The test for every paragraph:** does it claim how or why something happens without a picture, a
  case or a reason the reader already has? Then it is encyclopedia text. Give it one, or cut it.
  Measured values and names are simply stated (§4.6).

---

## 3. What a module covers

**A module is one topic as the course teaches it.** A topic is one object of study with its own
central result: one device (the JFET), one model (the free electron gas), one problem and the methods
the course gives for it (shortest paths from one source). Draw a module's boundaries where the subject
has them, not where the calendar does, and find them in the course's syllabus, not its weekly plan;
the lectures and notes then set what goes inside, so book material the lectures skip stays out. The
JFET, taught over two lectures (structure and bias, then the current), is one module; two unrelated
topics in one week are two. A general section that later topics build on is its own module even when
it is short: Streetman's §6.1, «Transistor Operation» (load line, amplification, switching), comes
before the JFET, MOSFET and BJT, so it stands alone rather than inside the first of them. Reference
pages, labs and side pages that apply several modules are bounded by what they collect
(`AUTHORING.md` §4), not by one topic. Where a course's tags name weeks, a module taught over two
weeks names both («Uke 41–42»). The frontmatter `tag` is the one place a week and a source section
belong («Uke 34 · Streetman §3.1–3.2»); §3's last part keeps them out of everything else.

**A companion is not a textbook.** Cover what the course covers for the topic and stop. A module that
feels long is fixed by cutting what carries no meaning, never by splitting it: splitting bloated text
produces more bloated text with more navigation. A module splits only where the subject has a seam,
as above.

| Per module | Limit |
|---|---|
| Worked `<Example>` blocks | at most **2** |
| Past-exam tasks | at least **1** where the archive has one the module alone can solve; rarely more than 3 |

**Every claim has a job.** A fact earns its place when a later step, a quiz or an exam task uses it.
A converse, a group property or a side remark kept for completeness is cut, not proved. «Omvendt er
hver ortogonal matrise med $\det\boldsymbol R = +1$ en rotasjon» and «rotasjonene danner en gruppe,
SO(3)» stood in the rigid-body module, which used neither; its exam task asks only why a rotation
cannot have $\det\boldsymbol R = -1$.

**Applications of a result go in dropdowns.** Once a section has its result, the phenomena it
explains (the Earth's bulge, the water in a rotating bucket, the Roche limit) each go in their own
`<Derivation title="…">`, with a small sim of the system inside when one shows it better than words.
The main text stays the line of argument; the reader opens the applications they want.

### Scope discipline

Cover **exactly** what the course teaches for this topic, and nothing adjacent. Do not pull in a later
topic, and do not add material because it is interesting or because a source you read covered it.

If you believe the scope is wrong, say so to the maintainer. Do not fix it by writing more.

### Exam tasks: the paper's words, this module's scope

Every module quotes the past-exam tasks it can solve (`AUTHORING.md` §3 has the markup). Three things
decide which tasks qualify and how they are written:

- **Solvable from here.** Pick a task only if a reader who has worked through this module, with the
  course's prerequisites, can answer every sub-question you quote. Nothing from a later module, nothing
  the module skipped. If only sub-questions a–b fit, quote a–b and let `task` say so.
- **The paper's words.** Quote the task exactly, values and units included, in the paper's language. Do
  not tighten, translate or modernise it; if the paper's wording is bad, that is what the reader will
  meet on the exam. The `<ExamRef>` is the citation, so write no «denne oppgaven var gitt til eksamen i
  2023»-sentence around it.
- **None beats a poor fit.** The table above says *at least one where the archive has one*; when it has
  none that this module alone can solve, the module carries no exam task. Never pad with a task that is
  only loosely about the topic, needs a later topic, or comes from an exam on a different syllabus.

### Never point at the course's structure

Do not write «kommer i uke 35», «det ser vi i modul 4», «i uke 37 styres pn-overgangen av dem», or any
other pointer to a week number, a module number or a date. Teaching schedules shift, modules get split,
merged and renumbered, and every such pointer is a line someone has to find and fix next semester. Nor
map the module onto its sources («Stoffet svarer til avsnitt 1.1 til 1.6 i Øverbøs notat 1»): the
reader came for the topic, not for a reading list.

The default is to **say nothing**. A reader does not need to be told that a topic exists later; they
will meet it when they meet it.

If deferring genuinely helps — usually to stop a reader worrying that something was left out — name the
**topic**, never its position:

| Don't | Do |
|---|---|
| hvilken masse som gjelder når, kommer i uke 35 og 36 | hvilken masse som gjelder, avhenger av om du teller tilstander eller regner på strøm |
| de samme ionene bygger romladningssonen i uke 37 | de samme ionene bygger romladningssonen i pn-overgangen |
| dette utledes i modul 3 | *(omit)* |

A deferral says what the choice depends on, not only that it depends. «avhenger av hva du regner
på» and «av andre grunner» tell the reader that a rule exists and withhold it; state the dependence,
or cut the sentence.

The same rule applies to `course.yaml` labels and definitions, and to simulation captions.

---

## 4. Plain language

Follow [Språkrådet's klarspråk guidance](https://sprakradet.no/klarsprak/om-skriving/): *bruk verb
istedenfor substantiv*, *velg konkrete ord, unngå fyllord*, *si én ting om gangen*.

### 4.1 One concept, one word — always the same word

Never swap in a synonym for variety. In technical text a different word signals a different thing, so
varying the term makes the reader stop and ask whether it does. Språkrådet's own example is a law that
alternated *studieprogram / studietilbud / studium / utdanning* for one concept; readers could not tell
the terms apart. The same rule is why [elegant variation](https://en.wikipedia.org/wiki/Elegant_variation)
is discouraged in technical writing generally.

Pick the term the course uses (`bånd`, `nivå`, `gitterpunkt`, `bærer`) and repeat it. Repetition is
correct here.

The same holds for claims. Describe each central object one way, and make every caption, glossary
entry and later module use that description: a module that calls $\psi(x)$ the components of
$|\psi\rangle$ in one paragraph and «ulike objekter i ulike vektorrom» in the next leaves the reader
with nothing to hold. Two different quantities never share one description ($\dot\psi$ and
$\omega_3$ were both described as the turning about the body's own axis, and a sign depended on
which was meant). When a later passage applies a result outside the conditions an earlier one set,
or uses a word or symbol in a wider sense, say in one sentence why it holds there: føringskraften
«gjør ikke arbeid» is about displacements at fixed time, so a ring that a motor turns can still do
work on the bead, and $\vec g$ that has taken in the centrifugal term is $\vec g_\text{eff}$. A toy
model and the real system get reconciled the same way: module 01's chain puts the top of the valence
band at $k = \pi/a$, and two sentences say why silicon has it at $k = 0$. A calculation done in a
non-primitive description (the conventional cube, an extended zone) says how its result maps onto
the primitive one.

### 4.2 Verbs, not noun-phrases

Avoid *substantivsyke* — a verb crushed into a noun, what Språkrådet calls a "språklig omvei".

### 4.3 No coined names, no decorative imagery

Use ordinary technical Norwegian. If a word or an image does not already mean the thing in the field,
do not press it into service because it sounds evocative: «vekslingskurs», «tekstur», «flis»,
«knippe», «der motprøvene bor», «ryker» (§7). A compound coined in passing («banebildet») counts too.
This rule never catches an analogy that teaches (§2.2).

### 4.4 No aphorisms

No paragraph-final zingers, no clever compressions, no sentence that exists for its rhythm. Plain short
sentences are good; slogans are not. Test: cover the last sentence of a paragraph. If you lost
information, keep it. If you only lost music, delete it.

### 4.5 Every reference must resolve

Every definite noun and pronoun needs an antecedent the reader can point at. «stykket» → «materialet».

«Det» is the usual offender: name the noun. «For den plane pendelen er det snordraget» → «For den
plane pendelen er føringskraften snordraget»; «Det gir hver hendelse fire tall» → «Referansesystemet
gir …». A «dette» that points forward at a formula the reader has not seen yet does not resolve
either: say what it is in the sentence itself. And a thing that stands on its own needs no
back-reference: «den plane pendelen», not «den plane pendelen fra starten av seksjonen».

An antecedent the reader must scroll back for does not resolve. «De tre tallene som er igjen» stood
after a callout, a tensor paragraph and an exam task, twenty lines below «tre tall er igjen». Past
the previous paragraph, restate the fact: «Ortogonaliteten binder seks av de ni elementene i R, så
orienteringen er gitt ved tre tall.» A sim referred to from another section is named: «I
simuleringen «Fra bindinger til bånd» …».

### 4.6 Be willing to be plain

"Gitterkonstanten i silisium er 5,431 Å." Full stop. Not every sentence has to work.

### 4.7 Worked examples

Real numbers, checked arithmetic, units. Show the substitution, not just the result. Keep the solution
to the steps a student would actually write. The solution to a quoted exam task is written the same
way, in the guide's words, and its final answer is checked against the official solution where one
exists; do not paste the official solution.

### 4.8 Notation follows the course

§4.1 applies to symbols too. Before the first formula uses a symbol with more than one common
convention — $k$ vs $k_B$ for Boltzmanns konstant, sign conventions, primed vs starred masses —
check what the course's own authored material writes (problem sets, lecture notes, exams) and use
that. The textbook does not settle it: where book and lecturer disagree, the lecturer's material
wins, because that is the notation the reader must produce on the exam. Apply the choice everywhere
the reader sees it — prose, formula collection, symbol list, glossary, sim readouts. The symbol list
(`course.yaml` `symbols[]`) is where a collision gets its one-line warning («ikke energien $E$»),
so the reader who meets $\mathcal{E}$ mid-formula has somewhere to look it up. A clash with a
convention the reader knows from elsewhere is no reason to depart from the lecturer: TDT4120 writes
$A[1 : n]$, as the lecture does, although Python's `A[1:n]` stops before `A[n]`, and the module says
so where the code is translated. Swapping in $A[1 .. n]$ to avoid the clash left the reader with
notation the exam does not use.

### 4.9 Every claim is checked

Check every side claim before writing it. «Friksjonen har ingen Lagrangefunksjon» is false
($L = e^{\gamma t}(T - V)$ gives damped motion). A reason that holds only in the module's toy model is
not a reason for the real system: «fordi bindingene står lenger fra hverandre» was true of the drawn
chain and false for silicon, where every bond has the same length. Never assert what the rest of the
course does («resten av emnet bruker Galilei-transformasjonen», in a course whose last three weeks are
special relativity); state facts about the subject instead.

---

## 5. Writing a derivation and any chain of reasoning

A derivation gives rigor: it lets the reader check that a result holds and see where its conditions
come from. It is not the explanation (§2.2), and it usually lives in a `<Derivation>` dropdown. When
you write one, write it properly. Except for the first, these rules hold for every chain of reasoning,
in the running text as much as in a dropdown.

- **Derive properly, in one place.** A derivation goes either fully in the text or fully in a
  `<Derivation>` dropdown, never stated in one place and half-derived in another. It stays in the text
  only when doing it is what the section teaches (a method the reader must carry out, like building
  the Lagrangian); otherwise it goes in the dropdown, and the text keeps the result,
  what it means and the step that makes it (§2.2). A condition the algebra relies on (an
  approximation, a sign rule) is still stated in the text. A derivation the reader did in a
  prerequisite course goes in one dropdown, and the text states the result plainly, with no «Målet er
  …» framing.
- **Derive first, take apart after.** Components, sizes and special cases of a result come after the
  derivation that produces it. A paragraph that splits the centrifugal term into components and then
  says «Lagt til $\vec g$ gir …» hands the reader $\vec g_\text{eff}$ without a reason. Start from
  the physical situation (a plumb bob at rest in $K'$, Newton's second law there) and let the formula
  fall out.
- **Show the object before counting it.** Write $t' = At + Bx$, $x' = Dt + Ex$ before saying «fire
  konstanter».
- **Each step, then its result.** Not «to krav fjerner to konstanter», but the requirement followed by
  what it gives: origo i $K'$ har $x' = 0$ ved $x = vt$, så $D = -Ev$.
- **Say what you substitute and which term it changes.** Not «Brukt på $\vec\omega$ selv gir
  sammenhengen $\vec\omega \times \vec\omega = 0$», which leaves the reader to work out what goes
  where, and claims the formula «gives» a fact it only uses. Write «Sett $\vec A = \vec\omega$. Da er
  det siste leddet $\vec\omega \times \vec\omega = 0$, ettersom …», then the consequence.
- **A «du trenger» names what it is needed for.** «Newtons andre lov gjelder i $K$, så du trenger
  $\vec a$ uttrykt ved størrelser i $K'$» leaves the reader asking why. Say the goal first, then the
  route: you measure in $K'$ and want $\vec a\,'$; Newton holds only in $K$, so express $\vec a$ in
  $K'$ quantities, insert in $m\vec a = \vec F$ and solve for $\vec a\,'$.
- **Write a derivation as a chain**: «Hvis …, er … ⇒ …. Dette betyr at …, ettersom …. Da kan … skrives
  som …». Premise, implication, consequence, reason. Put ⇒ chains in display math; inline, they wrap
  mid-equation.
- **Check the direction of every «ettersom».** «∇ × ∇f = 0» shows that a gradient has zero curl, not
  that a field with zero curl is a gradient. The argument usually needs the second.
- **Name what is «the same», and what is «sufficient» for what.** «gir samme svar» → «arbeidet er det
  samme». A sufficiency claim says which statement it secures and how it can fail (the hole in a region
  that is not simply connected).
- **Definition first, remark after.** «En kraft er konservativ når …», then «De fleste kreftene i
  mekanikken er konservative».

---

## 6. Register: what these guides never sound like

A few of these are absolute, because they are simply errors in Norwegian. The rest are habits to write
against: judge them by reading the finished module, not by counting. If a device shows up often enough
that you notice it as a device, it is doing the damage described here, whatever the count says.

**Absolute:**

| Pattern | Rule |
|---|---|
| Long dash `—` | Norwegian typography does not use it. Use a full stop, a comma, or rewrite. |
| Oxford comma before «og» | Anglicism. |
| Title-case headings | English convention. |
| Rhetorical questions in body prose | Questions belong in `<Quiz>`, `<SelfCheck>`, `<Example>`, `<Hints>`. |
| Quotation marks as hedge («forklaringen» på …) | Stand behind the claim or cut it. |
| Filler vocabulary | banebrytende, revolusjonere, transformere, sømløs, robust, helhetlig, paradigme, nøkkelen til, spiller en avgjørende/sentral rolle, det reiser spørsmål om, når det kommer til, implikasjoner, belyse, favne, ivareta, legge til rette for, det er verdt å merke seg at, det er viktig å understreke at |

**Write against these:**

- **The «ikke X, men Y» antithesis**, including the postposed «…, ikke Y», «snarere enn», «heller enn».
  It is a good tool for correcting a specific misconception and a bad one for everything else. Used
  twice on the same page it starts to sound like a tic, and a `<KeyTakeaways>` list built from it is
  unreadable.
- **Nominal payoffs** — «Trikset er…», «Poenget er…», «Grunnen er…», «Nøkkelen er…». Almost always
  better as a plain sentence that just says the thing.
- **The rhetorical colon**, where a sentence sets up and the colon reveals. A colon introducing a
  formula, a list or a quotation is ordinary punctuation and not what this means.
- **Paragraphs that end on a resonant one-liner.** Occasionally a paragraph really does end on its
  sharpest sentence. When most of them do, the reader stops trusting any of them. Never two in a row.
- **Bold in running prose.** Terminology belongs in `<Term>`, emphasis in the sentence structure.
- **Explicit conclusion markers** (Oppsummert, Kort sagt, Til slutt) and **signposting** that announces
  what the text is about to do. `<KeyTakeaways>` handles the recap structurally.

**Positive habits:**

- **Vary sentence length**, genuinely: some very short, some long enough to carry a full argument.
  Uniform sentence length is one of the strongest signals that text was generated rather than written.
- **Vary paragraph length** the same way. A one-sentence paragraph is allowed and often right; so is a
  long one where a thought needs room to finish.
- **Ordinary connectives** — og, men, så, fordi, derfor, altså, når, hvis, da. Not *videre, i tillegg,
  dessuten, følgelig, med andre ord* in every gap. Let roughly half the sentences open on the subject.
- **Keep the prose anchored** in numbers, named materials and concrete cases. Abstract prose is where
  filler hides.
- **Do not avoid the copula.** When *er* or *har* is the right verb, use it. Not *utgjør, fungerer som,
  representerer, rommer, kjennetegnes ved, danner grunnlaget for*.
- **Address the reader as «du»**, never «vi». Imperatives are fine («Skriv feltene med …»).
- **Say each fact once.** «Feltet skyver elektronene mot venstre … De frie elektronene driver mot
  venstre. Elektronene i bindingene hopper oftest mot venstre» says the same thing three times. Say
  it once, then build on it.
- **Everyday words and word order.** «ett av femti millioner silisiumatomer», not «ett silisiumatom av
  femti millioner»; «svært sjeldent», not «bare sjelden». Bookish words no lecturer would say out loud
  («især») go too.
- **Modern word order and plain verbs.** «og forlater den så» reads as old-fashioned; «lette» means
  lifting upwards, not leaving a surface («mister kontakten med overflaten»).
- **A sentence parses on the first read.** «for» meaning *fordi*, «når» meaning *rekker*, «under»
  meaning *nedenfor* and «til» meaning *inntil* each read first as the commoner word. When the
  sentence does not force the intended reading, the reader has to go back and decode it. «Omvendt er
  … en rotasjon, for Eulervinklene under når den med tre dreininger etter hverandre» stacks three of
  them. Before rewording such a sentence, ask whether the module needs it at all (§3, every claim has
  a job); this one was cut.
- **No abstract noun doing a person's thing.** «Argumentet spør hvilke systemer …»: arguments do not
  ask. Say what the reader does or what follows.

---

## 7. Rejected wordings

All of these are real, from a rewrite the maintainer rejected.

| Rejected | Why | Rewritten |
|---|---|---|
| Overgangen er telling. | verb crushed into a noun; not a sentence anyone says | Forskjellen kommer av hvor mange nivåer som ligger inntil hverandre. |
| knippet leses som et kontinuum | «knippe» coined for a thing already called *nivåer*; third word for one concept | ligger nivåene så tett at de danner et sammenhengende bånd |
| Gruppe IV er forsøket: | «forsøket» does not mean this; reads as nonsense | Grunnstoffene i gruppe IV viser det samme. |
| hvor godt **stykket** leder | no antecedent — which piece? | hvor godt **materialet** leder |
| krumningen er **vekslingskursen** som sier hvor mye fart hvert $k$-skritt kjøper | coined name stacked two deep | hvor mye fart bæreren får ut av hvert steg i $k$, og det avgjøres av krumningen |
| den nederste **flisen** av båndet | coined vocabulary for "nederst" | helt nederst i båndet |
| Tre avlesninger bærer resten av uka. | slogan; "bærer uka" means nothing | Du leser tre ting ut av diagrammet. |
| en **tekstur** som gjentar seg | invented term for a periodic function | en **funksjon** som gjentar seg |
| der motprøvene bor | personification for its own sake | Gå til en av de nærmeste naboene |
| Bravais-egenskapen **ryker** i det øyeblikket forskyvningen forlater null | colloquial + overwrought | mønsteret er bare et Bravais-gitter når forskyvningen er nøyaktig null |

---

## 8. Simulations and figures

### 8.1 What they show

- **One system and one line of argument per sim.** A sim is designed with the module (§2.3), so its
  controls are the levers the text talks about, and the text may come back to it for several steps.
- **A sim explains; it never merely plots.** The reader must be able to do something that changes
  their understanding: move a lever the theory talks about and watch the consequence. A graph is
  allowed when the graph *is* the concept (a plateau, a crossover, a resonance), but an interactive
  redraw of a static figure is a figure, not a sim.
- **Draw the system.** The reader first has to recognise the system the prose names: the pendulum
  with its pivot and angle, the graph with its nodes, the crystal with its bonds. Draw that object at
  the largest scale that fits, like the textbook figure, with the quantities the text names labelled
  on it. Put the intuition into the same drawing as an overlay (an energy line with turning points,
  equal-area sectors, the hole in a bond), not into an analytic panel beside a thumbnail. A second
  panel is right when the course teaches two views of one event (§2.2), like the chain and its energy
  levels, or a band $E(k)$ above the crystal the electron moves in. Prefer one scene that holds every
  case over one panel per case. The same holds for static figures: a
  TDT4120 figure of the four DFS edge classes as interval bars on a time axis was rejected and
  redrawn as one snapshot of a DFS tree with one edge of each kind.
- **Draw a quantity the way the reader already pictures it.** A wave function is a wave: draw it as
  one continuous curve over the atoms, positive above the line and negative below. Stems on each
  atom held the same numbers, and the reader did not see a wave in them.
- **Figures share the sims' drawing.** A figure of something a sim also draws uses the sim's marks,
  colours and proportions, so the reader recognises it. Module 01's figure 1 draws the bonds exactly
  as its crystal sim does. One object keeps one mark in every sim and figure of a module: in module 01
  a free electron is always a blue dot and a hole always a red ring.
- **Plot in the reader's coordinates.** Use the axis the reader thinks in (temperature, distance,
  time), not the axis a textbook's analysis technique uses (reciprocal, mirrored, Arrhenius). The
  analysis form is a skill prose can teach; a sim that requires decoding its own axes explains
  nothing. One caption sentence may bridge to the book's convention.
- **Budget the reader's attention.** At most one short readout sentence, and prefer none — put
  numbers and names into the drawing as labels on the things they describe: a labelled zone beats a
  sentence naming it, a marked axis tick beats "at 300 K" in text. A readout that never changes with
  the controls is dead weight; delete it. Every number on screen costs attention the shape was
  supposed to earn.
- **A caption says what is drawn.** A `<Simulation>` caption names the system and what the marks and
  colours stand for, usually in one or two sentences, and what is not to scale or exaggerated
  («Hvor ofte bindinger brytes, er ikke i skala»), so the reader does not take the toy's numbers for
  the real system's. It does not say which control to move, since
  the controls show that, and it never narrates what happens: the result is the reader's to find,
  and the running text states it. It leaves out what the drawing or its legend already makes plain:
  «to streker med en prikk på hver» describes a picture the reader is looking at.
- **Describe the sim you built.** Check every sentence that tells the reader what they will see
  against the running sim, at the settings the text names. «Hullet reiser gjennom krystallen» was
  wrong for a sim where, with no field, the hole hops back and forth and gets nowhere. «Sett «Antall
  bindinger» til 8» sent the reader to a setting where half the levels contradicted the next sentence;
  the text now says 4. When the input is random (a shuffle button, a size slider that deals a new
  instance), the text describes only what holds for every input, or what the reader can read off
  their own run («siste steg sier hvor mange ganger kortene flyttet seg»). A walkthrough of the
  starting example («I steg 17 legges 3 på plass 1») is wrong for every reader who has pressed
  shuffle. Check it in both themes too: «jo mørkere prikken er» was wrong in dark mode, where the
  dots drawn most opaque are the lightest, and «jo tydeligere prikken er» holds in both. Point at a
  place in a sim by what it is in the physics («der kurven går over fra å bue oppover til å bue
  nedover»), not by how it is drawn («der det tonede området begynner»).
- **Legible at phone width first.** Verify every sim at ≈390 px in both themes, including the slider
  extremes: axis titles short enough not to clip, few enough ticks that labels cannot collide, and
  in-drawing labels that shorten or drop when their region gets too narrow. If a label does not fit
  on a phone, the fix is fewer words in the drawing, not smaller type. A figure is drawn for a
  phone-width frame (about 310 px): a viewBox about 340 wide with text at least 15 px, and panels that
  do not fit side by side at that width stacked vertically.
- **A video is optional, never the argument.** A good video is a reward: edutainment that makes the
  idea stick, or simply a cool or fun watch that gives the reader a break. It may restate what the
  module says. The module has to work for the reader who never clicks, so never write "se videoen for
  utledningen". Choose it as `AUTHORING.md` §3 describes: about the very idea of the passage it sits
  next to, a good watch from a channel that will last. Most modules have none, and one is usually
  enough. The card is built from text you type, so `title`, `channel`, `duration` and `caption`
  follow the same rules as any other reader-visible text. The caption says what in the video is worth
  it for this module, and only what you have checked the video contains.

### 8.2 How they look

The framework owns the design. A course-owned sim must look like it was drawn by the framework.

- **Never hand-roll chrome.** The framework provides `.sim-readout` for readouts and `.sim-btn` for
  buttons, and `_controls.js` for shared controls. Use them. Do not build your own bordered card with
  inline CSS.
- **Only framework tokens** for colour, radius, spacing and type: `var(--accent)`, `var(--muted)`,
  `var(--border)`, `var(--bg-elevated)`, `var(--radius)`, `var(--font-mono)`, `var(--text-sm)`. No
  hardcoded hex, rgb, pixel radii or font stacks — they break one of the two themes. A `<Figure>`
  is an `<img>` and cannot read tokens, so it has a transparent background and mid-tone colours that
  hold contrast on both themes (`Figure.astro` explains).
- **A rigid body whose turning is the subject is drawn solid.** When the sim is about how an
  extended body turns (a tumbling book, a heavy top, the coin that carries the Euler angles), build it
  like the real object and give it opaque faces shaded from one fixed light: mix the material toward
  `var(--solid-shade)` by how far the face turns from the light, continuously, never in steps that
  snap while it turns; `var(--solid-paper)` is the neutral material. Cut lines, arcs and vectors into
  short pieces and draw each piece behind or in front of the body by where it really is, so the body
  never covers a line that passes in front of it; pieces behind show through as faint dashed ghost
  lines. TFY4345's `public/sims/_solid.js` and `_painter.js` are the reference. This is not a
  general style: point masses, wires, lattices, planes and reference surfaces keep the flat drawing.
- **Match the existing sims.** Read the sims already in the course's `public/sims/` before adding one.
  They are the house style.
- **Captions render inline math.** Since v4.4.2 `<Simulation caption>` and `<Stepper caption>` run
  the same `$…$` renderer as `<Figure caption>`, so write `$\Delta k$`, not a bare Unicode `Δ`.
  `AUTHORING.md` §6 lists every prop that renders math.

---

## 9. Rewriting a module

The modules written before October 2026 read like encyclopedia articles, and editing them sentence by
sentence keeps that shape. Every module is therefore rewritten the way TFE4146 module 01 was:

1. **Start from a blank page.** Read the syllabus, the lecture material and the problem sets, and
   decide how the topic is best taught (§2.1). Do not start from the current text.
2. **Write it by §2**, with its sims and figures designed alongside the text: a spec for each sim,
   then the sim built and looked at, then the text about it written from what it shows.
3. **Independent review.** A separate, read-only agent that did not write the module checks it
   against this file and `AUTHORING.md`, and against the running sims. Apply the findings that hold.
4. **Side by side.** Build the new module and the current one and show them to the maintainer next to
   each other, linked section by section. The maintainer critiques; iterate on every comment, and
   write each general rule the maintainer states into this file.
5. **Commit only when the maintainer approves.**

Each course repo's `REWRITES.md` tracks which modules have been rewritten and which remain.

---

## 10. Before you call a module done

In addition to the definition-of-done in `AUTHORING.md` §8:

- [ ] **Taught, not stated** (§2): every idea starts from something the reader can see (a sim, a
      figure, a case with numbers) and gets its reason in words before its formula; no paragraph
      claims how or why something happens without a picture, a case or a reason.
- [ ] **Built for learning** (§2.1): the order is the one a learner needs; the module opens on a
      concrete case or problem and answers it; every formalism enters on its smallest case.
- [ ] **The pictures carry it** (§2.3, §8.1): every mechanism the reader has not met before is shown
      in a figure, stepper or sim that draws the system; the text tells the reader what to try and
      every such sentence matches the sim at the settings named; figures share the sims' drawing.
- [ ] **Derivations give rigor, in one place** (§5): fully in the text or fully in a `<Derivation>`,
      in the text only when doing it is what the section teaches; every formula with a specific shape
      constructed (§2.2); every «ettersom» checked for direction; every side claim checked (§4.9).
- [ ] **Every headline result shown, read and checked** (§2.2): the step that produces it is in the
      text, it gets one clause on what it predicts or a known case it reduces to, every approximation
      comes with its test, and every sign or direction is stated in words.
- [ ] **Easy to follow** (§2.4): no sentence that brings in several new things at once; no formula
      used before it is motivated; no values put into a formula the reader has not seen.
- [ ] **Pictures tied together** (§2.2): where the course has two views of one thing, the same event
      is shown in both.
- [ ] **Analogies explained** in the paragraph they appear in, and no coined names or decorative
      imagery (§2.2, §4.3).
- [ ] **Audience established from the course page** (§1), not assumed, and nothing re-taught that the
      prerequisites already cover.
- [ ] **One topic, bounded by the subject** (§3): not split across modules by week, not merged with
      another topic because they share a week, nothing adjacent added, and every claim has a job.
- [ ] **Exam tasks quoted verbatim** and opened by `<ExamRef>`; every sub-question quoted is solvable
      from this module plus prerequisites; answers checked against the official solution; every
      multiple-choice task is a `<Quiz>` with the paper's alternatives, never a list in prose.
- [ ] **Every self-check makes the reader take a step** (§2.3), with distractors that are real
      mistakes.
- [ ] **Nothing the text relies on lives only in small print** (§2.4): no definition, rule or reason
      only in a caption, quiz explanation, glossary entry or dropdown. Each point a returning reader
      needs is restated in a short `<Callout>`.
- [ ] **One account per object** (§4.1): no two descriptions of one thing left unreconciled, a toy
      model reconciled with the real system, and no later passage that quietly breaks an earlier
      statement.
- [ ] **One word per concept** throughout (§4.1); no synonym introduced for variety.
- [ ] **Every pronoun and definite noun resolves** (§4.5), every «det» included.
- [ ] **Every chain of reasoning written by §5**: definition before remark, the goal before «du
      trenger», «the same» and «sufficient» named.
- [ ] **No pointer to a week, module number, date or source section** in the prose, in `course.yaml`
      entries or in sim captions (§3). The frontmatter `tag` is the one place they belong.
- [ ] **No formula broken at an unnatural place.** A wide formula scrolls, which is fine; one that
      wraps after `=` or at a `\qquad` comma reads as broken. `aligned` only at natural seams;
      a continuation that should wrap only on phones gets `\allowbreak` (AUTHORING.md §6).
- [ ] **Every sim checked at phone width** (≈390 px, both themes, slider extremes): no clipped or
      colliding labels, readouts within the one-sentence budget of §8.1, every caption says what is
      drawn, says what is not to scale, and narrates nothing.
- [ ] **Sims use framework classes and tokens only** (§8.2).
- [ ] **Zero long dashes** (§6) in the module *and* in the `course.yaml` entries it added.
- [ ] **§6 read against the finished text**, including reader-visible props: captions, `<Quiz>` options
      and explanations, `<Callout>` titles, `<Answer>`, `<Statement>`, `<LearningGoals>`,
      `<KeyTakeaways>`. Read it, do not just count it.
- [ ] **`course.yaml` swept too** — labels, symbol meanings and definitions reach the Formelsamling,
      Symboler and Begreper pages independently of the module, so a phrase fixed only in the `.mdx`
      still ships.
- [ ] **Every `<Video>` checked** (§8.1): link opened and still playing, caption matched against what the
      video contains, video about the passage it sits next to, and the module reads complete without it.
- [ ] `pnpm build` green.

Read the built page before shipping. Prose that looked fine in the editor often reads as padding on the
page.
