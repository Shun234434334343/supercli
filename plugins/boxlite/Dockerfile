FROM node:24-bookworm-slim

ARG BOXLITE_NPM_VERSION=latest

RUN npm install -g "@javimosch/boxlite@${BOXLITE_NPM_VERSION}" && npm cache clean --force

ENV PATH="/usr/local/bin:${PATH}"

CMD ["boxcli", "--output", "json", "capabilities"]
