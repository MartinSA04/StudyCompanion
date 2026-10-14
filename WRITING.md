# Writing course prose

Rules for the **words** in a course guide. `AUTHORING.md` tells you which widget to reach for and how
the schema works; this file tells you how to write the text that goes in them. It is binding on every
course repo, and on any authoring agent.

Read it before writing a module, and check against §7 before calling one done.

---

## 1. Who you are writing for

A student **currently taking this course**, who got in by satisfying its prerequisites. Write for
exactly that background: no less, and no more.

**Establish what that background is before you write. Do not infer it from the topic.**

- Open the course's official page — `courseUrl` in `course.yaml`, normally
  `ntnu.no/studier/emner/<CODE>` — and read which year it is taught in, its required and recommended
  prior courses, and its stated expected prior knowledge.
- Read the syllabus and the lecture material in the course repo. What the lecturer assumes on slide 1
  is the best evidence you have.
- If a course-data lookup tool is available in your environment, use it rather than guessing.

A first-semester introductory course and a final-year elective need very different amounts of
scaffolding, and the same sentence can be condescending in one and baffling in the other. Get this
right first; most length problems are really audience problems.

Then **assume that background and do not re-teach it.** A paragraph re-deriving a prerequisite is a
paragraph the reader skips, and it pushes what they came for further down the page.

They are reading this **instead of** re-reading the textbook, usually shortly before an exam or a
group session. Respect that.

---

## 2. Length is a budget, not an outcome

| Unit | Budget |
|---|---|
| One lecture week / one lecture | **one module**, 1300–2000 prose words |
| Worked `<Example>` blocks per module | at most **2** |
| Past-exam tasks per module | at least **1** where the archive has one the module alone can solve; rarely more than 3 |
| Reading time per module | 10–20 minutes |

The range is a target, not a threshold. A module that lands a little outside it is not a defect and
does not need trimming to hit a number; one that lands at 3000 words is telling you something. Use
the count as a signal to go back and look, not as a rule to satisfy.

Measure, do not estimate:

```bash
awk 'NR>1 && /^---$/{fm=1; next} fm' FILE \
  | grep -vE '^\s*<|^\s*\}|^\s*\]|^\s*/>' | wc -w
```

**A companion is not a textbook.** If a module is over budget, the fix is to cut, not to split into more
modules: splitting bloated text produces more bloated text with more navigation.

**Every claim has a job.** A fact earns its place when a later step, a quiz or an exam task uses it.
A converse, a group property or a side remark kept for completeness is cut, not proved. «Omvendt er
hver ortogonal matrise med $\det\boldsymbol R = +1$ en rotasjon» and «rotasjonene danner en gruppe,
SO(3)» stood in the rigid-body module, which used neither; its exam task asks only why a rotation
cannot have $\det\boldsymbol R = -1$.

**Applications of a result go in dropdowns.** Once a section has derived its result, the phenomena it
explains (the Earth's bulge, the water in a rotating bucket, the Roche limit) each go in their own
`<Derivation title="…">`, with a small sim of the system inside when one shows it better than words.
The main text stays the line of argument; the reader opens the applications they want.

**The running text carries everything it relies on.** A definition, sign rule, condition or reason
that a later sentence, a `<Statement>` or a quiz uses is said in the running text. A caption names
what is shown; a `<Quiz>` explanation, `<SelfCheck>`, glossary entry or `<Derivation>` may repeat or
apply a fact, but is never its only home. Those are exactly what a reader skims before an exam. The
rule that the dual of $c\,|a\rangle$ is $c^*\langle a|$ stood only in a `<Formula>` caption, while the
exam quiz on the same page tested it.

**Restate each point in a short callout.** Each point a returning reader must take from a section is
restated in a `<Callout>` of one or two sentences, placed where the text has made that point. The
callout repeats the running text and explains nothing new; the explanation is in the text. A long
section with two results can carry two. Keep them few enough to stand out: if most paragraphs end in
one, they no longer show what matters. §3.4 applies here too, so the callout states the point, not a
slogan.

### Scope discipline

Cover **exactly** the syllabus for that week, and nothing adjacent. Do not pull in the next week's
material, and do not add topics because they are interesting or because a source you read covered them.

If you believe the scope is wrong, say so to the maintainer. Do not fix it by writing more.

### Exam tasks: the paper's words, this module's scope

Every module quotes the past-exam tasks it can solve (`AUTHORING.md` §3 has the
markup). Two things decide which tasks qualify and how they are written:

- **Solvable from here.** Pick a task only if a reader who has worked through this module, with the
  course's prerequisites, can answer every sub-question you quote. Nothing from a later module, nothing
  the module skipped. If only sub-questions a–b fit, quote a–b and let `task` say so.
- **The paper's words.** Quote the task exactly, values and units included, in the paper's language. Do
  not tighten, translate or modernise it; if the paper's wording is bad, that is what the reader will
  meet on the exam. The `<ExamRef>` is the citation, so write no «denne oppgaven var gitt til eksamen i
  2023»-sentence around it.
- **None beats a poor fit.** The budget row says *at least one where the archive has one*; when it has
  none that this module alone can solve, the module carries no exam task. Never pad with a task that is
  only loosely about the topic, needs a later week, or comes from an exam on a different syllabus.

### Never pin a forward reference

Do not write «kommer i uke 35», «det ser vi i modul 4», «i uke 37 styres pn-overgangen av dem», or any
other pointer to a week number, a module number or a date. Teaching schedules shift, modules get split,
merged and renumbered, and every such pointer is a line someone has to find and fix next semester. They
are pure maintenance debt for no reader benefit.

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

### Fixing an explanation usually means replacing words, not adding them

The most common failure is reading "explain this better" as "explain every step". A missing four-line
derivation is worth adding. Ten paragraphs of scaffolding around it are not. Prefer, in order:

1. cut what does not carry meaning,
2. reorder so each step follows from the previous one,
3. replace an assertion with the short reason behind it,
4. only then add.

Tables (`<Table>`, `<Compare>`) are cheap in words and carry structure well. Prose enumeration is
expensive. Simulations cost no reading length at all.

---

## 3. Plain language

Follow [Språkrådet's klarspråk guidance](https://sprakradet.no/klarsprak/om-skriving/): *bruk verb
istedenfor substantiv*, *velg konkrete ord, unngå fyllord*, *si én ting om gangen*.

### 3.1 One concept, one word — always the same word

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
which was meant). When a
later passage applies a result outside the conditions an earlier one set, or uses a word or symbol
in a wider sense, say in one sentence why it holds there: føringskraften «gjør ikke arbeid» is about
displacements at fixed time, so a ring that a motor turns can still do work on the bead, and
$\vec g$ that has taken in the centrifugal term is $\vec g_\text{eff}$. A calculation done in a
non-primitive description (the conventional cube, an extended zone) says how its result maps onto
the primitive one.

### 3.2 Verbs, not noun-phrases

Avoid *substantivsyke* — a verb crushed into a noun, what Språkrådet calls a "språklig omvei".

### 3.3 No invented metaphors, no coined vocabulary

Use ordinary technical Norwegian. A standard, established analogy is fine when it is cashed out in the
same breath; an analogy you made up is not. If a word does not already mean the thing in the field, do
not press it into service because it sounds evocative.

### 3.4 No aphorisms

No paragraph-final zingers, no clever compressions, no sentence that exists for its rhythm. Plain short
sentences are good; slogans are not. Test: cover the last sentence of a paragraph. If you lost
information, keep it. If you only lost music, delete it.

### 3.5 Every reference must resolve

Every definite noun and pronoun needs an antecedent the reader can point at. «stykket» → «materialet».

«Det» is the usual offender: name the noun. «For den plane pendelen er det snordraget» → «For den
plane pendelen er føringskraften snordraget»; «Det gir hver hendelse fire tall» → «Referansesystemet
gir …». A «dette» that points forward at a formula the reader has not seen yet does not resolve
either: say what it is in the sentence itself. And a thing that stands on its own needs no
back-reference: «den plane pendelen», not «den plane pendelen fra starten av seksjonen».

An antecedent the reader must scroll back for does not resolve. «De tre tallene som er igjen» stood
after a callout, a tensor paragraph and an exam task, twenty lines below «tre tall er igjen». Past
the previous paragraph, restate the fact: «Ortogonaliteten binder seks av de ni elementene i R, så
orienteringen er gitt ved tre tall.»

### 3.6 Be willing to be plain

"Gitterkonstanten i silisium er 5,431 Å." Full stop. Not every sentence has to work.

### 3.7 Worked examples

Real numbers, checked arithmetic, units. Show the substitution, not just the result. Keep the solution
to the steps a student would actually write. The solution to a quoted exam task is written the same
way, in the guide's words, and its final answer is checked against the official solution where one
exists; do not paste the official solution.

### 3.8 Notation follows the course

§3.1 applies to symbols too. Before the first formula uses a symbol with more than one common
convention — $k$ vs $k_B$ for Boltzmanns konstant, sign conventions, primed vs starred masses —
check what the course's own authored material writes (problem sets, lecture notes, exams) and use
that. The textbook does not settle it: where book and lecturer disagree, the lecturer's material
wins, because that is the notation the reader must produce on the exam. Apply the choice everywhere
the reader sees it — prose, formula collection, symbol list, glossary, sim readouts. The symbol list
(`course.yaml` `symbols[]`) is where a collision gets its one-line warning («ikke energien $E$»),
so the reader who meets $\mathcal{E}$ mid-formula has somewhere to look it up.

### 3.9 Earn every step

The reader follows the text one step at a time. A number, formula or condition that arrives without
its source stops them.

- **Construct a formula; do not announce it.** A formula with a specific shape needs the reason for
  that shape: say what it must do, then show which requirement forces which term. If it is the most
  general form, prove that too. A check afterwards («og Lagranges ligninger gir Lorentzkraften»)
  confirms a formula, it does not explain it. The charged-particle Lagrangian is built from
  $\vec E = -\nabla\phi - \partial\vec A/\partial t$: the $-q\,\partial\vec A/\partial t$ term is a
  time derivative, only $\frac{d}{dt}\partial U/\partial\dot{\vec r}$ can produce one, so $U$ needs
  $-q\,\dot{\vec r}\cdot\vec A$.
- **Show the step that makes the result.** When a model is set up in words, the one inference that
  produces its headline result is the step to show. «Noen energiintervaller mangler løsning uansett
  $k$» needs its reason: the equation has the form $\cos ka = f(E)$, and an energy with
  $|f(E)| > 1$ has no $k$. The same holds for a claim of direction or order («rødt ytterst, fiolett
  innerst» needs red's lower $n$), and for a learning goal that says «Forklar hvorfor»: the text
  gives the counting or the invariant, not an assertion or one hand-picked case.
- **Give the physical reason before the algebra.** When a result has a one-line physical reason,
  write it: with no torque, $\vec L$ is fixed in space, so its length is constant; a force
  perpendicular to the velocity does no work. Algebra that cancels indices may confirm the result,
  but does not replace the reason.
- **Derive first, take apart after.** Components, sizes and special cases of a result come after the
  derivation that produces it. A paragraph that splits the centrifugal term into components and then
  says «Lagt til $\vec g$ gir …» hands the reader $\vec g_\text{eff}$ without a reason. Start from
  the physical situation (a plumb bob at rest in $K'$, Newton's second law there) and let the formula
  fall out.
- **Read the result, then check it.** After a result, one clause says what it predicts or how it
  behaves in a case the reader already knows. $\Omega = (I_3 - I_1)\,\omega_3/I_1$ is zero for a
  sphere, and its sign says which way $\vec\omega$ circles for a flattened body and for an elongated
  one. An expectation value is not an outcome: say that no single measurement gives
  $\langle L_z\rangle = 9\hbar/14$.
- **Derive properly, in one place.** A derivation goes either fully in the text or fully in a
  `<Derivation>` dropdown, never stated in one place and half-derived in another. Keep it in the text
  when it *is* the point of the section (building the Lagrangian); fold it when it supports the point
  (why the gauge transformation has its form). A derivation the reader did in a prerequisite course
  goes in one dropdown, and the text states the result plainly, with no «Målet er …» framing.
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
- **A new method starts with what the old one cannot do.** Show where the reader's current tool loses
  the answer before the first step, not «Behold alle koordinatene» with no reason.
- **The instance before the machinery.** A section opens on the question its result answers, or on
  one case the reader can trace; the general definition, recipe or formalism comes after and names
  what they just watched. Introduce a formalism on the smallest case that can be written out in full:
  a two-level system before bras and kets in general, one interval-cover problem before the
  definition of a greedy algorithm, $\vec L \parallel \vec\omega$ before principal axes as
  eigenvectors. This is usually a reorder, not an addition.
- **Name what is «the same», and what is «sufficient» for what.** «gir samme svar» → «arbeidet er det
  samme». A sufficiency claim says which statement it secures and how it can fail (the hole in a region
  that is not simply connected).
- **An approximation comes with its test.** State the inequality that allows it (low injection: the
  excess is small next to the majority concentration on the lightly doped side), and let the first
  example that uses it check the inequality with its own numbers. The validity limit is in the
  running text, not only in a caption.
- **Say which way.** A sign or direction the reader must use is stated in words, with its reason,
  not left to sign bookkeeping. «Båndene følger potensialet» says the opposite of the truth; write
  that the band edge is the electron's potential energy, so the bands lie lowest where the potential
  is highest. A flow of carriers gets the direction of its electric current in the same sentence.
  A classical picture of a quantum state (a vector on a cone) says what it draws, the possible
  outcomes, not where the vector points.
- **Write a derivation as a chain**: «Hvis …, er … ⇒ …. Dette betyr at …, ettersom …. Da kan … skrives
  som …». Premise, implication, consequence, reason. Put ⇒ chains in display math; inline, they wrap
  mid-equation.
- **Check the direction of every «ettersom».** «∇ × ∇f = 0» shows that a gradient has zero curl, not
  that a field with zero curl is a gradient. The argument usually needs the second.
- **Definition first, remark after.** «En kraft er konservativ når …», then «De fleste kreftene i
  mekanikken er konservative».
- **Check every side claim before writing it.** «Friksjonen har ingen Lagrangefunksjon» is false
  ($L = e^{\gamma t}(T - V)$ gives damped motion). Never assert what the rest of the course does
  («resten av emnet bruker Galilei-transformasjonen», in a course whose last three weeks are special
  relativity); state facts about the subject instead.

### 3.10 Self-checks make the reader take a step

A `<Quiz>` or `<SelfCheck>` written for the guide puts the reader on a case the text did not spell
out: new numbers, a direction to predict, an instance to classify. It never asks for a sentence the
module just stated («Et afokalt system kjennetegnes ved …» is a table lookup). Every wrong option is
a mistake a reader who half understood the module would make, in the same length and form as the
right one; «finnes bare i vakuum» and «Fjærene er strukket til bristepunktet» test nothing. The
explanation says why the answer holds and where the tempting wrong option goes wrong. A quoted exam
task keeps the paper's options (§2).

---

## 4. Register: what these guides never sound like

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
- **Modern word order and plain verbs.** «og forlater den så» reads as old-fashioned; «lette» means
  lifting upwards, not leaving a surface («mister kontakten med overflaten»).
- **A sentence parses on the first read.** «for» meaning *fordi*, «når» meaning *rekker*, «under»
  meaning *nedenfor* and «til» meaning *inntil* each read first as the commoner word. When the
  sentence does not force the intended reading, the reader has to go back and decode it. «Omvendt er
  … en rotasjon, for Eulervinklene under når den med tre dreininger etter hverandre» stacks three of
  them. Before rewording such a sentence, ask whether the module needs it at all (§2, every claim has
  a job); this one was cut.
- **No abstract noun doing a person's thing.** «Argumentet spør hvilke systemer …»: arguments do not
  ask. Say what the reader does or what follows.

---

## 5. Worked examples of the failure modes

All of these are real, from a rewrite the maintainer rejected.

| Rejected | Why | Rewritten |
|---|---|---|
| Overgangen er telling. | verb crushed into a noun; not a sentence anyone says | Forskjellen kommer av hvor mange nivåer som ligger inntil hverandre. |
| knippet leses som et kontinuum | «knippe» coined for a thing already called *nivåer*; third word for one concept | ligger nivåene så tett at de danner et sammenhengende bånd |
| Gruppe IV er forsøket: | «forsøket» does not mean this; reads as nonsense | Grunnstoffene i gruppe IV viser det samme. |
| hvor godt **stykket** leder | no antecedent — which piece? | hvor godt **materialet** leder |
| krumningen er **vekslingskursen** som sier hvor mye fart hvert $k$-skritt kjøper | invented metaphor stacked two deep | hvor mye fart bæreren får ut av hvert steg i $k$, og det avgjøres av krumningen |
| den nederste **flisen** av båndet | coined vocabulary for "nederst" | helt nederst i båndet |
| Tre avlesninger bærer resten av uka. | slogan; "bærer uka" means nothing | Du leser tre ting ut av diagrammet. |
| en **tekstur** som gjentar seg | invented term for a periodic function | en **funksjon** som gjentar seg |
| der motprøvene bor | personification for its own sake | Gå til en av de nærmeste naboene |
| Bravais-egenskapen **ryker** i det øyeblikket forskyvningen forlater null | colloquial + overwrought | mønsteret er bare et Bravais-gitter når forskyvningen er nøyaktig null |

---

## 6. Simulations, figures and video follow the design system

The framework owns the design. A course-owned sim must look like it was drawn by the framework.

- **Never hand-roll chrome.** The framework provides `.sim-readout` for readouts and `.sim-btn` for
  buttons, and `_controls.js` for shared controls. Use them. Do not build your own bordered card with
  inline CSS.
- **Only framework tokens** for colour, radius, spacing and type: `var(--accent)`, `var(--muted)`,
  `var(--border)`, `var(--bg-elevated)`, `var(--radius)`, `var(--font-mono)`, `var(--text-sm)`. No
  hardcoded hex, rgb, pixel radii or font stacks — they break one of the two themes.
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
- **One idea per sim.** A simulation exists to show the thing prose cannot. If prose can carry it, use
  prose.
- **A sim explains; it never merely plots.** The reader must be able to do something that changes
  their understanding: move a lever the theory talks about and watch the consequence. A graph is
  allowed when the graph *is* the concept (a plateau, a crossover, a resonance), but an interactive
  redraw of a static figure is a figure, not a sim.
- **Budget the reader's attention.** At most one short readout sentence, and prefer none — put
  numbers and names into the drawing as labels on the things they describe: a labelled zone beats a
  sentence naming it, a marked axis tick beats "at 300 K" in text. A readout that never changes with
  the controls is dead weight; delete it. Every number on screen costs attention the shape was
  supposed to earn.
- **A caption says what is drawn.** A `<Simulation>` caption names the system and what the marks and
  colours stand for, usually in one or two sentences. It does not say which control to move, since
  the controls show that, and it never narrates what happens: the result is the reader's to find,
  and the running text states it.
- **Plot in the reader's coordinates.** Use the axis the reader thinks in (temperature, distance,
  time), not the axis a textbook's analysis technique uses (reciprocal, mirrored, Arrhenius). The
  analysis form is a skill prose can teach; a sim that requires decoding its own axes explains
  nothing. One caption sentence may bridge to the book's convention.
- **Legible at phone width first.** Verify every sim at ≈390 px in both themes, including the slider
  extremes: axis titles short enough not to clip, few enough ticks that labels cannot collide, and
  in-drawing labels that shorten or drop when their region gets too narrow. If a label does not fit
  on a phone, the fix is fewer words in the drawing, not smaller type.
- **A video is optional, never the argument.** A good video is a reward: edutainment that makes the
  idea stick, or simply a cool or fun watch that gives the reader a break. It may restate what the
  module says. The module has to work for the reader who never clicks, so never write "se videoen for
  utledningen". Choose it as `AUTHORING.md` §3 describes: about the very idea of the passage it sits
  next to, a good watch from a channel that will last. Most modules have none, and one is usually
  enough. The card is built from text you type, so `title`, `channel`, `duration` and `caption`
  follow the same rules as any other reader-visible text. The caption says what in the video is worth
  it for this module, and only what you have checked the video contains.
- **Captions render inline math.** Since v4.4.2 `<Simulation caption>` and `<Stepper caption>` run
  the same `$…$` renderer as `<Figure caption>`, so write `$\Delta k$`, not a bare Unicode `Δ`.
  `AUTHORING.md` §6 lists every prop that renders math.

---

## 7. Before you call a module done

In addition to the definition-of-done in `AUTHORING.md` §8:

- [ ] **Audience established from the course page**, not assumed, and nothing re-taught that the
      prerequisites already cover.
- [ ] **Word count measured** with the command in §2, and in the neighbourhood of the budget.
- [ ] **Scope is exactly this week's** syllabus; nothing adjacent added.
- [ ] **Exam tasks quoted verbatim** and opened by `<ExamRef>`; every sub-question quoted is solvable
      from this module plus prerequisites; answers checked against the official solution; every
      multiple-choice task is a `<Quiz>` with the paper's alternatives, never a list in prose.
- [ ] **No formula broken at an unnatural place.** A wide formula scrolls, which is fine; one that
      wraps after `=` or at a `\qquad` comma reads as broken. `aligned` only at natural seams;
      a continuation that should wrap only on phones gets `\allowbreak` (AUTHORING.md §6).
- [ ] **No forward reference to a week, module number or date** anywhere, including `course.yaml`
      entries and simulation captions.
- [ ] **Every sim checked at phone width** (≈390 px, both themes, slider extremes): no clipped or
      colliding labels, readouts within the one-sentence budget of §6.
- [ ] **Zero long dashes** in the module *and* in the `course.yaml` entries it added.
- [ ] **One word per concept** throughout; no synonym introduced for variety.
- [ ] **No coined metaphor or vocabulary**; every analogy is standard and cashed out.
- [ ] **Every pronoun and definite noun resolves**, every «det» included.
- [ ] **Every formula with a specific shape is constructed or derived** (§3.9), fully in the text or
      fully in a `<Derivation>`; every «ettersom» checked for direction; every side claim checked.
- [ ] **Every headline result shown, read and checked** (§3.9): the step that produces it is in the
      text, it gets one clause on what it predicts or a known case it reduces to, every approximation
      comes with its test, and every sign or direction is stated in words.
- [ ] **Nothing the text relies on lives only in small print** (§2): no definition, rule or reason
      only in a caption, quiz explanation, glossary entry or dropdown. Each point a returning reader
      needs is restated in a short `<Callout>`.
- [ ] **One account per object** (§3.1): no two descriptions of one thing left unreconciled, and no
      later passage that quietly breaks an earlier statement.
- [ ] **Every self-check makes the reader take a step** (§3.10), with distractors that are real
      mistakes; every sim caption says what is drawn and narrates nothing.
- [ ] **§4 read against the finished text**, including reader-visible props: captions, `<Quiz>` options
      and explanations, `<Callout>` titles, `<Answer>`, `<Statement>`, `<LearningGoals>`,
      `<KeyTakeaways>`. Read it, do not just count it.
- [ ] **`course.yaml` swept too** — labels, symbol meanings and definitions reach the Formelsamling,
      Symboler and Begreper pages independently of the module, so a phrase fixed only in the `.mdx`
      still ships.
- [ ] **Sims use framework classes and tokens only.**
- [ ] **Every `<Video>` checked**: link opened and still playing, caption matched against what the
      video contains, video about the passage it sits next to, and the module reads complete without it.
- [ ] `pnpm build` green.

Read the built page before shipping. Prose that looked fine in the editor often reads as padding on the
page.
