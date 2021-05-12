const Joi = require('joi');
const quotasQuery = require('../../utils/quotasQuery');
const getArrayParameter = require('../../utils/getArrayParameter');

module.exports.endpoint = async (req) => {
  const subscription = req.params.subscription || req.query.subscription;
  const quotas = req.params.quotas || req.query.quotas;
  const { from = 0, to = 'sysdate', resolution = 'minutes', sort = 'asc', groupby, source } = req.query;
  try {
    const result = await quotasQuery.query({
      from,
      to,
      resolution,
      sort,
      groupby,
      subscriptionId: getArrayParameter(subscription),
      quotaId: quotas ? getArrayParameter(quotas) : null,
    }, source);
    const res = { status: 200, data: result };
    logger.info(res);
    return res;
  } catch (err) {
    logger.error(err);
    return {
      status: 400,
      data: err.message
    };
    // throw new BadRequest(`Error executing query - ${[{ err, stack: err.stack }].map(safeStringify)}`);
  }
};


module.exports.validations = {
  query: {
    from: Joi.string()
      .isoDate(),
    to: Joi.string()
      .isoDate(),
    sort: Joi.any()
      .allow('desc', 'asc'),
    subscription: Joi.string(),
    quotas: Joi.string(),
    groupby: Joi.any()
      .allow('subscription', 'quota'),
    resolution: Joi.any()
      .allow('seconds', 'minutes', 'hours', 'days', 'months', 'years'),
    source: Joi.string(),
  },
  params: {
    subscription: Joi.string(),
    quotas: Joi.string(),
  }
};
