FROM mongo:3.2

COPY data.json /tmp/data.json
RUN sleep 2
CMD mongoimport --host mongodb --db nba --collection players --type json --file /tmp/data.json --jsonArray
