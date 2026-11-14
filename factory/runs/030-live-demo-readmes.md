# 030 Live demo in three READMEs

## Request

The owner asked for a sentence and link to the live demo in the root READMEs of the frontend repository, the integrates repository and the hackathon team repository.

## Plan and checks

- Add the same short sentence near the introduction of each root README: “You can explore the live demo at hackathon2026.mmock.net.”
- Link the text to `https://hackathon2026.mmock.net/index.html`. The supplied semicolon is punctuation: that address returns 200, while the URL with a semicolon returns 404.
- Keep the model, submodule pin, mirrored frontend and backend folders, and all other README content unchanged.
- Check the exact link and sentence in all three files, Markdown link targets, each repository's diff and status, then commit and publish the README edits.

## Status

done. The three root README edits are committed, published and verified on their default branches.

## Result

The same sentence appears once near the top of each root README. The demo URL without the supplied semicolon returned HTTP 200; the URL with the semicolon returned HTTP 404. Each README diff contained only the sentence, and `git diff --check` passed in all three repositories. No app tests were run for this documentation-only change.

Published commits: frontend `d5634a5`, integrates `c44105a`, team-17 root `7880e99`. A fresh fetch of each default branch showed the link in its root README. The team repository's mirrored `frontend/README.md` and `backend/README.md` also contained it. The frontend's pinned model submodule was not moved, and no model code or data changed.

The documented `npx software-factory check-docs` command returned `unknown command 'check-docs'`. Direct Markdown link and whitespace checks passed for the frontend README and this run record.

## Later

None.
