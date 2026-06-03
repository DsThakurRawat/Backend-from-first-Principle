# pip install pytest-benchmark — the `benchmark` fixture times the callable.
def test_parse_event_perf(benchmark):
    payload = b'{"type":"click","ts":1717000000}'
    result = benchmark(parse_event, payload)   # runs it many times, reports stats
    assert result.type == "click"              # still assert correctness

# Output reports min/mean/median/stddev; --benchmark-compare flags regressions.
