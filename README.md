# hadihajibagheri.github.io

Personal site for Hadi Hajibagheri. Static HTML, CSS and about 6 KB of JavaScript —
no framework, no build step, no dependencies to install. What is in this repository is
exactly what the browser receives.

**Live:** https://hadihajibagheri.github.io/

---

## 1. Put your photo on the site

Replace one file:

```
assets/img/portrait.jpg
```

Keep the **same filename and extension** (`portrait.jpg`) and nothing else needs changing.
The image is shown as a square, so crop it square first — around 900 × 900 pixels is
plenty. The site renders it in grayscale and returns it to full colour when a visitor
hovers over it.

If you would rather use a different file, change the `src` on the one `<img>` inside
`index.html` marked with the comment `<!-- PORTRAIT: ... -->`.

---

## 2. Add or edit a project

Projects live in **two places**, and both are marked with comments so they are easy to find.

### 2a. The full description — `projects.html`

Find the comment `ADDING A PROJECT`, then copy any whole block that looks like this and
paste it at the end of the list, just before the closing `</div>`:

```html
<article class="spec" id="my-project">
  <span class="spec-id" aria-hidden="true">12</span>
  <h3 class="spec-name">My Project</h3>
  <dl>
    <div class="spec-row">
      <dt class="micro">Domain</dt>
      <dd>Full-stack · Something</dd>
    </div>
    <div class="spec-row">
      <dt class="micro">What it is</dt>
      <dd>
        Three or four sentences in plain language. Say what the thing does and what
        problem it solves before you say how. Assume the reader is smart but does not
        know your stack.
      </dd>
    </div>
    <div class="spec-row">
      <dt class="micro">Mechanism</dt>
      <dd>One sentence naming the actual technique holding the project up.</dd>
    </div>
    <div class="spec-row">
      <dt class="micro">Trade-off</dt>
      <dd>One honest sentence about what this approach costs.</dd>
    </div>
  </dl>
  <div class="spec-foot">
    <a class="btn" href="https://github.com/HajibagheriLabs/MyProject" target="_blank" rel="noopener">Source →</a>
    <span class="spec-stack"><span class="tag">Next.js</span><span class="tag">Postgres</span></span>
  </div>
</article>
```

Then change six things:

| Change | To |
|---|---|
| `id="my-project"` | a short lowercase slug, no spaces — this becomes the link anchor |
| `<span class="spec-id">12</span>` | the next number in the sequence |
| `<h3 class="spec-name">` | the project name |
| the four `<dd>` blocks | your own text |
| the `href` on the button | the repository or live URL |
| the `<span class="tag">` items | the technologies, one per tag |

Also add the new project to the **jump list** near the top of `projects.html`:

```html
<a href="#my-project">12 My Project</a>
```

### 2b. The one-line row — `index.html`

In `index.html`, find the comment `ADDING A PROJECT?` inside section `§ 04`, copy one
`<tr>` block, and edit it:

```html
<tr>
  <td class="c-id">12</td>
  <td class="c-name"><a href="projects.html#my-project">My Project</a></td>
  <td class="c-domain" data-label="Domain">Full-stack</td>
  <td class="c-prim" data-label="Load-bearing idea">The single idea the project is built around</td>
</tr>
```

The `href` must match the `id` you used in `projects.html`, with a `#` in front. Keep the
`data-label` attributes — they are what the table turns into on a phone.

### 2c. Optional — promote it to the front page

The four cards in `§ 03 Selected work` on `index.html` are a hand-picked shortlist. To
change which projects appear there, edit those cards directly; they use the same block
structure as `projects.html` but drop the `Domain` row. If you add a fifth, also update
the line that reads `Four of eleven`.

### Writing the descriptions

The site keeps a deliberate voice, worth matching:

- **Not one line, not an essay.** Three or four sentences for *What it is*, one each for
  *Mechanism* and *Trade-off*.
- **Lead with the problem**, then the solution. "Two customers buy the last item at the
  same moment" beats "atomic inventory reservation system".
- **Keep the trade-off honest.** Every card admits what its approach costs. That section
  does more for credibility than any of the rest, so do not delete it.
- **No invented numbers.** If a figure appears on this site it should be one you can
  defend. Use an `Evidence` row (see MaintAdapt) only when you have real measurements.

---

## 3. Edit the other text

Everything is plain HTML, in reading order, in `index.html`:

| Section | What lives there |
|---|---|
| `§ 00` Hero | Name, the three role labels, the opening paragraph, the four availability readouts |
| `§ 01` Profile | Photo, three-paragraph bio, the four "what I am available for" cards |
| `§ 02` Systems | Four technical clauses with the small labels in the left margin |
| `§ 03` Selected work | The four featured project cards |
| `§ 04` Project index | The table of every project |
| `§ 05` Contact | Email, GitHub, LinkedIn, Instagram, and the colophon |

To change the availability wording, edit the `.readout` blocks in `§ 00` and the
`.avail` pills in `§ 01`. `avail-open` renders green; drop that class for a neutral pill.

---

## 4. Preview it before publishing

Open a terminal in this folder and run any static server:

```bash
python -m http.server 8080
```

Then visit `http://localhost:8080`. Opening `index.html` by double-clicking also works,
but a server matches what GitHub Pages will do.

---

## 5. Publish

Committing to `main` publishes the site. GitHub Pages serves this repository directly —
there is no build and no workflow to wait for, so changes appear within a minute or so.

```bash
git add -A
git commit -m "Add My Project"
git push
```

---

## 6. What is where

```
index.html               The whole front page, sections 00-05
projects.html            All project descriptions, one card each
404.html                 Shown for any unknown address
assets/css/site.css      All styling. Colours and sizes are the variables at the top.
assets/js/site.js        Navigation state, scroll reveal, status bar
assets/js/residency.js   The animated strip in the hero
assets/fonts/            IBM Plex Mono and Inter, self-hosted
assets/img/portrait.jpg  Your photo — replace this file
assets/img/og.png        The preview card shown when the link is shared
.nojekyll                Tells GitHub Pages to serve the files as-is
```

The design contract this site was built against (`DESIGN-A-SIGNAL.md`) is kept on your
machine rather than in this repository, so it is not published alongside the site.

---

## 7. Rules the design holds itself to

Worth knowing before changing the CSS, because breaking these is what makes a site like
this start to look ordinary:

- **One accent colour**, amber, appearing at most three times per screen. It is used for
  the active navigation marker, the hero strip, and hover and focus states. Do not use it
  as a background fill.
- **Hairlines instead of shadows.** There is no drop shadow anywhere and no corner radius
  above 2px.
- **Dark only.** There is no light mode, and adding one would be a different design rather
  than a colour swap.
- **No animation longer than 400 ms**, and the whole site must still work with JavaScript
  disabled or with reduced motion turned on.
- **Spacing comes from the scale** at the top of `site.css` (`--s1` … `--s10`). Avoid
  inventing new values.
