"""Heights along a line on the map: ground, bridges and tunnels."""
from pathlib import Path
import sys
import unittest

sys.path.insert(0, str(Path(__file__).parent))
import drape as dr


def piece(*pts, **tags):
    return dr.Piece(list(pts), tags)


class HeightTests(unittest.TestCase):
    def ground(self, x, y):
        return 10.0 if 40 < x < 60 else 0.0  # a bump: a river bed would be the opposite

    def test_open_track_follows_the_ground(self):
        pts = dr.drape(piece((0, 0), (100, 0)), self.ground, spacing=10)
        self.assertIn(10.0, [z for _, _, z, _ in pts])
        self.assertTrue(all(hidden == 0 for *_, hidden in pts))

    def test_a_bridge_runs_straight_between_its_ends(self):
        pts = dr.drape(piece((0, 0), (100, 0), bridge="yes"), self.ground, spacing=10)
        self.assertTrue(all(z == 0.0 for _, _, z, _ in pts))

    def test_a_tunnel_is_straight_and_hidden(self):
        pts = dr.drape(piece((0, 0), (100, 0), tunnel="yes"), self.ground, spacing=10)
        self.assertTrue(all(z == 0.0 and hidden == 1 for _, _, z, hidden in pts))

    def test_points_are_no_further_apart_than_the_spacing(self):
        pts = dr.drape(piece((0, 0), (100, 0)), self.ground, spacing=10)
        gaps = [abs(b[0] - a[0]) for a, b in zip(pts, pts[1:])]
        self.assertLessEqual(max(gaps), 10)


if __name__ == "__main__":
    unittest.main()
