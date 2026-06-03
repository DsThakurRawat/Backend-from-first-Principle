import numpy as np

# Simulated latency samples (in milliseconds)
samples = [12, 15, 22, 48, 95, 110, 340, 890, 1200, 4800]

print(f"P50:  {np.percentile(samples, 50):.0f}ms")
print(f"P90:  {np.percentile(samples, 90):.0f}ms")
print(f"P99:  {np.percentile(samples, 99):.0f}ms")
print(f"P99.9:{np.percentile(samples, 99.9):.0f}ms")
