function isObject(a) {
  return (!!a) && (a.constructor === Object);
}

module.exports = isObject;
