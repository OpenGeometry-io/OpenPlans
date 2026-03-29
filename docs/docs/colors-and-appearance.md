---
sidebar_position: 4
---

# Colors And Appearance

OpenPlans keeps appearance as part of semantic authoring data.

## Supported V1 appearance fields

- `wallColor`
- `doorColor`
- `frameColor`
- `glassColor`

## What these colors affect

- runtime rendering in OpenPlans
- normalized semantic export payloads
- IFC metadata in `Pset_OpenPlansAppearance`

## What V1 does not do

V1 does not emit full IFC styled presentation items. Colors are preserved as semantic/export metadata instead.

## Why

This keeps the kernel generic while preserving important BIM authoring intent in both the OpenPlans runtime and exported IFC payloads.
