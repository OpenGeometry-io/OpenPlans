# Plan Vector Payload With react-pdf

```tsx
import React from "react";
import { Document, Page, Svg, Line, pdf } from "@react-pdf/renderer";
import { Door, PlanPDFGenerator } from "@opengeometry/openplans";

const door = new Door();
const generator = new PlanPDFGenerator();

const payload = generator.generate({
  elements: [door],
  view: "top",
});

const width = Math.max(payload.bounds.width, 0.001);
const height = Math.max(payload.bounds.height, 0.001);

const MyDocument = (
  <Document>
    <Page size="A4">
      <Svg
        width={400}
        height={400 * (height / width)}
        viewBox={`${payload.bounds.min.x} ${payload.bounds.min.y} ${width} ${height}`}
      >
        {payload.lines.map((line, index) => (
          <Line
            key={index}
            x1={line.start.x}
            y1={line.start.y}
            x2={line.end.x}
            y2={line.end.y}
            stroke="#000000"
            strokeWidth={line.stroke_width ?? 1}
          />
        ))}
      </Svg>
    </Page>
  </Document>
);

const blob = await pdf(MyDocument).toBlob();
```
