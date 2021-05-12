module.exports = param => (param || "").split(",")
  .map(a => a.trim())
  .filter(a => a !== "");
