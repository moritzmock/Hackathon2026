# 033 Band tiles no taller than the text

## Request

The owner, with a screenshot of the methods page: "this space is weird". The violet band at the top showed a large empty stretch between its text and the chart card overlapping its lower edge.

Measured in headless Chrome: the band's column of decorative tiles is always five 76 px rows (380 px), taller than the methods page's title and text, so it set the band's height. Gap from the end of the text to the card: methods page 233 px (1000 px wide) and 199 px (1440 px wide); landing page 112 px and 62 px. On phones the tiles are hidden (gap 30 px).

## Plan and checks

- The tile column takes the height of the text beside it, at most its old 380 px, and stays three by five square tiles (`src/site/site.css`, `.site-tiles--band`: stretched to the row, `aspect-ratio: 3 / 5`, rows and columns as fractions). The band is then as tall as its text, and the card below overlaps it the same way on every page.
- Check: the gap measured again on the methods and landing pages at 1000, 1440 and 390 px; screenshots.

## Status

done.

## Result

- `src/site/site.css`: `.site-tiles--band` sized by the text.
- Gap from the text to the card, after: 50 px on the methods and landing pages at 1000 and 1440 px (before: 233/199 and 112/62); 30 px on phones, unchanged. The methods page's tiles are smaller (about 44 px); the landing page's, beside a longer text, keep nearly their full size. Seen in screenshots.
- No unit test: a style change.

## Later
