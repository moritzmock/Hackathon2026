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

    def test_a_bridge_deck_starts_and_ends_on_the_banks_and_rises_in_the_middle(self):
        flat = lambda x, y: 0.0
        pts = dr.drape(piece((0, 0), (100, 0), bridge="yes"), flat, spacing=10)
        self.assertEqual(pts[0][2], 0.0)
        self.assertAlmostEqual(pts[-1][2], 0.0)
        middle = max(z for _, _, z, _ in pts)
        self.assertAlmostEqual(middle, 3.0)  # 3 % of 100 m

    def test_a_long_bridge_rises_no_more_than_4_m(self):
        pts = dr.drape(piece((0, 0), (1000, 0), bridge="viaduct"), lambda x, y: 0.0, spacing=50)
        self.assertAlmostEqual(max(z for _, _, z, _ in pts), 4.0)

    def test_a_bridge_deck_never_dips_below_the_ground(self):
        pts = dr.drape(piece((0, 0), (100, 0), bridge="yes"), self.ground, spacing=10)
        self.assertTrue(all(z >= self.ground(x, y) for x, y, z, _ in pts))

    def test_a_tunnel_is_straight_and_hidden(self):
        pts = dr.drape(piece((0, 0), (100, 0), tunnel="yes"), self.ground, spacing=10)
        self.assertTrue(all(z == 0.0 and hidden == 1 for _, _, z, hidden in pts))

    def test_points_are_no_further_apart_than_the_spacing(self):
        pts = dr.drape(piece((0, 0), (100, 0)), self.ground, spacing=10)
        gaps = [abs(b[0] - a[0]) for a, b in zip(pts, pts[1:])]
        self.assertLessEqual(max(gaps), 10)


class PillarTests(unittest.TestCase):
    def deck(self, length, height=6.0):
        return dr.drape(piece((0, 0), (length, 0), bridge="yes"), lambda x, y: -height, spacing=10)

    def test_pillars_stand_about_every_30_m_between_the_ends(self):
        pillars = dr.pillars(self.deck(120), lambda x, y: -6.0)
        xs = [p[0] for p in pillars]
        self.assertEqual(len(xs), 3)
        self.assertTrue(all(10 < x < 110 for x in xs))
        gaps = [b - a for a, b in zip(xs, xs[1:])]
        self.assertTrue(all(25 <= g <= 35 for g in gaps))

    def test_a_short_bridge_has_no_pillar(self):
        self.assertEqual(dr.pillars(self.deck(25), lambda x, y: -6.0), [])

    def test_a_pillar_reaches_from_under_the_deck_into_the_ground(self):
        x, y, top, bottom, heading = dr.pillars(self.deck(120), lambda x, y: -6.0)[0]
        self.assertLess(top, 2.0)  # under the deck
        self.assertLess(bottom, -6.0)  # into the ground
        self.assertAlmostEqual(heading, 0.0)  # along the bridge (east)

    def test_no_pillar_where_the_deck_is_close_to_the_ground(self):
        low_deck = [(x, 0.0, 0.5, 0) for x in range(0, 121, 10)]
        self.assertEqual(dr.pillars(low_deck, lambda x, y: 0.0), [])


if __name__ == "__main__":
    unittest.main()
