FROM mongo:3.2

COPY data.json /tmp/data.json

CMD mongoimport --host mongodb --db nba --collection players --type json --file /tmp/data.json --jsonArray
