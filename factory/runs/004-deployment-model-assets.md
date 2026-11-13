# 004 Include the model in production builds

## Request

The owner reports that Vercel returns 404 for the model manifest and asks
to include the model assets so the app can be deployed. Local inspection
found matching model/runtime versions, but generated Python assets are
ignored by Git and the production build does not generate them.

## Plan and checks

- Use npm's build lifecycle to package the existing pinned model before
  Vite builds. The packager uses Python's standard library directly;
  deployment packaging does not need uv or city-data regeneration.
- Declare Node 24 for nvm and hosting. Set Vercel's build command and
  static output directory in the repository.
- Check the production manifest, model archive, runtime version and wheel
  hashes after building. Missing or damaged assets fail the build.
- Write and run failing asset-check tests first, implement the check,
  then rerun tests and the product build.
- Build a separate checkout without generated assets, serve the result,
  fetch the model files and run the existing model baseline comparison.
- Review the build boundary and document deployment prerequisites.
  No UI, model-data or submodule-pin changes are authorized or needed.
- The owner also reports local BadZipFile failures. The packager deletes
  served wheels before downloads finish; preserve working files on download
  failure and publish complete files with the manifest last. Add a failing
  regression for this boundary before changing the packager.

## Status

done: deployment preparation and the local packaging race are fixed and
verified. Hosted verification requires deploying the resulting commit.

## Result

- Added Node 24 declarations, tracked Vercel configuration, and npm build
  hooks that generate model assets and verify the files in the output.
  Packaging uses Python's standard library and does not require uv.
- Added explicit deployment comments in package.json and the packaging/
  asset-check scripts, plus a blueprint promise explaining why they stay.
- Tests first: six asset-check tests failed because the checker was absent.
  After implementation all six pass. The packaging regression first failed
  because a failed download overwrote the working archive; it now passes
  and verifies the existing manifest, archive and wheel remain unchanged.
- Initial sandboxed build failed resolving PyPI; the network-enabled build
  passes. Packaging now completes downloads before touching served files,
  replaces individual files atomically and publishes the manifest last.
- A separate checkout with no generated model files, output or wheel cache
  successfully runs npm run build, downloads all six wheels and verifies
  the resulting dist/py. It reuses installed npm dependencies; a clean npm
  installation on Vercel is not exercised here.
- Browser verification: the existing dev server finishes model setup. The
  clean production preview at http://127.0.0.1:4173 also finishes setup;
  its manifest and all six wheels return HTTP 200, with matching SHA-256
  hashes. Adjusting a room-temperature slider runs the live model and the
  UI returns to Your settings without a Python error.
- npm run test:model passes for all three buildings and both years,
  with maximum relative difference 7.2e-16 from the official baseline.
- Structure review: npm owns build sequencing; the existing Python script
  owns packaging; a separate Node script verifies shipped assets. No new
  runtime dependency, UI change, model-data change or pin change is needed.
- Documentation check: offline resolution failed; the network-enabled
  factory CLI reports unknown command 'check-docs', as in run 003. Full
  factory validation is unavailable. Direct validation passes for all 17
  local links/anchors across the six changed Markdown pages.
- To deploy: commit/push the changes and deploy that commit. The tracked
  Vercel configuration builds with npm run build and publishes dist.
  Reload localhost to retry the restored local model. Vercel's actual
  build environment and hosted simulation have not been verified here.

## Later

- Factory core suggestion: static-app kits should check generated runtime
  assets from a clean checkout, not only compile application code.
- The default headless viewport places an SVG over the heating slider's
  click point; keyboard interaction works. Revisit the existing panel
  layout separately if this also affects real users.
