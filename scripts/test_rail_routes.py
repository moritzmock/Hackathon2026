"""Joining OpenStreetMap railway pieces into routes trains can run along."""
from pathlib import Path
import sys
import unittest

sys.path.insert(0, str(Path(__file__).parent))
import rail_routes as rr


def piece(*pts, **tags):
    return rr.Piece(list(pts), tags)


class JoinTests(unittest.TestCase):
    def test_pieces_that_continue_each_other_become_one_route(self):
        pieces = [piece((0, 0), (100, 0)), piece((100, 0), (200, 10)), piece((300, 10), (200, 10))]
        routes = rr.join(pieces)
        self.assertEqual(len(routes), 1)
        xs = [p[0] for p in routes[0].points]
        self.assertEqual(xs[0], 0)
        self.assertEqual(xs[-1], 300)
        self.assertEqual(xs, sorted(xs))  # the reversed third piece is turned round

    def test_a_sharp_turn_ends_the_route(self):
        pieces = [piece((0, 0), (100, 0)), piece((100, 0), (100, 100))]
        self.assertEqual(len(rr.join(pieces)), 2)

    def test_a_gap_ends_the_route(self):
        pieces = [piece((0, 0), (100, 0)), piece((105, 0), (200, 0))]
        self.assertEqual(len(rr.join(pieces)), 2)

    def test_at_a_switch_the_straightest_way_on_is_taken(self):
        pieces = [piece((0, 0), (100, 0)), piece((100, 0), (200, 2)), piece((100, 0), (190, 40))]
        longest = max(rr.join(pieces), key=lambda r: r.length)
        self.assertEqual(longest.points[-1], (200, 2))

    def test_routes_come_longest_first(self):
        pieces = [piece((0, 0), (50, 0)), piece((0, 500), (400, 500))]
        lengths = [r.length for r in rr.join(pieces)]
        self.assertEqual(lengths, sorted(lengths, reverse=True))


class HeightTests(unittest.TestCase):
    def ground(self, x, y):
        return 10.0 if 40 < x < 60 else 0.0  # a bump: a river bed would be the opposite

    def test_open_track_follows_the_ground(self):
        pts = rr.drape(piece((0, 0), (100, 0)), self.ground, spacing=10)
        self.assertIn(10.0, [z for _, _, z, _ in pts])
        self.assertTrue(all(hidden == 0 for *_, hidden in pts))

    def test_a_bridge_runs_straight_between_its_ends(self):
        pts = rr.drape(piece((0, 0), (100, 0), bridge="yes"), self.ground, spacing=10)
        self.assertTrue(all(z == 0.0 for _, _, z, _ in pts))

    def test_a_tunnel_is_straight_and_hidden(self):
        pts = rr.drape(piece((0, 0), (100, 0), tunnel="yes"), self.ground, spacing=10)
        self.assertTrue(all(z == 0.0 and hidden == 1 for _, _, z, hidden in pts))

    def test_points_are_no_further_apart_than_the_spacing(self):
        pts = rr.drape(piece((0, 0), (100, 0)), self.ground, spacing=10)
        gaps = [abs(b[0] - a[0]) for a, b in zip(pts, pts[1:])]
        self.assertLessEqual(max(gaps), 10)


if __name__ == "__main__":
    unittest.main()
