import http from 'k6/http';
import { check } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 100 },  // ramp up to 100 virtual users
    { duration: '1m',  target: 100 },  // hold
    { duration: '30s', target: 0 },    // ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<300'],  // 95th-percentile latency must stay < 300ms
    http_req_failed:   ['rate<0.01'],  // error rate must stay under 1%
  },
};
export default function () {
  const res = http.get('https://staging.example.com/api/v1/health');
  check(res, { 'status 200': (r) => r.status === 200 });
}
# Run:  k6 run load_test.js   — fails the build if a threshold is breached.
