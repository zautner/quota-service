/* eslint-disable indent */
const Clickhouse = require("clickhouse");
const moment = require("moment");
const DBUtuls = require("./DBUtils");
const randomint = require("../utils/randomint");
const rapidapiConfig = require("../config/rapidConfig");

const defaults = {
  protocol: "http",
  port: "8123",
  database: "default",
  user: undefined,
  password: undefined,
  format: "tsv",
  debug: false,
  addTimeFunctions: {
    seconds: "addSeconds",
    minutes: "addMinutes",
    hours: "addHours",
    days: "addDays",
    months: "addMonths",
    years: "addYears",
    __DEFAULT__: "addDays"
  }
};
const hosts = rapidapiConfig.get("CLICKHOUSE_HOST").split(/[\s]*,[\s]*/);
const clients = fillClients(hosts);
const clickhouses = clients.map((client) => new Clickhouse.ClickHouse(client));

/**
 * Fills the pool of clients
 * @param ips
 * @returns {[]}
 */

// DO NOT CHANGE THE CONFIGURATION! Talk to Andrey if there is a problem

function fillClients(ips) {
  const c = [];
  ips.forEach((ip) => {
    c.push({
      host: ip,
      port: rapidapiConfig.get("CLICKHOUSE_PORT") || Clickhouse.port || defaults.port,
      database: rapidapiConfig.get("CLICKHOUSE_DB") || Clickhouse.database || defaults.database,
      user: Clickhouse.user || defaults.user,
      password: Clickhouse.password || defaults.password,
      format: rapidapiConfig.get("CLICKHOUSE_FORMAT") || Clickhouse.format || defaults.format,
      debug: process.env.DEBUG || defaults.debug,
      isUseGzip: false,
      config: {
        session_timeout: 100,
        enable_http_compression: true
      }
    });
  });
  return c;
}

function getDateAddSqlFunc(timeformat) {
  let dateAdd = defaults.addTimeFunctions[timeformat];
  if (!dateAdd) {
    logger.error(`Unknown time format ${timeformat}`);
    dateAdd = defaults.addTimeFunctions.__DEFAULT__;
  }
  return dateAdd;
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
        .format("YYYY-MM-DD HH:mm:ss");
    case "sysdate":
      return moment.utc()
        .add(1, "d")
        .startOf("day")
        .format("YYYY-MM-DD HH:mm:ss");
    default:
      return moment.utc(value)
        .format("YYYY-MM-DD HH:mm:ss");
  }
}

/**
 * Converts a WHERE clause for call time (from / to)
 * @param from
 * @param to
 * @param inclusiveto
 * @param islog
 * @returns {string}
 */
function generateTimeFrame(from, to, inclusiveto, islog) {
  const calltime = islog ? "calltime" : "calltimeAgg";
  const upperBound = inclusiveto ? "<=" : "<";
  return `(${calltime} >= '${this.timeValueConverter(from)}' and ${calltime} ${upperBound} '${this.timeValueConverter(to)}')`;
}

/**
 * query the database
 * @param queryString
 * @param reqParams
 * @returns {Promise<unknown>}
 */
const query = (queryString, reqParams) => {
  logger.info({queryString, reqParams});
  return new Promise((resolve, reject) => {
    try {
      const promise = clickhouse()
        .query(queryString, reqParams)
        .toPromise();
      resolve(promise);
    } catch (err) {
      logger.error(err);
      reject(err);
    }
  });
};

function clickhouse() {
  const ret = clickhouses[randomint(clickhouses.length)];
  return ret;
}

module.exports = {
  ...DBUtuls,
  clickhouse,
  timeformats: {
    seconds: "%F %T",
    minutes: "%F %R",
    hours: "%F %H",
    days: "%F",
    months: "%Y-%m",
    years: "%Y"
  },
  query,
  generateTimeFrame,
  timeValueConverter,
  getDateAddSqlFunc,
};
module.exports.name = module.id.replace(/.*\//, "");
module.exports.addTimeFunctions = defaults.addTimeFunctions;
module.exports.startPeriodFunctions = {
  seconds: "",
  minutes: "toStartOfMinute",
  hours: "toStartOfHour",
  days: "toStartOfDay",
  months: "toStartOfMonth",
  years: "toStartOfYear"
};
