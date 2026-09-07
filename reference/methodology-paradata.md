# Chiriandreses Museum — Methodology & Paradata Documentation

_Eva Perez Chirinos_

## How to use this document

This document has two parts. Part A is the project overall methodology — my approach, covering standards, equipment, what succeeded and failed, and why. Part B is the full merged record for each finished object's metadata, paradata, and processing, post-processing retouches and finally public narrative, all in one place. A list of related project documents can also be found at the end of this document.

## Contents

- Part A — Project methodology note
  1. Reference framework
  2. Scope, objectives, and team
  3. Equipment and software
  4. Capture campaign summary
  5. What didn't survive, and why
  6. Custom tooling
  7. Material authenticity note — metallic and roughness maps
  8. Licence
- Part B — Object data (merged records)
  - CHAN-001, CHAN-003, CHAN-006, CHAN-007, CHAN-009, CHAN-012, CHAN-013, CHAN-016, CHAN-017
- Related project documents

---

## Part A — Project methodology note

### 1. Project's framework

This project's methodology aimed to follow the European Commission's VIGIE 2020/654 study on quality in 3D digitisation of tangible cultural heritage, adapted throughout for a solo practitioner working with personal, non-fragile objects rather than an institutional team and archival-grade holdings. Planning and capture practice also drew directly on the 3D4CH Competence Centre's _Essential Guide to 3D Digitised Heritage_ training series, particularly it's "Part 2": "Capturing and Processing 3D Data," presented by Catherine Anne Cassidy of CARARE. Additional technique guidance came from photogrammetry community forums and Youtube tutorials on enhancing the quality of photogrammetry models for their reusability in VR, AR or web-based viewing platforms. (Micro Singularity & Dimitris Katsafouros).

### 2. Scope, objectives, and team

- **Project**: Chiriandreses Museum — Digitisation (EP-001) and Chiriandreses Museum — Webapp (EP-002)
- **Objective**: generate high-quality 3D models of a family heirloom and travel-souvenir collection, following Europeana-aligned standards for model, metadata, and paradata, and make them accessible through a purpose-built web experience
- **Team**: I led capture, processing, and documentation. Custom tooling was developed in collaboration with my partner, **Robert Upson**, a Senior Software Engineer with 8 years of professional experience, to address reconstruction failures that the standard pipeline could not resolve with a different software algorithm than the project's standard (Metashape) (see Section 6).
- **Client / subjects**: my parents' heirloom and cultural objects collection, currently held in Spain.
- **Licence**: CC BY-NC-SA 4.0 (Attribution–NonCommercial–ShareAlike)

### 3. Equipment and software (consistent across the set)

| Category                | Detail                                                                                                                            |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Camera                  | Canon DSLR 2000D                                                                                                                  |
| Lens                    | EF-S 18-55mm IS II                                                                                                                |
| Lighting                | 2x NEEWER portable lights, dimmable 5600K 1000LM, white diffuser filter                                                           |
| Turntable               | Home turntable rig, white background                                                                                              |
| Scale reference         | Homemade, accurate to ±1mm                                                                                                        |
| Colour profile          | sRGB IEC61966-2.1                                                                                                                 |
| Photogrammetry software | Agisoft Metashape Standard v2.2.2                                                                                                 |
| Supplementary tooling   | HeritageScan (custom CLI, RealityKit-based) for different algorithm usage in already photography alignment failures in Metashape. |
| 3D post-processing      | Blender                                                                                                                           |
| Compute                 | MacBook M2 2022, 16GB                                                                                                             |

### 4. Capture campaign summary

18\* objects photographed across single and paired items from the family collection, during a single week access to the objects at my parents' home in Spain, immediately before my relocation to Japan (16–22 February 2026).

Re-photographing the objects was not possible after the fact — the objects are not accessible for recapture, which shaped several decisions documented below.

(\*) One further item, CHAN-001B, was photographed only as an early technical test — to calibrate camera and Metashape settings before the main campaign — and was never revisited for a finished capture. It sits outside the count of 18 and outside the finished object set entirely.

| Target accuracy: ±5mm. | Target resolution: 1.5mm. | Target reprojection error: 1.5px.

**COMPLETED OBJECT MODELS (9):**

| ID       | Object                        | Notes                                                                                                                 |
| -------- | ----------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| CHAN-001 | Marrakech's Koutoubia replica | No post-capture textural correction required                                                                          |
| CHAN-003 | Berber candlestick            | Blender-retouched: small missing texture areas from an uncaptured surface section                                     |
| CHAN-006 | Chinese personal seal         | Clean processing, no significant issues                                                                               |
| CHAN-007 | Thai dancer figurine          | Blender-retouched: metallic texture added; source images had focus limitations — see known limitations below          |
| CHAN-009 | Chinese rhyton                | Blender-retouched: small missing textures; successfully reconstructed via standard Metashape after initial difficulty |
| CHAN-012 | Box of little birds           | Clean processing                                                                                                      |
| CHAN-013 | Senegalese car toy            | Successfully reconstructed via HeritageScan                                                                           |
| CHAN-016 | Box of stone eggs             | Blender-retouched: glossy texture added                                                                               |
| CHAN-017 | Mysterious stone foot         | Clean processing                                                                                                      |

**Completion criteria.**

A model was only counted among the finished 9 if it met the agreed accuracy target _and_ remained a credible representation of the object without disproportionate manual reconstruction. Technical success — a model exists — was treated as necessary but not sufficient. CHAN-004A is the clearest instance of an object that cleared the first bar and failed the second: it has a working model, and it is not part of this project's public output.

### 5. What didn't survive, and why

Documented here by actual cause rather than a general "reflective surfaces" gloss — each failure was a distinct technical challenge, and knowing which one occurred is what would inform a different approach next time.

- **CHAN-002**: deep black, shiny surface. Photo alignment failed completely from the first step — Metashape could not establish enough common tie points between images to generate any point cloud, even after masking all source images. Diagnosed as a specular-highlight/low-contrast-surface problem inherent to standard photogrammetry on this material. Cross-polarisation at capture would likely have resolved it; recapture is not possible, as the object remains in Spain.

- **CHAN-004A / CHAN-004B** (paired anthropomorphic figures): both suffered from a combination of difficult texture data and insufficient photography angle coverage, compounded by fine, thin geometry at the waist that repeatedly merged with adjacent leg geometry during mesh building. Extensive troubleshooting was attempted — masking corrections, alternate depth-map sourcing, a custom tie-point colour-selection script to isolate and remove erroneous points. CHAN-004B could not be aligned by any method tried and was abandoned entirely. CHAN-004A's alignment eventually succeeded cleanly by the numbers, using standard Metashape — the final processing report shows 349 images, 330,910 tie points, and a 0.83px reprojection error, comparable to the project's other successful objects — but the resulting model had real defects (holes, incorrect surface reconstruction in problem areas) that clean alignment statistics didn't capture or predict. Reaching a presentable state required extensive, imperfect manual geometry and texture repair; even after that repair, the model wasn't judged an adequate representation of the physical object, and it was excluded from the finished set on that basis.

- **CHAN-005**: small decorative house-shaped boxes (wicker, wood, fabric lining), acquired in Hong Kong, 1989. High complexity from fine surface detail combined with a shiny finish, captured without cross-polarisation. Individual chunks (front, top) aligned cleanly on their own, but chunk-to-chunk merging failed across every tested combination of alignment quality and mask coverage, consistent with the surface behaving inconsistently across viewpoints. Set aside unresolved.

**A related lesson.**

Clean alignment statistics — reprojection error, tie point count — describe how consistently the software solved for camera positions. They don't guarantee the resulting geometry is correct. CHAN-004A's processing report reads as cleanly as any successful object's; the model itself still needed extensive, imperfect manual repair. Worth remembering when evaluating any photogrammetry output by its metadata alone.

**Known limitations on some completed models**:

- CHAN-003 has a small area of manually-patched texture where source coverage was incomplete.
- CHAN-007's source images had focus limitations on fine extremities, resulting in a lower-confidence model than the rest of the set, selected as the best of three related figurines photographed for this object slot.

### 6. Custom tooling: "HeritageScan"

Where Metashape's standard reconstruction failed due to high-specularity or dark textures, or low-featured surfaces, my partner, Robert Upson, developed a software as a different avenue to attempt photography alignment and geometric reconstruction called **HeritageScan** ("HS" in notes) a command-line photogrammetry tool built on Apple's RealityKit SDK. This software would test an alternative reconstruction algorithm (part of the SDK) against the same source images.

HeritageScan did not resolve any alignment challenges that were already seen from Metashape's algorithm, however, it did a better job than such. Regardless, not a completed object.

On the other hand, there was one particular object, **CHAN-013**, which had a better processing result using HeritageScan than the one done after loads of work with Metashape in 1/5 of time, and effort.

CHAN-004A and CHAN-009 were both initially expected to need HeritageScan's alternative algorith, but both were ultimately resolved using a different workflow in Metashape instead — aided by the improved AI-masking workflow adopted partway through the project (see the process journal).

### 7. Material authenticity note — metallic and roughness maps

Roughness and metallic map values for CHAN-007 and CHAN-016 were estimated by visual judgement during Blender post-processing, based on observed surface sheen — not derived empirically from the capture itself. CHAN-007 required a manually painted metallic map for the figurine's gilded areas, with shine intensity judged against the physical object rather than measured; CHAN-016 required a manually reconstructed roughness map reflecting the differing natural shine levels across the different stone types in the set, informed by memory and reference photographs rather than empirical data. It was while working on CHAN-007's metallic map, specifically, that the question of how professionals establish authentic specularity values without manual interpretation first became a live concern for me, rather than an abstract one.

This project's capture technique (standard turntable photogrammetry, February 2026) predates my exposure to camera-mounted flash / cross-polarisation methods, and empirically-based specularity capture (e.g. via Kintsugi 3D Builder) was not part of the original workflow. This is disclosed as a methodological limitation, not corrected retroactively, and is the specific gap I intend to address in the project's next phase, with a new, purpose-captured object.

### 8. Creative Commons License

CC BY-NC-SA 4.0. Attribution required; non-commercial use only; adaptations must be shared under the same license.

---

## Part B — Per-object metadata & paradata (merged record)

Each entry below merges four sources:

- The raw family metadata (materials, dates, measurements data obtained from my parents directly).
- The Sketchfab-ready narrative description.
- The capture-stage paradata (equipment, angles, image counts, and final Metashape processing figures).
- And the post-processing record.

The field key for post-processing terms used throughout:

| Field                | What it records                                                       |
| -------------------- | --------------------------------------------------------------------- |
| Retopology           | Method/tool, high-poly vs. final poly counts, delivery target         |
| UV unwrapping        | Approach, notable seams or compromises                                |
| Normal / AO map      | Baked from geometry, or hand-adjusted, and in what software           |
| Albedo / diffuse     | Derived directly, or colour-corrected/cleaned manually                |
| Roughness / metallic | Empirically derived, or estimated by eye — stated plainly either way  |
| Mesh cleanup         | Manual repair — hole-filling, non-manifold fixes, smoothing           |
| Reconstruction note  | Written at time of processing, or reconstructed from memory afterward |

---

### CHAN-001 — "Marrakech's Koutoubia replica souvenir"

**Metadata**

| Field        | Detail                                                  |
| ------------ | ------------------------------------------------------- |
| Type         | Souvenir, architectural replica                         |
| Materials    | Limestone (soapstone/steatite), hand-carved             |
| Measurements | Height 335mm, base 62×55mm, mid-section approx. 45×45mm |
| Weight       | 1,216g                                                  |
| Condition    | Very good, no damage                                    |
| Chronology   | 1990s (acquired August 1990)                            |
| Geography    | Morocco, Marrakech                                      |

**The story**:

> "Marakech's Koutoubia replica souvenir" — Limestone, hand-carved, 1990s. Architectural replica of the Koutoubia minaret in Marrakech, a 12th-century Almohad landmark known as the "sister" to the Giralda in Seville. Not just a "trinket" — it carries particular sentimental value for my family, particularly for my mother. It was purchased during her trip to Marrakech in the summer of 1990. My mother bought two of these: one for herself, and one as a gift for "a man she had recently met in Seville" (who would then later become her husband, my father). At the time, she was living in Madrid and aimed for this Koutoubia to serve as a persistent "reminder" of her every time he looked at it. A classic move, and a memento of my mother's persistence.

**Capture paradata**

| Field                                | Detail                                                                   |
| ------------------------------------ | ------------------------------------------------------------------------ |
| Dates of access                      | 18 February 2026                                                         |
| Complexity (object/surface/material) | Low / Low / Low                                                          |
| Recording challenge                  | Slightly reflective surface                                              |
| Acquisition angles                   | TOP @70°, FRONT @0°, BOTTOM FOCUSED @10°; 15–20° rotational steps        |
| Raw images per angle                 | 74 / 73 / 32                                                             |
| Final aligned dataset                | 147 images (of 179 raw captures — not all carried through chunk-merging) |
| Tie points                           | 81,535                                                                   |
| Reprojection error                   | 0.633px                                                                  |
| Model (raw)                          | 259,238 faces / 129,621 vertices                                         |
| Software                             | Metashape Standard 2.2.2                                                 |

**Post-processing**: Retopology: minimal, no reduction needed. UV: default Metashape unwrap. Normal/AO: not separately baked. Roughness/metallic: not created — no retouching flagged. Mesh cleanup: none. Reconstruction note: written at time of processing.

---

### CHAN-003 — "Berber candlestick"

**Metadata**

| Field        | Detail                                                             |
| ------------ | ------------------------------------------------------------------ |
| Type         | Souvenir, ceremonial-style candlestick with bird motifs at the top |
| Materials    | Soapstone (steatite), hand-carved                                  |
| Measurements | Height 220mm, width 170mm, depth 32mm                              |
| Weight       | 909g                                                               |
| Condition    | As new                                                             |
| Chronology   | 1991                                                               |
| Geography    | Morocco, Rabat                                                     |

**The story**:

> "Berber candlestick" — Soapstone (steatite), hand-carved, 1991. A souvenir purchased by my parents on their first ever trip together as a couple, in the Medina of Rabat. This traditional steatite carving, normally associated with the Berber culture of the Anti-Atlas, was historically favoured because soapstone is exceptionally heat-resistant, making it an ideal medium for lighting objects like this one. The shopkeeper insisted it was a "ceremonial Berber artefact" — but my mother was sure that was said to every tourist passing by. A valuable object for my parents, as it's a memento from the very beginning of my parents' relationship. Whether a sacred object or just a modern souvenir, this unique candlestick remains a heat-resistant, hand-crafted memento of the year their journey together started.

**Capture paradata**

| Field                                | Detail                                                                                                                                     |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Dates of access                      | 19 February 2026                                                                                                                           |
| Complexity (object/surface/material) | Medium / Low / Medium                                                                                                                      |
| Recording challenges                 | Deep holes at the top (bird attachment points) may not record fully; slightly reflective, dark brown surface in places; many inner corners |
| Acquisition angles                   | TOP @70°, FRONT @0°, BOTTOM @0°; 15–20° rotational steps                                                                                   |
| Raw images per angle                 | 74 / 78 / 88                                                                                                                               |
| Final aligned dataset                | 240 images                                                                                                                                 |
| Tie points                           | 72,047                                                                                                                                     |
| Reprojection error                   | 0.572px                                                                                                                                    |
| Model (raw, pre-retouch)             | 698,660 faces / 349,316 vertices                                                                                                           |

**Post-processing**: Retopology: none required. UV: default Metashape unwrap. Albedo/diffuse: manually corrected — the initial build left white, missing-data patches under the bird attachment points, where source coverage was incomplete; patched in Blender by clone-sampling colour-matched areas from adjacent, correctly-captured surface. Visually consistent, not independently verified against the physical object. Roughness/metallic: not created. Mesh cleanup: none beyond the texture patching above. Reconstruction note: reconstructed from memory, not contemporaneous.

---

### CHAN-006 — "Chinese personal seal"

**Metadata**

| Field        | Detail                                                                                                                                                                                                                                                                                                          |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Materials    | Family source data records this cautiously as "probably a soft stone, likely serpentine ('modern jade')" — the public Sketchfab description below uses the more specific attribution of Shoushan stone for narrative purposes; treat this row as the more epistemically honest version for a technical audience |
| Type         | Personal seal/stamp                                                                                                                                                                                                                                                                                             |
| Measurements | Height 150mm, diameter 50mm                                                                                                                                                                                                                                                                                     |
| Weight       | 853g                                                                                                                                                                                                                                                                                                            |
| Condition    | Shows genuine wear, ink residue in the carved base                                                                                                                                                                                                                                                              |
| Chronology   | Family source: "unknown, probably 20th century." Sketchfab narrative: c. 19th century. See Materials note — these two figures haven't been reconciled                                                                                                                                                           |
| Geography    | China, acquired at Hong Kong's Jade Street Market, 1989                                                                                                                                                                                                                                                         |

**The story**:

> "Chinese personal seal" — Shoushan stone, hand-carved, c. 19th century. This is a heavy, ink-stained piece of Chinese history that my father got from a version of Hong Kong that doesn't really exist anymore. He bought it at a stall in the open-air Jade Street Market in the late 80s or early 90s, while the city was buzzing for its founding anniversary. It was part of a "jade haul" including the rhyton (CHAN-009) from this collection. If you look at the base, you can still see traces of red ink from when it was used. Carved on the surface is a snippet of 8th-century "exile poetry" by Han Yu, about a song so bitter the listener's tears fall like rain. Though signed by the "seal master" Lin Gao, the date is written in a way that implies it's a high-level 19th-century tribute to the author's style. It's a beautiful tribute, and one that deserves a closer look.

**Capture paradata**

| Field                                | Detail                                                              |
| ------------------------------------ | ------------------------------------------------------------------- |
| Dates of access                      | 19 February 2026                                                    |
| Complexity (object/surface/material) | Medium / Medium / Low                                               |
| Recording challenge                  | Cavities at the top may not record perfectly                        |
| Acquisition angles                   | HALF-TOP @70°, HALF-BOTTOM @70°, FRONT @0°; 10–15° rotational steps |
| Raw images per angle                 | 125 / 137 / 107                                                     |
| Final aligned dataset                | 369 images                                                          |
| Tie points                           | 144,591                                                             |
| Reprojection error                   | 1.2px                                                               |
| Model (raw)                          | 158,538 faces / 79,273 vertices                                     |

**Post-processing**: Very smooth processing, no significant issues. Known limitation: the final high-quality model's surface, and the top edge specifically, is slightly rugged compared to the physical object — could be further enhanced. No manual PBR intervention required. Reconstruction note: written at time of processing.

---

### CHAN-007 — "Thai dancer"

**Metadata**

| Field        | Detail                                                                                                                                                                               |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Type         | Ornamental figurine — one of a set of three poses (standing, kneeling, seated); only the middle figurine of the set was completed, exact pose not specified in the processing record |
| Materials    | Bronze alloy, green and gold patina                                                                                                                                                  |
| Measurements | Full set — standing 238mm/575g, kneeling 180mm/506g, seated 141mm/517g                                                                                                               |
| Weight       | See Measurements                                                                                                                                                                     |
| Condition    | —                                                                                                                                                                                    |
| Chronology   | Late 1980s (c. 1988–89)                                                                                                                                                              |
| Geography    | Thailand, Chiang Mai                                                                                                                                                                 |

**The story**:

> "Thai dancer" — Bronze alloy, green and gold patina, late 1980s. This is an ornamental figurine of a traditional Thai dancer that my mother bought during a trip to Thailand around 1988 or 1989, from one of the thousands of market stalls that line the streets of Chiang Mai. It's an example of the classic artisanal souvenirs found throughout Northern Thailand — it has an "antique" look because it was cast in a patinated metal alloy and decorated with a gold patina. This figurine doesn't have a great story behind it, but it's one of my mom's favourite travelling mementos (she brought back quite a haul from Thailand), and one of the "classic" consistent decor pieces from our house.

**Capture paradata**

| Field                                             | Detail                                                                                                                                            |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dates of access                                   | 19 February 2026                                                                                                                                  |
| Complexity (object/surface/material)              | Medium / Medium / Medium                                                                                                                          |
| Recording challenges                              | Gold paint causing shine in places; complex clothing detail                                                                                       |
| Acquisition angles                                | TOP @70°, FRONT @0°; 15–20° rotational steps                                                                                                      |
| Final aligned dataset (completed middle figurine) | 156 images                                                                                                                                        |
| Tie points                                        | 360,850                                                                                                                                           |
| Reprojection error                                | 0.783px                                                                                                                                           |
| Model (raw)                                       | 100,000 faces / 49,998 vertices — a deliberately decimated round-number target, consistent with a delivery-oriented export rather than raw output |

**Post-processing**: Retopology: minor manual reshaping of the underarm geometry — the initial build had inferred an incorrect indentation in this self-occluded area, where source images couldn't fully see into the joint. Roughness/metallic: manually painted metallic map for the figurine's gilded areas; shine intensity judged by eye against the physical object, not measured — see Section 7. Known limitation: source images had focus limitations on fine extremities, resulting in a lower-confidence model, selected as the best of the three related figurines. Reconstruction note: reconstructed from memory, not contemporaneous.

---

### CHAN-009 — "The Chinese horn" (ceremonial vessel, rhyton)

**Metadata**

| Field        | Detail                                                                                           |
| ------------ | ------------------------------------------------------------------------------------------------ |
| Type         | Ceremonial vessel replica                                                                        |
| Materials    | Carved haematite                                                                                 |
| Measurements | Height 158mm                                                                                     |
| Weight       | 1,017g                                                                                           |
| Condition    | —                                                                                                |
| Chronology   | Styled after a late Ming/early Qing dynasty rhyton (late 16th–early 17th century), acquired 1989 |
| Geography    | China, Hong Kong Jade Street Market                                                              |

**The story**:

> "The Chinese horn" — Carved haematite. Based on its intricate iconography and material, we believe it to be a replica of a late Ming/early Qing Dynasty-style rhyton (late 16th–early 17th c.) — a traditional Chinese ceremonial vessel. My father got this in 1989 from a stall in the old Hong Kong Jade Street Market. Its value goes beyond cultural significance in itself — it's also a memento from a version of Hong Kong that doesn't really exist anymore, a few years before its return to China and the transformations that followed. Getting this wasn't as simple as buying a standard souvenir: the antiques dealer seemed reluctant to let it go to a foreigner, and there was a sense of cultural respect and gravity surrounding the piece that made the purchase feel particularly special.

**Capture paradata**

| Field                        | Detail                                                                                                                |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Capture-stage planning sheet | None exists for this object                                                                                           |
| Raw images / focal lengths   | 256 images across three focal lengths (21mm/32mm/25mm), suggesting multiple angle passes similar to the other objects |
| Tie points                   | 350,988                                                                                                               |
| Reprojection error           | 0.595px                                                                                                               |
| Model (raw)                  | 200,000 faces / 100,000 vertices — again a round, deliberately decimated figure                                       |
| Equipment                    | Matches the project-wide standard in Section 3                                                                        |

**Post-processing**: Albedo/diffuse: manually corrected — missing/incorrect texture data in the self-occluded area where the dragon-tail motif twists back on itself, patched in Blender using the same clone-sampling approach as CHAN-003. Roughness/metallic: not created. Successfully aligned via standard Metashape after initial reconstruction difficulty — not HeritageScan, despite earlier expectations; see Section 6. Reconstruction note: reconstructed from memory, not contemporaneous.

---

### CHAN-012 — "Box of little birds"

**Metadata**

| Field        | Detail                                                        |
| ------------ | ------------------------------------------------------------- |
| Type         | Decorative box with carved figures                            |
| Materials    | Hand-carved and painted wood, 12 individually patterned birds |
| Measurements | Not logged                                                    |
| Weight       | Not logged                                                    |
| Condition    | —                                                             |
| Chronology   | c. 1987                                                       |
| Geography    | Egypt (gift from my aunt)                                     |

**The story**:

> "Box of little birds" — Hand-carved and painted wood, late 20th century. This is a charming wooden box filled with a collection of 12 little hand-carved birds, each painted with its own unique pattern. It's a traditional souvenir from Egypt, given to my mum by her sister around 1987. While the box looks delicate and sweet, the story of how it got to the family is actually quite something — known in the family as "the trip from hell." Back in the eighties, long before mobile phones, my aunt and uncle got stranded in Egypt's airport after their flights were cancelled due to overbooking, for a whole two weeks, with barely any food or help from the embassy. By the time they finally made it home, they'd both lost about 15 kilos. Despite the chaotic holiday, this little box survived the journey — a piece my mum holds dear, both as a memento of a wild travel story and as a reminder of the sister she was very close to.

**Capture paradata**

| Field                        | Detail                                                                                                                      |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Capture-stage planning sheet | None exists for this object                                                                                                 |
| Raw images / focal lengths   | 319 images across three focal lengths (28mm/41mm/35mm)                                                                      |
| Tie points                   | 174,372                                                                                                                     |
| Reprojection error           | 0.719px                                                                                                                     |
| Model (raw)                  | 781,148 faces / 390,569 vertices — a notably high raw poly count, with no sign of the decimation seen on some other objects |
| Equipment                    | Matches the project-wide standard in Section 3                                                                              |

**Post-processing**: clean processing, no significant issues, no Blender retouching required. Reconstruction note: n/a.

---

### CHAN-013 — "Senegalese toy bus"

**Metadata**

| Field        | Detail                                 |
| ------------ | -------------------------------------- |
| Type         | Toy/souvenir                           |
| Materials    | Polychrome wood and card               |
| Measurements | Length 175mm, height 115mm, width 70mm |
| Weight       | 122g                                   |
| Condition    | —                                      |
| Chronology   | c. 2019                                |
| Geography    | Senegal                                |

**The story**:

> "Senegalese toy bus" — Polychrome wood and card, late 20th century. This vibrant little bus is a classic Senegalese toy made from wood and card, mimicking the colourful "car rapides" seen everywhere in cities like Saint-Louis. It was given to my mom around 2019 as a gift from a dear friend and former colleague — a Spaniard from Cádiz living out in Senegal as an expat, who helped my mom both personally and professionally. He used to bring back souvenirs whenever he came home for Christmas; there's a good chance it belonged to his young son first, which is why it has that lovely, personal "played-with" feel. It's an object my mom really treasures, not only as a reminder of that friendship but of her first steps in her company, and the support she received at the time.

**Capture paradata**

| Field                        | Detail                                                                                                          |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Capture-stage planning sheet | None exists for this object                                                                                     |
| Raw images / focal lengths   | 327 images across three focal lengths (30mm/27mm/29mm)                                                          |
| Tie points                   | 235,617                                                                                                         |
| Reprojection error           | 0.524px                                                                                                         |
| Model (raw)                  | 1,152,476 faces / 577,073 vertices — the highest raw poly count of the finished set, with no sign of decimation |
| Equipment                    | Matches the project-wide standard in Section 3                                                                  |

**Post-processing**: successful reconstruction via HeritageScan, no Blender retouching required beyond the alignment itself. Reconstruction note: n/a.

---

### CHAN-016 — "Box of stone eggs"

**Metadata**

| Field        | Detail                                                                                                                                                                                                                                                                                                                                                                                         |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Type         | Mineral collection/decorative set                                                                                                                                                                                                                                                                                                                                                              |
| Materials    | 20 different hand-carved and polished stone types — aventurine, brown opaline, pale lepidolite, wood stone, dolomite, granite, feldspar, calcrete, leopard rock, spider jasper, butterscotch, dark lepidolite, rose quartz, green unakite, [asbestos — flagged as worth double-checking, unusual for a decorative object], cream dolomite, opal stone, white opaline, winter jasper, soapstone |
| Measurements | Not logged                                                                                                                                                                                                                                                                                                                                                                                     |
| Weight       | Not logged                                                                                                                                                                                                                                                                                                                                                                                     |
| Condition    | —                                                                                                                                                                                                                                                                                                                                                                                              |
| Chronology   | c. 1987                                                                                                                                                                                                                                                                                                                                                                                        |
| Geography    | Egypt (gift from my aunt)                                                                                                                                                                                                                                                                                                                                                                      |

**The story**:

> "Box of stone eggs" — Various hand-carved stones, 20th century. This is my mum's precious collection of miniature stones, each hand-carved and polished into the shape of an egg. They were a souvenir from Egypt, brought back by my mum's sister in 1987, made from twenty different mineral types. My mother is actually an avid egg collector, but she usually goes for regular-sized ones — making this her especially cute "miniature" collection.

**Capture paradata**

| Field                        | Detail                                                                                                                                         |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Capture-stage planning sheet | None exists for this object                                                                                                                    |
| Raw images / focal lengths   | 178 images across two focal lengths (30mm/42mm)                                                                                                |
| Tie points                   | 83,090                                                                                                                                         |
| Reprojection error           | 0.876px — the highest among the finished set, consistent with the geometry-guessing problem on the shiny stone surfaces described in Section 7 |
| Model (raw)                  | 251,548 faces / 125,798 vertices                                                                                                               |
| Equipment                    | Matches the project-wide standard in Section 3                                                                                                 |

**Post-processing**: Retopology: manual smoothing and reshaping of the eggs' surface geometry — without cross-polarisation, the initial reconstruction of the naturally shiny stone surface produced an uneven, bumpy result rather than the smooth surface of the physical objects. Roughness/metallic: manually reconstructed roughness map reflecting the differing natural shine levels across the different stone types in the set; values informed by memory and reference photographs, not derived empirically — see Section 7. Reconstruction note: reconstructed from memory, not contemporaneous.

---

### CHAN-017 — "Mysterious stone foot"

**Metadata**

| Field        | Detail                                                                                               |
| ------------ | ---------------------------------------------------------------------------------------------------- |
| Type         | Possible sculptural fragment                                                                         |
| Materials    | Unidentified stone                                                                                   |
| Measurements | Length 295mm, width 215mm, height 110mm                                                              |
| Weight       | Approx. 6,900g                                                                                       |
| Condition    | —                                                                                                    |
| Chronology   | Found c. 2008–09; if genuinely a fragment, possibly Roman given proximity to the Baelo Claudia ruins |
| Geography    | Found at Meco beach, Cádiz, Spain                                                                    |

**The story**:

> "Mysterious stone foot" — Unidentified stone. One of our dearest family treasures. I spotted this stone back in 2008 when I was a little girl, sitting among the breakwater rocks by Meco beach, Cádiz. To us it resembled a sculpted foot, intriguing the family enough that we decided to bring it back home to Seville — not easy, given how much it weighs. If it really is an ancient sculptural fragment, we believe it's likely Roman, given how close Meco beach is to the ruins of Baelo Claudia, a town that thrived from the late 2nd century BC until an earthquake triggered its decline in the 2nd century AD. If so, though, the original statue would have been unusually large, even for major Roman monuments. Whether it's a genuine piece or just a natural "trick," it holds a wonderful place in our house — it was my very first "archaeological find," and looking back, we think of this moment as the possible spark that inspired my career in Cultural Heritage.

**Capture paradata**

| Field                        | Detail                                          |
| ---------------------------- | ----------------------------------------------- |
| Capture-stage planning sheet | None exists for this object                     |
| Raw images / focal lengths   | 129 images across two focal lengths (32mm/25mm) |
| Tie points                   | 210,851                                         |
| Reprojection error           | 0.609px                                         |
| Model (raw)                  | 244,966 faces / 122,487 vertices                |
| Equipment                    | Matches the project-wide standard in Section 3  |

**Post-processing**: clean processing, no significant issues, no Blender retouching required. Reconstruction note: n/a.

---

## Related project documents

This document is a synthesis. The following source materials fed into it and are held separately as the underlying record:

- **Digitisation journal** — a dated, first-person process log covering 16 February to 19 May 2026: camera testing, alignment troubleshooting, the workflow that eventually cut processing time from around 4 hours to under 1, and the development of HeritageScan
- **Object digitisation notes** (spreadsheet) — per-object capture and processing sheets, one tab per object, covering CHAN-001 through CHAN-008 plus a working template
- **Object metadata info** (spreadsheet) — family-sourced raw metadata in Spanish (the "Input" sheet), the English Sketchfab-ready narrative descriptions, and a timeline/geography reference sheet
- **Final Metashape processing reports** (PDF, one per object) — CHAN-001, CHAN-003, CHAN-004a, CHAN-006, CHAN-007, CHAN-009, CHAN-012, CHAN-013, CHAN-016, CHAN-017; the authoritative source for all tie point, reprojection error, and poly count figures in Part B
- **Project planning table** — the EP-001/EP-002 project management sheet: objectives, timelines, team and client fields, licensing, and file-naming conventions

---

_Copied into this repo from "The Repositioning" Claude project on 25 August 2026, as the authoritative reference source for this site's content. If the source document in that project is later revised, re-sync this copy._
