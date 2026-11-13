# The challenge

[Knowledge base](../index.md) · [Explanation](index.md)

**Type:** Explanation · Answers: what is this project for?

The INTEGRATES calibration challenge (Hackathon 2026, Bolzano) gives three
real buildings, their measured heating bills and a building energy
simulation (pyBuildingEnergy). The untuned model overheats every building:
it predicts far more heating than the bills show. The task is to tune the
model's parameters so it matches the bills, scored by the challenge's own
rule (see the [blueprint](../../BLUEPRINT.md#promises)).

This project shows that work as a 3D city of Bolzano. The three buildings
stand at their real places, with their bills and the simulation drawn on
top, and the team can change parameters and see the effect, with the real
model running in the browser. The team uses it to explore; the jury and
visitors see the result at the end.

The model and its data come from the challenge's repository and are never
changed here: see [decision 0001](../decisions/0001-model-read-only-via-submodule.md).
