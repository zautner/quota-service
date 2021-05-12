const ServiceError = require("../../utils/exceptions/ServiceError");
const Joi = require("joi");
const DynamoDBService = require("../../services/quotasUsage.dynamodb");
const getArrayParameter = require("../../utils/getArrayParameter");

module.exports.endpoint = async (req) => {
  const subscription = req.params.subscription;
  const quotas = req.query.quotas;
  const result = await DynamoDBService.query({
    subscriptionId: subscription,
    quotaId: quotas ? getArrayParameter(quotas) : null,
  })
  .catch((err) => {
    throw new ServiceError(`Error executing query - ${err}`);
  });
  
  return { status: 200, data: result };
};

module.exports.validations = {
  query: {
    quotas: Joi.string(),
  },
  params: {
    subscription: Joi.string(),
  },
};
