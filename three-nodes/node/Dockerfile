FROM node:5

COPY app.js /tmp/app.js
COPY package.json /tmp/package.json

RUN cd /tmp && npm install

CMD ["node", "/tmp/app.js"]

EXPOSE 3000
