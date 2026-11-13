---
status: accepted
date: 2026-11-14
decision-makers: the project's owner
---

# Package the browser model during production builds

[Knowledge base](../index.md) · [Decisions](index.md)

## Context and Problem Statement

The Python model files are generated locally and ignored by Git. A build
that only compiles JavaScript can succeed while deploying no model files.
The owner requests a deployment fix and comments preserving its purpose.

## Considered Options

- Track generated model files in Git.
- Require a manual packaging step for each deployment.
- Generate the pinned model during the standard production build and
  verify its output.

## Decision Outcome

Use npm's prebuild hook to run the existing model packager and its
postbuild hook to check the output manifest, archive and wheel hashes.
Use Python's standard library directly for packaging, with Node 24 and
Vercel's build settings declared in the repository. Keep generated files
ignored and preserve the pinned model without modifications.

### Consequences

- A fresh deployment includes its model files or fails before publishing.
- Builds need Python 3, Git, the initialized public submodule and PyPI access.
- Download failures preserve existing served files. Replacement files are
  published complete, with the manifest last.
- A new build does not regenerate city data or run the energy simulation.

## More Information

- [Deployment instructions](../../README.md#deploy-on-vercel)
- [Run 004](../../factory/runs/004-deployment-model-assets.md)
- [Vercel build configuration](https://vercel.com/docs/builds/configure-a-build)
- [Vercel public submodules](https://vercel.com/docs/builds/build-features)
