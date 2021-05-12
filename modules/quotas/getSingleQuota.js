const Joi = require('joi');
const quotasQuery = require('../../utils/quotasQuery');

module.exports.endpoint = async (req) => {
  const { from = 0, to = 'sysdate', resolution = 'minutes', sort = 'asc', groupby, source } = req.query;
  const { subscription, quota } = req.params;
  try {
    const result = await quotasQuery.query({
      from,
      to,
      resolution,
      sort,
      groupby,
      subscriptionId: subscription,
      quotaId: quota,
    }, source);
    return { status: 200, data: result };
  } catch (err) {
    if (logger) {
      logger.error(err);
    }
    return { status: 400, data: err.message };
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
    groupby: Joi.any()
      .allow('subscription', 'quota'),
    resolution: Joi.any()
      .allow('seconds', 'minutes', 'hours', 'days', 'months', 'years'),
    source: Joi.string(),
  },
  params: {
    subscription: Joi.string(),
    quota: Joi.string(),
  }
};
