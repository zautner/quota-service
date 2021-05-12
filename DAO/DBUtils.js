/* eslint-disable indent */
const safeStringify = require("fast-safe-stringify");
const SqlString = require("sqlstring");
const moment = require("moment");
const flatten = require("lodash/flatten");
const isObject = require("../utils/isObject");
const { minParametersForExternalTable } = require("../utils/enums");

const escapeWithSingleQuotes = (input) => `'${input}'`;

function getTimeFormats() {
  return {
    seconds: "YYYY-MM-DD HH24:MI:SS",
    minutes: "YYYY-MM-DD HH24:MI",
    hours: "YYYY-MM-DD HH24",
    days: "YYYY-MM-DD",
    months: "YYYY-MM",
    years: "YYYY"
  };
}

/**
 * Convert inputs to SQL TIMESTAMP with support for special values 0, NOW()
 * @param value
 * @returns {*}
 */
function timeValueConverter(value) {
  switch (`${value}`) {
    case "0":
      return moment.utc()
        .subtract(1, "d")
        .startOf("day")
        .format("YYYY-MM-DD HH:mm:ss.SSS");
    // return "1970-01-01 00:00:00.000";
    case "sysdate":
      return moment.utc()
        .add(1, "d")
        .startOf("day")
        .format("YYYY-MM-DD HH:mm:ss.SSS");
    default:
      return moment.utc(value)
        .format("YYYY-MM-DD HH:mm:ss.SSS");
  }
}

/**
 * Converts a WHERE clause for call time (from / to)
 * @param from
 * @param to
 * @returns {string}
 */
function generateTimeFrame(from, to) {
  return `calltime >= '${timeValueConverter(from)}' and calltime < '${timeValueConverter(to)}'`;
}

/**
 * Converts pagination options
 * @param limit
 * @param offset
 * @returns {string}
 */
function generatePagination(limit, offset) {
  return limit ? `limit ${limit} offset ${offset}` : "";
}

function getColumnName(dictionary, columnName) {
  // eslint-disable-next-line prefer-rest-params
  if (dictionary && dictionary[columnName]) {
    columnName = dictionary[columnName];
  }
  return columnName;
}

/**
 * Combines WHERE statement using column name and value
 * @param columnName
 * @param paramValue
 * @param dictionary
 * @returns {string}
 */
function generateWhereCondition({
  columnName,
  paramValue,
  dictionary,
  useExternalTable = false,
  externalTableName,
}) {
  columnName = getColumnName(dictionary, columnName);
  // eslint-disable-next-line prefer-rest-params
  logger.info(Array.from(arguments));
  if (paramValue instanceof Array) {
    if (paramValue.length === 0) {
      return "1 = 1";
    }
    if (!useExternalTable || paramValue.length < minParametersForExternalTable) {
      return withoutExternalTable();
    }

    return withExternalTable();
  }
  if (isObject(paramValue)) {
    return buildLineFromObject(paramValue);
  }

  return `${columnName} = ${SqlString.escape(paramValue)}`;

  function withExternalTable() {
    return `(${isObject(paramValue[0]) ? Object.keys(paramValue[0]).join("\t") : columnName}) in (${externalTableName})`;
  }

  function withoutExternalTable() {
    if (isObject(paramValue[0])) {
      return paramValue.map(buildLineFromObject).join(" or ");
    }

    return `${columnName} in(${SqlString.escape(paramValue)})`;
  }

  function buildLineFromObject(obj) {
    const line = Object.keys(obj)
      .map((key) => `${key} = ${SqlString.escape(obj[key])}`)
      .join(" and ");
    return `(${line})`;
  }
}

/**
 * Combines WHERE clauses using the AND keyword
 * @param args
 * @returns {string}
 */
function combineWhereCond(...args) {
  return args.filter((a) => a !== "" && a !== undefined && a !== null)
    .join(" and ");
}

function generateNotIn({ $nin }) {
  if ($nin && flatten(Object.values($nin)).length > 0) {
    return Object.keys($nin)
      .map((key) => {
        if (Array.isArray($nin[key])) {
          return `${key} NOT IN (${
            $nin[key].map((val) => (typeof val === "string" ? escapeWithSingleQuotes(val) : val))
              .join(", ")
            })`;
        }
        return `${key} NOT IN (${typeof $nin[key] === "string" ? escapeWithSingleQuotes($nin[key]) : $nin[key]})`;
      })
      .join(" AND ");
  }
  return "";
}

const DBUtils = {
  getTimeFormats,
  timeValueConverter,
  generateWhereCondition,
  combineWhereCond,
  generateTimeFrame,
  generatePagination,
  generateNotIn,
  escapeWithSingleQuotes,
  getColumnName,
};

module.exports = DBUtils;
module.exports.name = module.id.replace(/.*\//, "");
