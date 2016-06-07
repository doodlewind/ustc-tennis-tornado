def elo_play_rank(r_a, r_b, a_is_winner):
    k = 16
    if a_is_winner:
        s_a = 1
        s_b = 0
    else:
        s_a = 0
        s_b = 1

    e_a = 1 / (1 + pow(10, (r_b - r_a) / 400))
    e_b = 1 / (1 + pow(10, (r_a - r_b) / 400))

    r_a_ = r_a + k * (s_a - e_a)
    r_b_ = r_b + k * (s_b - e_b)

    return [int(r_a_), int(r_b_)]

if __name__ == '__main__':
    print "a=1000, b=10, a win:", elo_play_rank(1000, 10, True)
    print "a=1000, b=10, b win:", elo_play_rank(1000, 10, False)
    print "a=500, b=500, a win:", elo_play_rank(500, 500, True)
    print "a=500, b=500, b win:", elo_play_rank(500, 500, False)
    print "a=17, b=0, a win:", elo_play_rank(17.4545454545, 0, True)
