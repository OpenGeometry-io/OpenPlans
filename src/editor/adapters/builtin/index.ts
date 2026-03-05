import type { EditorAdapter } from "../../types";
import { wall2DAdapter } from "./wall2d.adapter";
import { lineAdapter } from "./line.adapter";
import { polylineAdapter } from "./polyline.adapter";
import { rectangleAdapter } from "./rectangle.adapter";
import { arcAdapter } from "./arc.adapter";
import { cuboidAdapter } from "./cuboid.adapter";
import { cylinderAdapter } from "./cylinder.adapter";
import { parametric2DAdapter } from "./parametric2d.adapter";
import { specialPlanviewAdapter } from "./special-planview.adapter";
import { genericTransformAdapter } from "./generic-transform.adapter";

export function builtInAdapters(): EditorAdapter[] {
  return [
    wall2DAdapter,
    lineAdapter,
    polylineAdapter,
    rectangleAdapter,
    arcAdapter,
    cuboidAdapter,
    cylinderAdapter,
    specialPlanviewAdapter,
    parametric2DAdapter,
    genericTransformAdapter,
  ];
}
