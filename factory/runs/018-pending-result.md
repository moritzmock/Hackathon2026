# 018 Show that a settings change is not instant

## Request

Moving a settings slider changed its number at once, while the score kept the old result until the model finished (about 6–7 s warm, about 45 s the first time). The owner asked for a design, without a recalculate button, that does not suggest the result is instant but shows that something is happening until the result arrives. After two rounds (spinners and clocks in the score box and settings header, dots next to changed values) the owner found it had too many spinners and asked to lock the settings during a run and overlay an animation instead.

## Plan and checks

- Keep the automatic run (0.6 s after the last slider move); during that short wait the sliders can still be moved.
- While the model runs, the settings are locked (sliders and the two shortcut buttons disabled) under a frosted overlay with one card: the Calibra mark with its needle swinging and settling (the brand's own "calibrating" animation), "Calculating your settings" (or the first-time setup step, such as "Downloading Python…"), the time against the expected time, and one orange bar that fills (never full before the result is in).
- The "Your settings" score fades and blurs from the first slider move until the new result is in; no spinner there.
- The box under the chart (`RunOutcome`, was `RunProgress`) now shows only the "Updated in N s" note and errors; its per-winter progress bar and the "you changed a setting meanwhile" note are gone, as nothing can be changed during a run.
- Rules with unit tests: `resultPending` (is the shown score out of date?) and `runEstimate` (stage, elapsed, expected, fill).
- The chart was left alone: commit 11f47da (made in parallel) already hides the orange line until a result for the current settings exists.

## Status

done.

## Result

- `npm test`: 26 pass, 0 fail (5 for `resultPending`, 5 for `runEstimate`).
- `npm run build` (the verify command): passes.
- Seen in the app (headless Chromium, `?low`, building 01, "Room temperature" moved): during the run the score was faded, the sliders locked under the overlay showing the swinging mark, "Calculating your settings", "0:02 of about 0:45" and the bar filling; after the run the overlay was gone, the new score 95.64 sharp and "Updated in 15 s" under the chart.
- Earlier rounds (score-box clock and bar, settings-header clock, per-setting dots, `rowsParams` in the store) were built, shown and removed again at the owner's request.

## Later

- The building's score on the map and in the list does not show the pending state yet.
- With twelve sliders the overlay card sits near the top of the settings; on a short screen scrolled far down it may be out of view (it is `sticky`, but only inside the section).
