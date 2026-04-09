FROM ghcr.io/puppeteer/puppeteer:latest

USER root
WORKDIR /usr/src/app
RUN chown -R pptruser:pptruser /usr/src/app

USER pptruser

COPY --chown=pptruser:pptruser package*.json ./
RUN npm install

COPY --chown=pptruser:pptruser . .

WORKDIR /usr/src/app/frontend
RUN npm install
RUN npm run build

WORKDIR /usr/src/app

CMD [ "node", "index.js" ]
