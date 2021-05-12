select 0;
CREATE TABLE IF NOT EXISTS default.quotas_data 
(
    requestid String CODEC(ZSTD),
    subscriptionid String CODEC(ZSTD),
    quotaid String,calltime DateTime,
    increment Int32 CODEC(ZSTD),
    version Nullable(FixedString(8)) DEFAULT CAST(‘’, ‘Nullable(FixedString(8))‘),
    userid Nullable(String),
    apiid Nullable(String),
    limit Nullable(Int32),
    period Nullable(FixedString(8))
)
ENGINE = MergeTree()
PARTITION BY toYYYYMMDD(calltime)
Order by (calltime , subscriptionid, quotaid);
select 1;
CREATE TABLE IF NOT EXISTS default.quotas_data_minute
(
     calltimeAgg DateTime,
     incrementsum AggregateFunction(sum, Int32),
     subscriptionid String,
     quotaid String
)
ENGINE = AggregatingMergeTree()
PARTITION BY toYYYYMM(calltimeAgg)
ORDER BY (calltimeAgg, subscriptionid, quotaid)
SETTINGS index_granularity = 8192;
CREATE MATERIALIZED VIEW IF NOT EXISTS default.quotas_data_minute_mv
TO default.quotas_data_minute
AS
SELECT toStartOfMinute(calltime) AS calltimeAgg, sumState(increment) as incrementsum, subscriptionid, quotaid
FROM default.quotas_data
GROUP BY toStartOfMinute(calltime), subscriptionid, quotaid;
select 4;
CREATE TABLE IF NOT EXISTS default.quotas_data_stage
(
    requestid String CODEC(ZSTD(1)),
    subscriptionid String CODEC(ZSTD(1)),
    quotaid String,
    calltime DateTime,
    increment Int32 CODEC(ZSTD(1)),
    version Nullable(FixedString(8)) DEFAULT CAST(‘’, ‘Nullable(FixedString(8))’),
    userid Nullable(String),
    apiid Nullable(String),
    limit Nullable(Int32),
    period Nullable(FixedString(8)),
    loadtime DateTime DEFAULT toStartOfMinute(now())
)
ENGINE = MergeTree()
PARTITION BY loadtime
ORDER BY (calltime, subscriptionid, quotaid)
SETTINGS index_granularity = 8192;
select 5;