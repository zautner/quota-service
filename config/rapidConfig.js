const remoteConfig = { default: {} };

module.exports = { get };

// ///////////////////////////////////////////

function get(key) {
  return process.env[key] || remoteConfig.default[key];
}
