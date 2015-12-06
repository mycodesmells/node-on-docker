FROM node:5

COPY app.js /tmp/app.js

CMD ["node", "/tmp/app.js"]

EXPOSE 3000