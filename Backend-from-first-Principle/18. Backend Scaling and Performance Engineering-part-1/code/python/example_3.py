import cProfile
import pstats

# Profile a function and print the top 20 slowest calls
with cProfile.Profile() as pr:
    handle_request()  # your function under test

stats = pstats.Stats(pr)
stats.sort_stats("cumulative")
stats.print_stats(20)

# For flame graphs, use py-spy (external tool):
#   pip install py-spy
#   py-spy record -o profile.svg -- python app.py
