// TODO: Add validation for filters
const filters = (req, res, next) => {
  const jsonify = (str) => {
    try {
      return JSON.parse(str);
    } catch (ex) {
      return str;
    }
  };

  const fields = ["order", "query", "page", "limit", "include"];
  req.filters = fields.reduce((acc, type) => {
    let val = jsonify(req.query[type]);
    if (type === "include" && !Array.isArray(val)) val = [val];
    if (req.query[type]) acc[type] = val;
    delete req.query[type];
    return acc;
  }, {});
  return next();
};
module.exports = filters;
