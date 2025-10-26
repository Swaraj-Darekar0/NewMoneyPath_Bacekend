// A list of IANA timezones. In a real application, this might be generated
// or kept up-to-date with a library, but for this purpose, a static list is sufficient.
const timezones = [
  'Asia/Kolkata',
  // Add other relevant timezones here as your user base grows
  'Europe/London',
  'America/New_York',
  'America/Los_Angeles',
  'Australia/Sydney',
];

module.exports = {
  timezones,
};
