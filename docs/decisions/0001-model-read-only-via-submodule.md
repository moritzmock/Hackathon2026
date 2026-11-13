---
status: accepted
date: 2026-11-13
decision-makers: the project's owner
---

# Use the model read-only, through a pinned submodule

[Knowledge base](../index.md) · [Decisions](index.md)

## Context and Problem Statement

The app needs the INTEGRATES model and its data, which live in their own
repository (`moritzmock/integrates`). The owner asked not to change the model
and not to break the other repository.

## Considered Options

- Copy the model's files into this repository by hand.
- Point at the local `~/Documents/Workspace/integrates` checkout.
- Add the public repository as a git submodule, pinned to one commit, and
  package it with a script.

## Decision Outcome

Chosen: the submodule `vendor/integrates`, pinned. `npm run model`
(`scripts/sync_model.py`) takes the model files with `git archive` from the
pinned commit, never the working tree, and the Python packages as unmodified
PyPI wheels at the versions in the model's `environment.yml`, checked against
PyPI's sha256 digests. The output goes to `public/py/`.

### Consequences

- Good, because the model's numbers are exactly the pinned commit's, and the
  other repository is never written to.
- Good, because moving to a newer model is one deliberate step: move the pin,
  rerun `npm run model` and `npm run test:model`.
- Bad, because a fresh copy needs `git submodule update --init`.
