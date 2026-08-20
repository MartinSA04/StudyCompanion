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
| Reading time per module | 10–20 minutes |

Measure, do not estimate:

```bash
awk 'NR>1 && /^---$/{fm=1; next} fm' FILE \
  | grep -vE '^\s*<|^\s*\}|^\s*\]|^\s*/>' | wc -w
```

**A companion is not a textbook.** If a module is over budget, the fix is to cut, not to split into more
modules: splitting bloated text produces more bloated text with more navigation.

### Scope discipline

Cover **exactly** the syllabus for that week, and nothing adjacent. Do not pull in the next week's
material, and do not add topics because they are interesting or because a source you read covered them.

If you believe the scope is wrong, say so to the maintainer. Do not fix it by writing more.

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
| hvilken masse som gjelder når, kommer i uke 35 og 36 | hvilken masse som gjelder når, avhenger av hva du regner på |
| de samme ionene bygger romladningssonen i uke 37 | de samme ionene bygger romladningssonen i pn-overgangen |
| dette utledes i modul 3 | *(omit)* |

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

### 3.6 Be willing to be plain

"Gitterkonstanten i silisium er 5,431 Å." Full stop. Not every sentence has to work.

### 3.7 Worked examples

Real numbers, checked arithmetic, units. Show the substitution, not just the result. Keep the solution
to the steps a student would actually write.

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

## 6. Simulations and figures follow the design system

The framework owns the design. A course-owned sim must look like it was drawn by the framework.

- **Never hand-roll chrome.** The framework provides `.sim-readout` for readouts and `.sim-btn` for
  buttons, and `_controls.js` for shared controls. Use them. Do not build your own bordered card with
  inline CSS.
- **Only framework tokens** for colour, radius, spacing and type: `var(--accent)`, `var(--muted)`,
  `var(--border)`, `var(--bg-elevated)`, `var(--radius)`, `var(--font-mono)`, `var(--text-sm)`. No
  hardcoded hex, rgb, pixel radii or font stacks — they break one of the two themes.
- **Match the existing sims.** Read the sims already in the course's `public/sims/` before adding one.
  They are the house style.
- **One idea per sim.** A simulation exists to show the thing prose cannot. If prose can carry it, use
  prose.
- `<Simulation caption>` renders as **plain text** — no KaTeX. Do not put `$…$` in it (unlike
  `<Figure caption>`, formula `label` and glossary `definition`, which do render math).

---

## 7. Before you call a module done

In addition to the definition-of-done in `AUTHORING.md` §8:

- [ ] **Audience established from the course page**, not assumed, and nothing re-taught that the
      prerequisites already cover.
- [ ] **Word count measured** with the command in §2 and inside budget.
- [ ] **Scope is exactly this week's** syllabus; nothing adjacent added.
- [ ] **No forward reference to a week, module number or date** anywhere, including `course.yaml`
      entries and simulation captions.
- [ ] **Zero long dashes** in the module *and* in the `course.yaml` entries it added.
- [ ] **One word per concept** throughout; no synonym introduced for variety.
- [ ] **No coined metaphor or vocabulary**; every analogy is standard and cashed out.
- [ ] **Every pronoun and definite noun resolves.**
- [ ] **§4 read against the finished text**, including reader-visible props: captions, `<Quiz>` options
      and explanations, `<Callout>` titles, `<Answer>`, `<Statement>`, `<LearningGoals>`,
      `<KeyTakeaways>`. Read it, do not just count it.
- [ ] **`course.yaml` swept too** — labels and definitions reach the Formelsamling and Begreper pages
      independently of the module, so a phrase fixed only in the `.mdx` still ships.
- [ ] **Sims use framework classes and tokens only.**
- [ ] `pnpm build` green.

Read the built page before shipping. Prose that looked fine in the editor often reads as padding on the
page.
