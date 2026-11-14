# 016 Credit the Calibra team

## Request

Add the three team members named on the [NOI Hackathon Calibra project page](https://hackathon.bz.it/project/calibra) to the README, link to that page, then commit, pull and push the change. The public page lists four people; the working assumption is that the requested three are Jonas, Thomas and Daniel, beside Moritz.

## Plan and checks

- Use the three people beside Moritz on the project page; the owner may correct this assumption.
- Add a short team section near the README introduction and link directly to the project page.
- Check the rendered Markdown structure and destination link, then commit the documentation change, pull `origin/main` and push it. GitHub's existing workflow syncs `main` to the hackathon team's `frontend/` folder.

## Status

done: the README credits the three people beside Moritz and links the project page; the change was committed, pulled against origin and pushed.

## Result

- The project page returned HTTP 200 and listed Jonas Rabensteiner, thomas borsani, Moritz Mock and Daniel Planötscher. The README now credits Jonas Rabensteiner, Thomas Borsani and Daniel Planötscher and links to that page for the full team.
- `git diff --check` passed. The documented `npx software-factory check-docs` command was attempted but the installed CLI reports `unknown command 'check-docs'`; the project page link was verified directly with HTTP 200.
- The README edit was committed as `7d34741`. `git pull --rebase origin main` reported that the branch was up to date. `git push origin main` advanced remote `main` from `6c29ddd` to `7d34741`. The existing GitHub workflow is configured to sync the committed frontend snapshot to the hackathon team repository; its completion was not checked in this run.

## Later

None.
