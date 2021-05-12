const ClickhouseService = require("../services/quotas.clickhouse");

function getPivots(options) {
  const groupMap = {
    quota: "quotaid",
    subscription: "subscriptionid",
  };

  const pivots = ["date"];
  if (options.groupby) {
    pivots.push(groupMap[options.groupby]);
  }

  return pivots;
}

/**
 * Pivots an array around labels
 * @param array array to pivot (array elements should be objects)
 * @param pivots pivot points (points must be properties of array elements)
 * @returns {*}
 */
function pivotArray(array, pivots) {
  if (pivots.length === 0) {
    return array;
  }

  const pivot = pivots.splice(0, 1);
  const pivotBy = pivot[0].split(",")[0];
  const pivotedArray = array.reduce((pivoted, current) => {
    if (!pivoted.hasOwnProperty(current[pivotBy])) {
      pivoted[current[pivotBy]] = [];
    }
    pivoted[current[pivotBy]].push(current);

    return pivoted;
  }, {});

  Object.keys(pivotedArray)
    .forEach((key) => {
      pivotedArray[key] = pivotArray(pivotedArray[key], pivots.slice()); // Slice used to pass by value and not by ref
    });

  return pivotedArray;
}

async function getService(options, source) {
  const ret = ClickhouseService;
  return ret;
}

async function queryInvoice(options) {
  options.nodynamo = true;
  try {
    const service = await getService(options);
    const results = await service.queryInvoice(options);
    const pivots = getPivots(options);
    const ret = pivotArray(results, pivots);
    ret.metadata = { source: service.name };
    return ret;
  } catch (error) {
    logger.error(error);// eslint-disable-line
    throw error;
  }
}

async function queryByPeriods(options) {
  options.nodynamo = true;
  try {
    const service = await getService(options);
    const results = await service.queryByPeriods(options);
    const pivots = getPivots(options);
    const ret = pivotArray(results, pivots);
    ret.metadata = { source: service.name };
    return ret;
  } catch (error) {
    logger.error(error);// eslint-disable-line
    throw error;
  }
}

/**
 *
 * @param {*} options
 *      from: '', //optional
 *      to: '', //optional
 *      resolution: '' //optional
 * @param {*} source
 */
async function query(options, source) {
  const service = await getService(options, source);
  const results = await service.query(options);
  try {
    const pivots = getPivots(options);
    const ret = pivotArray(results, pivots);
    ret.metadata = { source: service.name };
    return ret;
  } catch (error) {
    logger.error(error);// eslint-disable-line
    throw error;
  }
}

/**
 *
 * @param {*} options
 *      from: '', //optional
 *      to: '', //optional
 *      resolution: '' //optional
 * @param {*} source
 */
async function rawQuery(options, queryString, source) {
  try {
    const service = await getService(options, source);
    const results = await service.rawQuery(queryString);
    return results;
  } catch (error) {
    logger.error(error);// eslint-disable-line
    throw error;
  }
}

module.exports.query = query;
module.exports.rawQuery = rawQuery;
module.exports.queryInvoice = queryInvoice;
module.exports.queryByPeriods = queryByPeriods;
