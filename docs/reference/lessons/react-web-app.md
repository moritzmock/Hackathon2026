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
- When comparing Git archive exports with a Linux runner's output, disable
  inherited automatic line-ending conversion in the temporary verification
  repository. A local core.autocrlf=input setting changes CRLF files during
  staging and can produce a false tree mismatch.
  [Run 006](../../../factory/runs/006-sync-on-push.md) checks both exports
  with line-ending conversion disabled.
- Generated runtime assets need a production build step and an output
  check. A local build can hide missing assets because ignored files still
  exist locally. Never delete served assets before replacement downloads
  finish: Vite can return its HTML page for a missing wheel and Python
  reports BadZipFile. See [run 004](../../../factory/runs/004-deployment-model-assets.md)
  and the [deployment instructions](../../../README.md#deploy-on-vercel).
- Before porting a slow browser model to a new language, check whether one
  queued worker job contains independent calculations. Splitting those jobs
  across an existing pool can shorten the wait while retaining the same
  pinned solver. Compare full browser time and the model's official outputs,
  as in [run 011](../../../factory/runs/011-fresh-regimes.md).
