# React web app lessons

[Knowledge base](../../index.md) · [Lessons](index.md)

**Type:** Reference · Answers: which implementation and delivery traps apply to this web app?

- Rewrite Git history in a disposable clone and publish through the
  authenticated source checkout. This preserves checkout credentials and
  working files; validate the full commit mapping before a guarded push.
  [Run 003](../../../factory/runs/003-normalize-git-authors.md) verifies
  this path on GitHub, including a Vercel deployment after the rewrite.
- Check the actual factory CLI before reporting its documentation checks
  as passed. In [run 003](../../../factory/runs/003-normalize-git-authors.md),
  the npm package resolved by the documented command has no check-docs
  subcommand; direct local-link validation covers only part of the check.
- Generated runtime assets need a production build step and an output
  check. A local build can hide missing assets because ignored files still
  exist locally. Never delete served assets before replacement downloads
  finish: Vite can return its HTML page for a missing wheel and Python
  reports BadZipFile. See [run 004](../../../factory/runs/004-deployment-model-assets.md)
  and the [deployment instructions](../../../README.md#deploy-on-vercel).
