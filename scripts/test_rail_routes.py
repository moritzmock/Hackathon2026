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


if __name__ == "__main__":
    unittest.main()
