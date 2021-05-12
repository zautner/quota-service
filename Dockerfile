FROM yandex/clickhouse-server:20.3
COPY tableCreate.sh /docker-entrypoint-initdb.d/
EXPOSE 9000
EXPOSE 8723
