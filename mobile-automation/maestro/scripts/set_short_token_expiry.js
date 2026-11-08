// Makes newly issued access tokens expire after two seconds, so a relaunch finds an expired one.
// Runs inside Maestro's JavaScript engine. The flow's reset script restores the default.
const response = http.post(BACKEND_URL + CONFIG_PATH, {
  headers: { 'Content-Type': 'application/json', 'x-bypass-rate-limit': 'true' },
  body: '{"jwtExpirySeconds":2}',
});
if (response.status !== 200) {
  throw new Error('Setting the token expiry failed with HTTP ' + response.status + ': ' + response.body);
}
