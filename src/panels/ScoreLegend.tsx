import { scoreColor } from "../world/scoreColor";

const ticks = [0, 50, 90, 100];
const gradient = `linear-gradient(to right, ${Array.from({ length: 101 }, (_, score) =>
  `#${scoreColor(score).getHexString()} ${score}%`,
).join(", ")})`;

/** Key for the colour used by the selected building's outline and score card. */
export function ScoreLegend() {
  return (
    <figure className="score-scale" role="img" aria-label="Score colour: 0 is far from the bills; 100 matches the bills">
      <figcaption className="score-scale__caption">Score colour</figcaption>
      <div className="score-scale__bar" style={{ backgroundImage: gradient }} />
      <div className="score-scale__ticks">
        {ticks.map((tick) => (
          <span key={tick} style={{ left: `${tick}%` }}>{tick}</span>
        ))}
      </div>
    </figure>
  );
}
