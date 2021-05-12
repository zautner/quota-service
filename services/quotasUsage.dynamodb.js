const DynamoDB = require('../DAO/DynamoDB');

function getQueryParameters(subscriptionId, quotaId) {
  const params = {};

  if (!subscriptionId) {
    throw new Error('The query is missing subscriptionId');
  }

  if (quotaId) {
    params.subscriptionid_quotaid = {
      type: '=',
      item: `${subscriptionId}_${quotaId}`
    };
  } else {
    params.subscriptionid = {
      type: '=',
      item: subscriptionId,
    };
    params.indexName = {
      type: 'index',
      item: 'subscriptionid-index'
    };
  }

  return params;
}

function getResources() {
  return ['subscriptionid', 'quotaid', 'billing_cycle_start', 'billing_cycle_end', 'total', 'limit', 'period'];
}

function getData(options) {
  const tableName = process.env.DYNAMO_QUOTA_TABLE
  const queries = [];
  const resources = getResources(options);

  if (options.quotaId) {
    options.quotaId.forEach(quotaId => queries.push(getQueryParameters(options.subscriptionId, quotaId)));
  } else {
    queries.push(getQueryParameters(options.subscriptionId));
  }


  return new Promise((resolve, reject) => {
    const promises = [];

    queries.forEach((queryParams) => {
      promises.push(DynamoDB.query(tableName, queryParams, resources));
    });

    Promise.all(promises)
      .then(results => [].concat(...results))
      .then(resolve)
      .catch(reject);
  });
}

function aggregateData(array) {
  return array.reduce((acc, item) => {
    if (item.total) {
      item.total = parseInt(item.total);
    }
    if (item.limit) {
      item.limit = parseInt(item.limit);
    }

    acc[item.quotaid] = item;
    return acc;
  }, {});
}

function query(options) {
  return new Promise((resolve, reject) => {
    getData(options)
      .then((results) => {
        resolve(aggregateData(results));
      })
      .catch(reject);
  });
}

const DynamoDBService = {
  query,
};

module.exports = DynamoDBService;
module.exports.name = module.id.replace(/.*\//, "");
