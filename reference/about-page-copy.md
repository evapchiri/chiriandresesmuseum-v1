# About page copy — Lab notes & Lessons learned

*Source-of-truth markdown for the two panels on the About page ("Lab notes" and "Lessons learned"). This is the approved copy as of 26 August 2026 — drafted and reviewed in a Cowork session, hand-authored from the private journal at `reference/lab-notes/` (never linked or exposed directly — see `CLAUDE.md`).*

**This file is parsed directly by `scripts/build.js`** (see `renderMarkdownSection()` / `parseAboutPageCopy()`) — editing this file is the only thing you need to do to update the two panels; there's no separate HTML to hand-edit or keep in sync.

**Voice note:** Lab notes is deliberately casual and colloquial — contractions, fragments, loose rhythm — not rigid or report-like. Lessons learned is comparatively serious and thematic. Both were explicitly confirmed in review; if retouching, keep that split rather than tightening Lab notes back up.

**Supported syntax:** `##` marks the two top-level sections (`LAB NOTES`, `LESSONS LEARNED`) the build splits on — don't add a third. `###` headings, plain paragraphs, `**bold**`, `*italic*`, `` `code` ``, `[text](url)` links, and `> blockquote` all render as you'd expect. `- ` bullets make a list; a bullet can be followed by an indented (2-space) fenced ` ```gallery ` block to attach a gallery to that specific item. A paragraph written as `*[like this]*` — asterisk-bracket-asterisk — is treated as an internal editorial note and is stripped from the build entirely; use it for TODOs/placeholders that shouldn't reach the public page.

**Gallery blocks:** a fenced ` ```gallery ` block, one image per line as `filename.jpg :: alt text` (filenames are relative to `assets/img/lab-notes/`), with an optional first line `caption: ...` for a caption shown under the gallery. Can appear at the top level between paragraphs, or indented under a list item. Image/caption assignments below were cross-referenced against the private journal's own inline image placement, not guessed — if new images are ever added to a section, `reference/lab-notes/digitisation-lab-notes.md` is the place to check where in the story they actually belong.

---

## LAB NOTES

Day-to-day notes from the capture and processing sessions, kept close to how they actually happened — dead ends included.

### 16–22 February 2026 — Starting the project

Honestly, this started pretty last-minute. I was back in Spain for a week, about to move to Japan, looking through my parents' pile of travel souvenirs and family heirlooms — and it hit me that these two had basically been proto-archaeologists their whole lives without ever calling it that. Picking up objects, collecting stories, never writing any of it down properly. That was the spark. Not "let me practise some photogrammetry" so much as "I need to record these stories before the chance is gone."

```gallery
caption: The improvised studio set-up.
img-8349.jpg :: The improvised home studio set-up: turntable, LED lights, and a tablecloth as backdrop
```

Dusted off the camera — quite literally — and spent the first couple of days just testing rather than shooting for real. First proper attempt, an early test I called CHAN-002, was a total write-off: 23 images, barely 1,000 tie points, software couldn't place a single camera. Turned out it wasn't the object's fault at all — my turning angle was too coarse, not enough overlap between shots. Tightened that up over a few rounds and landed a genuinely clean test model (CHAN-001B), over 42,000 tie points. That became the rule for the rest of the week: roughly 10° turning steps, generous overlap, front/top/bottom passes on everything.

```gallery
caption: The early failed alignments, then the successful CHAN-001B test.
img-3581.jpg :: The CHAN-002 test object, photographed for the very first alignment test
image-01.jpg :: Metashape failing to align any cameras from the first CHAN-002 test
image-02.jpg :: A second attempt after masking the CHAN-002 images
image-03.jpg :: A second attempt after masking the CHAN-002 images
image-04.jpg :: A second attempt after masking the CHAN-002 images
image-05.jpg :: CHAN-003 test with more overlap, some gaps still left
image-06.jpg :: A more detailed top scan with increased photo overlap
image-07.jpg :: A more detailed top scan with increased photo overlap
image-08.jpg :: The successful CHAN-001B test — a near-perfect camera alignment
image-09.jpg :: The successful CHAN-001B test, over 42,000 tie points
```

By the end of the week I'd photographed 17 objects (some in pairs), around 400 images each. I was moving fast and I knew it — camera settings, aperture, depth of field, most of it figured out on the fly rather than from any real confidence. Got me a usable dataset in the end, but a slower start would've probably saved me grief later.

### 20–25 March 2026 — Standards research

Quieter week. Settling into Japan, and actually sitting down to read properly: the European Commission's VIGIE 2020/654 study on 3D digitisation quality, and the 3D4CH Competence Centre's *Essential Guide to 3D Digitised Heritage* series. This is where the project actually got its backbone — the standards it's trying to hold itself to — before any of the real processing started.

### April — one object at a time

The long stretch. Running each of the 17 objects through Metashape, one by one, and somehow hitting a completely different problem almost every single time.

```gallery
caption: The workflow steps, screenshot by screenshot.
image-10.jpg :: CHAN-001 with a hole at the top after chunk alignment
image-11.jpg :: Photo alignment settings
image-12.jpg :: Build mesh settings
image-13.jpg :: Importing masks from model
image-14.jpg :: Aligning the merged chunk with new settings
image-15.jpg :: The alignment starting to look right
image-16.jpg :: Clean tie points settings, first pass
image-17.jpg :: Clean tie points settings, second pass
image-18.jpg :: Optimise cameras settings
image-19.jpg :: Build mesh settings, final pass
image-20.jpg :: The model after building — a working result
image-21.jpg :: Decimate model settings
image-22.jpg :: Build texture settings
image-23.jpg :: The finished CHAN-001 model
image-24.jpg :: The finished CHAN-001 model
image-25.jpg :: The confidence map for the finished texture — patchier than hoped
```

- **CHAN-001** went first and basically taught me the workflow — align, build mesh, import masks, merge chunks, clean tie points, optimise cameras, decimate, texture. Everything else followed some version of this.
- **CHAN-002**: first real casualty. Deep black, shiny surface — exactly the kind of material photogrammetry hates, not enough contrast for the software to find matching points between photos. Half-suspected this already from the week-one test; reshooting with "proper" images didn't help. The actual fix — cross-polarised lighting — I didn't even know existed yet, and by the time I did, I'd left Spain and couldn't recapture. Good early lesson in diagnosing *why* something fails instead of just shrugging and moving on.
- **CHAN-003**: processed cleanly apart from one gap, a small patch under the bird motifs the camera just never saw. No amount of software cleverness recovers detail you never captured in the first place — the model can only be as complete as the photography was, full stop.
- **CHAN-004**: the fight of the month. A pair of anthropomorphic figures with thin, fine geometry that kept collapsing into itself during reconstruction. I called it "the gap hunt" — script-based tie-point cleaning, alternate masking, an "Automatic (AI)" masking mode I stumbled into almost by accident. CHAN-004B never aligned. Not once, not by any method. Dropped it. CHAN-004A wasn't much better off at this point either — that one's a whole separate saga, it doesn't actually get sorted until May (more on that below).

  ```gallery
  image-26.jpg :: Metashape / Reddit-sourced settings tried during "the gap hunt" on CHAN-004
  image-27.jpg :: Metashape / Reddit-sourced settings tried during "the gap hunt" on CHAN-004
  image-33.jpg :: Tie points selected by colour, ready to delete, during a later CHAN-004B retest
  image-34.jpg :: CHAN-004B getting closer to aligning, but still not quite there
  ```

- **CHAN-005**: the other total write-off. Individual sections aligned fine on their own but wouldn't merge — classic shiny-surface-behaving-inconsistently-across-viewpoints problem. Threw every alignment-quality combination I could think of at it. Some things just don't resolve with the data you've got, and you have to be okay with that.

  ```gallery
  image-32.jpg :: The FRONT chunk aligning, with a fair amount of noise from surface shine
  image-31.jpg :: The TOP chunk aligning separately
  image-30.jpg :: The two chunks failing to merge into one correct alignment
  ```

- **CHAN-006**: genuinely no drama here. Clean processing, barely a hiccup — just a slightly rugged patch on the top edge and that's it.

  ```gallery
  image-28.jpg :: CHAN-006 built at medium face count
  image-29.jpg :: CHAN-006 built at high face count
  ```

- **CHAN-007**: landed somewhere in the middle. Workable, but the source photos had focus problems on the finer bits, so I ended up picking the best of three similar figurines I'd shot for that slot and making do.

  ```gallery
  image-36.jpg :: Corners and extremities the software had no data to model correctly
  image-35.jpg :: Out-of-focus source images behind the poorly defined corners
  image-37.jpg :: The final "mid" result, after picking the best of three figurines
  image-38.jpg :: Areas still out of focus in the final model
  image-39.jpg :: Areas still out of focus in the final model
  ```

- Then **CHAN-008** happened and everything changed. Switched to AI-based automatic masking instead of hand-deriving masks and a 4-hour job dropped to under an hour. Single biggest workflow change of the whole project, hands down.

  ```gallery
  image-40.jpg :: Testing the new AI-masking workflow on CHAN-008
  ```

### Late April — learning Blender, and a tool of my own

By the end of April I'd started properly learning Blender — texture maps, retouching — and my partner Rob had gone and built me something I hadn't even asked for: **HeritageScan**, a command-line photogrammetry tool built on Apple's RealityKit SDK, made specifically to try a different reconstruction approach on the objects Metashape couldn't crack.

### 1–19 May 2026 — Retouching, and finishing the nine

This is where the technical work and the "wait, is this actually authentic?" question started properly bleeding into each other. I was in Blender working on CHAN-007's metallic map — painting shine intensity by eye, because there was genuinely no way to measure it — and that was the exact moment the question of *authentic* specularity stopped being some abstract thing and became a real problem I had no answer to. CHAN-003, CHAN-009 and CHAN-016 all needed their own smaller fixes too — patched textures where the coverage just wasn't there, a hand-built roughness map for a set of stone eggs that all had wildly different natural shine to them. None of this was invisible tinkering, either — it's all disclosed, object by object, rather than quietly smoothed over like it never happened.

This is also finally where CHAN-004A got sorted, using HeritageScan after Metashape alone just couldn't get there. Except — even sorted, it needed so much manual repair that by the end I looked at it and decided it wasn't an honest enough representation of the object to include. So it's "resolved" in the sense that a model exists, but it didn't make the finished set (more on why in Lessons learned).

By 19 May, nine objects had actually made it to a point I was willing to call finished. Not "a model exists" finished — finished as in it still genuinely looks like the object it's meant to be a twin of.

```gallery
caption: The finished nine, and selected retouching before/afters.
image-41.jpg :: The finished nine, gathered together
image-42.jpg :: The finished nine, gathered together
image-43.jpg :: A selected retouching before/after
```

### 19 May – 1 July 2026 — Sharing them

Didn't keep notes for this bit at the time, honestly didn't think it needed logging. Uploaded the individual models to Sketchfab, wrote up each object's story from whatever my parents could remember, and put together a short video with all nine models together for LinkedIn.

Turns out that LinkedIn post is where the authenticity question first went public, in my own words, before I'd worked out what I actually thought about it:

> "My biggest takeaway was to acknowledge the limitations we face in building as-authentic-as-possible metal and roughness maps with Photogrammetry without relying on some degree of human interpretation. Is this even possible to achieve?"

### 1 July 2026 — A pause

Put the project down to focus on the Europeana Digital Storytelling Residency. Sometimes the honest note really is just: not every thread gets worked continuously, and that's fine.

### 15 August 2026 — Back to it

Picked it back up, this time chasing retopology, texture-map baking, and Kintsugi 3D Builder experiments — basically a proper go at answering the authenticity question this time round, with actual measured specularity capture instead of eyeballing shine values. Early days on this bit still. More to come.

*[This section is intentionally short — fuller notes for this phase haven't been written up yet. Once they are, in `reference/lab-notes/digitisation-lab-notes.md`, this section should be expanded to match.]*

---

## LESSONS LEARNED

What worked, what didn't, and what I'd do differently next time.

### On photography and capture

Cross-polarisation would have saved a genuine object (CHAN-002) and a lot of hours on others. I didn't know about it going in; I do now, and it's non-negotiable for anything dark, shiny, or metallic on the next capture. Working distance and lens choice also matter more than I expected — backing off and using a longer lens beats getting close with a kit lens, especially on reflective surfaces, and matters more than which specific flash or light source you use.

Angle coverage and turning-degree discipline directly decided whether an object aligned at all. Roughly 10° steps with genuine overlap was the difference between a write-off and a clean model in the very first week — worth getting right before the "intense" photography sessions start, not worked out mid-campaign.

### On processing and software

The single biggest efficiency gain of the whole project was switching from manually-derived masks to AI-based automatic masking — a 4-hour process became a 45-minute one. If I'd found this earlier, several of the objects I gave up on might have had another shot.

Clean alignment statistics are not proof of a correct model. CHAN-004A's Metashape report reads as cleanly as any successful object's — low reprojection error, solid tie-point count — and the model still needed extensive, imperfect manual repair to look right. Reprojection error tells you the camera positions solved consistently; it says nothing about whether the geometry is actually correct. I'd trust a clean report a lot less on its own now. In the end, that gap between clean stats and correct geometry was exactly why CHAN-004A didn't make the finished set at all — see the Lab notes above.

Knowing when to stop is its own skill. CHAN-002, CHAN-004B, and CHAN-005 all got abandoned after genuinely trying multiple approaches — and that was the right call each time, not a failure of persistence. A model that technically "exists" but needs disproportionate manual reconstruction to look like its object isn't a finished model; it's a different kind of failure that's easy to mistake for success.

### On tooling

HeritageScan, the custom tool my partner built, is a real and useful differentiator — but a narrower one than I originally thought. It resolved exactly one object (CHAN-013) that Metashape's standard pipeline couldn't. Two others I initially credited to it were actually resolved through improved Metashape workflow instead. Worth remembering: cross-check what a tool actually did against the output evidence, not against what you expected it to do.

### On authenticity

Photogrammetry gives you geometry and colour from photographs; it doesn't give you material properties like roughness or metallic reflectivity for free. Every one of this project's roughness/metallic maps that needed manual creation (CHAN-007, CHAN-016) was judged by eye against the physical object, not measured — and that gap, not the modelling itself, is what's driving the next phase of this project. I don't yet have a good answer to how professionals close it without some degree of human interpretation. That's genuinely still open.

### What I'd do differently

Slow down at the very start. A more deliberate first day or two testing camera settings and studio set-up, before the "intense" photography sprint, would likely have paid for itself several times over in objects that didn't need to be abandoned.

Keep the notes going, even when nothing seems worth logging. The gap between 19 May and 1 July — where Sketchfab uploads and a public LinkedIn post happened with zero written notes — is exactly the stretch where the authenticity question actually started, and I only have it preserved because I happened to write a public post about it. Undocumented process is a real risk, not just an inconvenience, on a project whose whole point is a documented process.
