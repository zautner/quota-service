/* eslint-disable  max-len, no-unused-vars */
const safeStringify = require("fast-safe-stringify");
const Clickhouse = require("../DAO/Clickhouse");
const { Sources } = require("../utils/dict.clickhouse");
const { QuotaView: QuotaViewDictionary, QuotaTable: QuotaTableDictionary, QuotaTableAggregated: QuotaTableAggregatedDictionary } = require("../utils/dict.clickhouse").Constants.SQLDictionary;
const BadGateway = require("../utils/exceptions/BadGateway");
// Join both SQLDictionary dicts

const tableColumnNames = {
  subscriptionCol: Clickhouse.getColumnName(QuotaTableDictionary.SelectField, "subscriptionid"),
  quotaCol: Clickhouse.getColumnName(QuotaTableDictionary.SelectField, "quotaid"),
  calltimeCol: Clickhouse.getColumnName(QuotaTableDictionary.SelectField, "calltime"),
  incrementCol: Clickhouse.getColumnName(QuotaTableDictionary.SelectField, "total"),
  apiIdCol: Clickhouse.getColumnName(QuotaTableDictionary.SelectField, "apiId"),
  calltimeColName: Clickhouse.getColumnName(QuotaTableDictionary.GroupBy, "calltime"),
  subscriptionColName: Clickhouse.getColumnName(QuotaTableDictionary.GroupBy, "subscription"),
  quotaNameCol: Clickhouse.getColumnName(QuotaTableDictionary.GroupBy, "quotaid"),
};

const tableAggregatedColumnNames = {
  subscriptionCol: Clickhouse.getColumnName(QuotaTableAggregatedDictionary.SelectField, "subscriptionid"),
  quotaCol: Clickhouse.getColumnName(QuotaTableAggregatedDictionary.SelectField, "quotaid"),
  calltimeCol: Clickhouse.getColumnName(QuotaTableAggregatedDictionary.SelectField, "calltime"),
  incrementCol: Clickhouse.getColumnName(QuotaTableAggregatedDictionary.SelectField, "total"),
  apiIdCol: Clickhouse.getColumnName(QuotaTableAggregatedDictionary.SelectField, "apiId"),
  calltimeColName: Clickhouse.getColumnName(QuotaTableAggregatedDictionary.GroupBy, "calltime"),
  subscriptionColName: Clickhouse.getColumnName(QuotaTableAggregatedDictionary.GroupBy, "subscription"),
  quotaNameCol: Clickhouse.getColumnName(QuotaTableAggregatedDictionary.GroupBy, "quotaid"),
};

/**
 * Generates parameter related to grouping
 * @param options
 * @returns {{select: Array, groupBy: Array}}
 */
function generateGroupBy(options) {
  const result = {
    select: ["quotaid"], // Fields to be added to select statement
    groupBy: ["quotaid"] // Fields to be added to group by statement
  };

  // TIME RESOLUTION
  const timeFormats = Clickhouse.getTimeFormats();

  if (options.hasOwnProperty("resolution") && Object.keys(timeFormats)
    .indexOf(options.resolution) >= 0) {
    result.select.push(`
formatDateTime(${QuotaViewDictionary.GroupBy.calltime},
'${QuotaViewDictionary.GroupBy.timeformats[options.resolution]}') as date
`);
    result.groupBy.push("date");
  }

  return result;
}

/**
 * Choose the table to fetch data from
 * @param options
 * @param count
 * @returns {string}
 */
function chooseTableName(options, count) {
  return options || Sources.Views.quotas;
}

/**
 * Generate DB Query String based on provided options
 * @param options
 */
function generateQueryString(options) {
  const { select, groupBy } = generateGroupBy(options);

  return `SELECT ${QuotaViewDictionary.SelectField.total}, ${select.filter((val) => !!val)
    .join(", ")}
    FROM ${chooseTableName(options.resources, select.length)}
    WHERE ${Clickhouse.combineWhereCond(
      Clickhouse.generateWhereCondition({ columnName: "subscriptionid", paramValue: options.subscriptionId, dictionary: QuotaViewDictionary.SelectField }),
      options.quotaId ? Clickhouse.generateWhereCondition({ columnName: "quotaid", paramValue: options.quotaId, dictionary: QuotaViewDictionary.SelectField }) : "",
      Clickhouse.generateTimeFrame(options.from, options.to, options.inclusiveto),
    )}
    ${(!groupBy.length) ? "" : "group by"} ${groupBy.join(", ")}
    ORDER BY date ${options.sort}
    `;
}

function generateInvoiceQueryString(options) {
  const whereQuotas = options.quotaId && options.quotaId.length
    ? `AND qd.${Clickhouse.generateWhereCondition({ columnName: tableColumnNames.quotaCol, paramValue: options.quotaId, dictionary: QuotaViewDictionary.SelectField })}`
    : "";
  const whereSubscriptions = options.subscriptionId && options.subscriptionId.length
    ? Clickhouse.generateWhereCondition({ columnName: tableColumnNames.subscriptionCol, paramValue: options.subscriptionId, dictionary: QuotaViewDictionary.SelectField })
    : undefined;
  const actualQuotaTable = Sources.Tables.quotas;
  const actualDateModFunction = Clickhouse.getDateAddSqlFunc(options.resolution);
  const { from, to } = options;
  const calltimeColExpress = tableColumnNames.calltimeCol;
  const quotaColExpress = tableColumnNames.quotaCol;
  const subscriptionColExpress = tableColumnNames.subscriptionCol;
  const incrementExpression = tableColumnNames.incrementCol;
  const maxBucketColExpesss = "max(bucket) AS difftimesDays";
  const dateColExpression = `addDays(toDateTime('${from}'), bucket)   AS date`;
  const { calltimeColName, subscriptionColName } = tableColumnNames;
  const quotaColName = tableColumnNames.quotaCol;
  const dateColName = "date";

  if (!whereSubscriptions || !actualQuotaTable || !actualDateModFunction || !from || !to) {
    throw new BadGateway(`Bad invoice options: ${safeStringify(options)}`);
  }
  return `
SELECT ${quotaColExpress},             
       ${maxBucketColExpesss},
       ${incrementExpression},
       ${subscriptionColExpress},
       ${dateColExpression}
FROM ${actualQuotaTable} qd  ARRAY JOIN (range(32)) AS bucket
PREWHERE qd.${whereSubscriptions} ${whereQuotas} AND qd.${calltimeColName} >= '${from}' AND qd.${calltimeColExpress} < '${to}'
WHERE qd.${calltimeColName} >= addDays(toDateTime('${from}'), bucket)
AND qd.${calltimeColName} < addDays(toDateTime('${from}'), bucket + 1)
GROUP BY ${dateColName}, ${subscriptionColName}, ${quotaColName}
ORDER BY ${dateColName}
  `;
}

function generatePeriodsQueryString(options) {
  const whereQuotas = options.quotaId && options.quotaId.length
    ? `AND qd.${Clickhouse.generateWhereCondition({ columnName: tableAggregatedColumnNames.quotaCol, paramValue: options.quotaId, dictionary: QuotaViewDictionary.SelectField })}`
    : "";
  const whereSubscriptions = options.subscriptionId && options.subscriptionId.length
    ? Clickhouse.generateWhereCondition({ columnName: tableAggregatedColumnNames.subscriptionCol, paramValue: options.subscriptionId, dictionary: QuotaViewDictionary.SelectField })
    : undefined;
  const actualQuotaTable = Sources.Tables.quotas_aggregated;
  const actualDateModFunction = Clickhouse.getDateAddSqlFunc(options.resolution);
  const { from, to } = options;
  const calltimeColExpress = tableAggregatedColumnNames.calltimeCol;
  const quotaColExpress = tableAggregatedColumnNames.quotaCol;
  const subscriptionColExpress = tableAggregatedColumnNames.subscriptionCol;
  const incrementExpression = tableAggregatedColumnNames.incrementCol;
  const maxBucketColExpesss = "max(bucket) AS difftimesDays";
  const dateColExpression = `${actualDateModFunction}(toDateTime('${from}'), bucket)   AS date`;
  const { calltimeColName, subscriptionColName } = tableAggregatedColumnNames;
  const quotaColName = tableAggregatedColumnNames.quotaCol;
  const dateColName = "date";

  if (!whereSubscriptions || !actualQuotaTable || !actualDateModFunction || !from || !to) {
    throw new BadGateway(`Bad invoice options: ${safeStringify(options)}`);
  }
  return `
    SELECT ${quotaColExpress},             
          ${maxBucketColExpesss},
          ${incrementExpression},
          ${subscriptionColExpress},
          ${dateColExpression}
    FROM ${actualQuotaTable} qd  ARRAY JOIN (range(32)) AS bucket
    PREWHERE qd.${whereSubscriptions} ${whereQuotas} AND qd.${calltimeColName} >= '${from}' AND qd.${calltimeColExpress} < '${to}'
    WHERE qd.${calltimeColName} >= ${actualDateModFunction}(toDateTime('${from}'), bucket)
    AND qd.${calltimeColName} < ${actualDateModFunction}(toDateTime('${from}'), bucket + 1)
    GROUP BY ${dateColName}, ${subscriptionColName}, ${quotaColName}
    ORDER BY ${dateColName}
      `;
}

function run(queryString) {
  return new Promise((resolve, reject) => {
    const innerPromise = Clickhouse.query(queryString);
    innerPromise.then((results) => resolve(results))
      .catch((reason) => {
        logger.error(reason);// eslint-disable-line
        reject(reason);
      });
  });
}

/**
 * @param options
 * {
 *      from: '', //optional
 *      to: '', //optional
 *      resolution: '' //optional
 * @returns {Promise.<void>}
 */
function queryInvoice(options) {
  const queryString = generateInvoiceQueryString(options);
  return run(queryString);
}

/**
 * @param options
 * {
 *      from: '', //optional
 *      to: '', //optional
 *      resolution: '' //optional
 * @returns {Promise.<void>}
 */
function queryByPeriods(options) {
  let queryString = generatePeriodsQueryString(options);
  return run(queryString);
}

/**
 * @param options
 * {
 *      from: '', //optional
 *      to: '', //optional
 *      resolution: '' //optional
 * @returns {Promise.<void>}
 */
function query(options) {
  let queryString = generateQueryString(options);
  queryString = queryString.replace(/\n+/gim, " ");
  return run(queryString);
}

/**
 * @param queryString
 * {
 *      from: '', //optional
 *      to: '', //optional
 *      resolution: '' //optional
 * @returns {Promise.<void>}
 */
function rawQuery(queryString) {
  queryString = queryString.replace(/\n+/gim, " ");
  return run(queryString);
}

const ClickhouseService = {
  query,
  queryInvoice,
  rawQuery,
  queryByPeriods
};

module.exports = ClickhouseService;
module.exports.name = module.id.replace(/.*\//, "");
