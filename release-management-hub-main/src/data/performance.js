/* Shared source for the mid-year review numbers, so the dashboard summary and
   the Performance Reviews page can never disagree with each other. */
export const PERF = {
  completion: 68,
  submitted: 42,
  remaining: 20,
  people: 62,
  depts: 8,
  self: [58, 62],
  manager: [42, 62],
  calib: [12, 18],
};

/** Array of [department name, completed, total]. */
export const PERF_DEPTS = [
  ["Engineering", 18, 22],
  ["Product & Design", 10, 14],
  ["Sales", 9, 15],
  ["Customer Success", 5, 11],
];
