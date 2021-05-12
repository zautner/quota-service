const BadRequest = require('../../utils/exceptions/BadRequest');
const Joi = require('joi');
const quotasQuery = require('../../utils/quotasQuery');
const getArrayParameter = require('../../utils/getArrayParameter');
const moment = require('moment');

const ultimateTo = moment()
  .format('YYYY-MM-DD 00:00:00');
const ultimateFrom = moment()
  .add(-1, 'day')
  .format('YYYY-MM-DD 00:00:00');
module.exports.endpoint = async (req) => {
  const { from = ultimateFrom, to = ultimateTo, resolution = 'days' } = req.query;
  const { subscription, quota } = req.params;
  try {
    const result = await quotasQuery.queryInvoice({
      from: moment(from)
        .format('YYYY-MM-DD HH:mm:ss'),
      to: moment(to)
        .format('YYYY-MM-DD HH:mm:ss'),
      resolution,
      subscriptionId: getArrayParameter(subscription),
      quotaId: getArrayParameter(quota),
    });
    return { status: 200, data: result };
  } catch (err) {
    logger.error(err.toString());
    throw new BadRequest(`Error executing query - ${err}`);
  }
};


module.exports.validations = {
  query: {
    from: Joi.string()
    .isoDate()
    .default(ultimateFrom),
    source: Joi.string()
      .allow('raw', 'clickhouse'),
    to: Joi.string()
      .isoDate()
      .default(ultimateTo),
    resolution: Joi.any()
      .allow('seconds', 'minutes', 'hours', 'days', 'months', 'years')
      .default('days')
    ,
  },
  params: {
    subscription: Joi.string(),
    quota: Joi.string(),
  }
};
