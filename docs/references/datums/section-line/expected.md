# Section line — expected visual traits

The OpenPlans section line must satisfy every trait below. A screenshot that fails any one of these is not "correct," regardless of how close it looks.

## Sources

- US National CAD Standard (NCS) v6 — Uniform Drawing System, Symbols module.
- AIA CAD Layer Guidelines (incorporated into NCS).
- SFP Online — [Architectural Symbols and Conventions (PDF)](https://www.sfponline.org/uploads/14/architecturalsymbolsandconventions.pdf).
- ARCHLOGBOOK — [Annotation Basics: Plans, Sections & Elevations](https://docs.archlogbook.co/01-industry-basics/lines-and-symbols).
- Life of an Architect — [Architectural Graphics 101 – Symbols](https://www.lifeofanarchitect.com/architectural-graphics-101-symbols/).

## Traits

1. **Two heads, one at each end of the cutting-plane line.** No missing ends, no extra heads.
2. **Each head is a circle split by a horizontal divider**, with the drawing number (e.g. `A`, `1`) above the divider and the sheet number (e.g. `A-301`) below.
3. **Each head carries a direction-of-view arrow perpendicular to the cut line.**
4. **Both arrows point in the same direction** — they indicate which way the section is viewed. Arrows pointing at each other, or pointing outward from each other, are wrong.
5. **The arrowhead is a solid filled triangle** (proportion ~3:1 length-to-width), attached directly to the bubble or at the end of a short stub off the bubble. Open "L" or "7" tick shapes are wrong.
6. **The cut line itself is either a heavy solid line, a heavy long-dash line (ISO chain), or broken at the middle** to avoid obscuring plan content. A thin uniformly-dashed line reads as a hidden line, not a cutting plane.
7. **The `flip` option reverses the direction both arrows point**, together — they remain parallel to each other, just on the opposite side of the cut line.

## ASCII sketch (flip=false, cut line running left-to-right, view direction = up)

```
   ^                                           ^
   |                                           |
 ( A )---+---+---+---+---+---+---+---+---+---( A )
 (A-301)                                     (A-301)
```

Arrow = filled triangle. `( )` = bubble with divider between top (drawing#) and bottom (sheet#). Middle `---` = cut line. Both arrows point the same way.
