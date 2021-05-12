const safeStringify = require("fast-safe-stringify");
const AWS = require("aws-sdk");
const moment = require("moment");
const {
  each, isEmpty, flattenDeep, cloneDeep
} = require("lodash");
const npdynamodb = require("npdynamodb");
const rapidConfig = require("../config/rapidConfig");
const BadGateway = require("../utils/exceptions/BadGateway");

AWS.config.update({
  region: rapidConfig.get("AWS_REGION"),
});

const dynamodb = new AWS.DynamoDB({
  apiVersion: "2012-08-10",
});

const npd = npdynamodb.createClient(dynamodb);

function getFilterOperatorQuery(queryBuilder, operator, key, value) {
  switch (operator.toLowerCase()) {
    case "between":
      return queryBuilder.filterBetween(key, value.from, value.to);
    case "begins_with":
      return queryBuilder.filterBeginsWith(key, value.item);
    case "not_null":
      return queryBuilder.filterNotNull(key);
    case "null":
      return queryBuilder.filterNull(key);
    case "contains":
      return queryBuilder.filterContains(key, value.item);
    case "not_contains":
      return queryBuilder.filterNotContains(key, value.item);
    case "in":
      return queryBuilder.filterIn(key, value.from, value.to);
    default:
      return queryBuilder.filter(key, value.operator, value.item);
  }
}

function buildQuery(queryBuilder, attributes, resources) {
  each(attributes, (value, key) => {
    switch (value.type.toLowerCase()) {
      case "index":
        queryBuilder = queryBuilder.indexName(value.item);
        break;
      case "filter":
        if (value.operator) {
          queryBuilder = getFilterOperatorQuery(queryBuilder, value.operator, key, value);
          break;
        }
        queryBuilder = queryBuilder.filter(key, value.item);
        break;
      case "null":
      case "not_null":
        break;
      case "between":
        queryBuilder = queryBuilder.whereBetween(key, value.from, value.to);
        if (value.sort) {
          queryBuilder = value.sort === "desc" ? queryBuilder.desc() : queryBuilder.asc();
        }
        break;
      case "limit":
        if (value.limit === 1) {
          queryBuilder = queryBuilder.first();
          break;
        }
        queryBuilder = queryBuilder.limit(value.limit);
        break;
      case "offset":
        queryBuilder = queryBuilder.offset(value.offset);
        break;
      default:
        if (value.operator) {
          queryBuilder = queryBuilder.where(key, value.operator, value.item);
          break;
        }
        queryBuilder = queryBuilder.where(key, value.item);
        break;
    }
  });
  queryBuilder = queryBuilder.feature((f) => {
    f.attributesToGet(resources);
  });
  
  return queryBuilder;
}

function query(tableName, attributes, resources) {
  return new Promise((resolve, reject) => {
    buildQuery(npd()
      .table(tableName), attributes, resources)
      .then((results) => {
        const collection = results.Items || [];
        if (results.LastEvaluatedKey) {
          attributes.rows = attributes.rows || {};
          attributes.rows = {
            type: "offset",
            offset: results.LastEvaluatedKey,
          };
          query(tableName, attributes, resources)
            .catch(reject)
            .then((items) => {
              resolve(collection.concat(items));
            });
        } else {
          resolve(collection);
        }
      })
      .catch(reject);
  });
}

function queryByKeys(tableName, keysNames, values) {
  return new Promise((resolve, reject) => {
    npd()
      .table(tableName)
      .whereIn(keysNames, values)
      .then((results) => {
        const collection = results.Responses[tableName] || [];
        if (!isEmpty(results.UnprocessedKeys)) {
          const unprocessedValues = results.UnprocessedKeys[tableName].Keys.map((key) => Object.values(key));
          queryByKeys(tableName, keysNames, unprocessedValues)
            .then((items) => {
              resolve(collection.concat(items));
            })
            .catch(reject);
        } else {
          resolve(collection);
        }
      })
      .catch(logger.error);
  });
}

async function batchQueryByKeys(tableName, keysNames, values) {
  const queries = [];
  const valuesClone = cloneDeep(values);
  while (valuesClone.length) {
    queries.push(queryByKeys(tableName, keysNames, valuesClone.splice(0, 100)));
  }
  return Promise.all(queries)
    .then((items) => flattenDeep(items))
    .catch((reason) => {
      throw new BadGateway(safeStringify(reason));
    });
}

function create(tableName, data) {
  return new Promise(((resolve, reject) => {
    npd()
      .table(tableName)
      .create(data)
      .then((response) => resolve(response))
      .catch((ex) => reject(ex));
  }));
}

function getTimeFormat(resolution) {
  // TIME RESOLUTION
  const timeFormats = {
    minutes: "YYYY-MM-DD HH:mm",
    hours: "YYYY-MM-DD HH",
    days: "YYYY-MM-DD",
    months: "YYYY-MM",
    years: "YYYY"
  };

  return timeFormats[resolution];
}

/**
 *
 * @param {Date | String} value
 * @param resolution - minutes/hours/days/months/years
 * @param {Boolean} end - is end of the resolution, otherwise - start of the resolution if exists
 * @returns {string}
 */
function timeValueConverter(value, resolution, end = false) {
  switch (`${value}`) {
    case "0":
      return "1970-01-01T00:00:00.000Z";
    case "sysdate":
      return moment.utc()
        .add(1, "d")
        .startOf("day")
        .toISOString();
    default:
      let date = moment.utc(value);
      if (resolution) {
        date = !end ? date.startOf(resolution) : date.endOf(resolution);
      }
      return date.toISOString();
  }
}

const DynamoDB = {
  query,
  batchQueryByKeys,
  create,
  getTimeFormat,
  timeValueConverter,
  MAX_BATCH_GET_ITEMS: 100,
  MAX_BATCH_WRITE_ITEMS: 25,
  extractValues: (items) => {
    return items.map((item) => {
      return Object.entries(item).reduce((acc, [key, value]) => {
        acc[key] = typeof value === "object" ? Object.values(value)[0] : value;
        return acc;
      }, {});
    });
  },
  dynamodb
};

module.exports = DynamoDB;
module.exports.name = module.id.replace(/.*\//, "");
