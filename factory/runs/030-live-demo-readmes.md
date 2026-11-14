# 030 Live demo in three READMEs

## Request

The owner asked for a sentence and link to the live demo in the root READMEs of the frontend repository, the integrates repository and the hackathon team repository.

## Plan and checks

- Add the same short sentence near the introduction of each root README: “You can explore the live demo at hackathon2026.mmock.net.”
- Link the text to `https://hackathon2026.mmock.net/index.html`. The supplied semicolon is punctuation: that address returns 200, while the URL with a semicolon returns 404.
- Keep the model, submodule pin, mirrored frontend and backend folders, and all other README content unchanged.
- Check the exact link and sentence in all three files, Markdown link targets, each repository's diff and status, then commit and publish the README edits.

## Status

in progress. The three README edits are drafted; verification and publication remain.

## Result

The same sentence appears once near the top of each root README. The demo URL without the supplied semicolon returned HTTP 200; the URL with the semicolon returned HTTP 404. Each README diff contains only the sentence, and `git diff --check` passed in all three repositories. Publication remains.

## Later

None.
