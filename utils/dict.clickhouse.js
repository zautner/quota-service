module.exports = {
  Sources: {
    Tables: {
      quotas: "quotas_data",
      quotas_aggregated: "quotas_data_minute",
    },
    Views: {
      quotas: "quotas_data_minute_mv",
    }
  },
  Constants: {
    Version: 1.0,
    SQLDictionary: {
      QuotaView: {
        GroupBy: {
          quotaid: "quotaid",
          quota: "quotaid",
          apiid: "apiid",
          subscriptionid: "subscriptionid",
          subscription: "subscriptionid",
          calltime: "calltimeAgg",
          // eslint-disable-next-line global-require
          timeformats: require("../DAO/Clickhouse").timeformats
        },
        SelectField: {
          quotaid: "quotaid",
          quota: "quotaid",
          apiid: "apiid",
          total: "sumMerge(incrementsum) as total",
          calltime: "calltimeAgg",
          logs: "*",
        }
      },
      StatsTable: {
        LogOrder: "1",
      },
      QuotaTable: {
        GroupBy: {
          quotaid: "quotaid",
          quota: "quotaid",
          apiid: "apiid",
          subscriptionid: "subscriptionid",
          subscription: "subscriptionid",
          calltime: "calltime",
          // eslint-disable-next-line global-require
          timeformats: require("../DAO/Clickhouse").timeformats
        },
        SelectField: {
          quotaid: "quotaid",
          quota: "quotaid",
          apiid: "apiid",
          total: "sum(increment) as total",
          calltime: "calltime",
          subscriptionid: "subscriptionid",
          subscription: "subscriptionid",
          logs: "*",
        }
      },
      QuotaTableAggregated: {
        GroupBy: {
          quotaid: "quotaid",
          quota: "quotaid",
          subscriptionid: "subscriptionid",
          subscription: "subscriptionid",
          calltime: "calltimeAgg",
          // eslint-disable-next-line global-require
          timeformats: require("../DAO/Clickhouse").timeformats
        },
        SelectField: {
          quotaid: "quotaid",
          quota: "quotaid",
          total: "sumMerge(incrementsum) as total",
          calltime: "calltimeAgg",
          subscriptionid: "subscriptionid",
          subscription: "subscriptionid",
          logs: "*",
        }
      }
    }
  }
};
