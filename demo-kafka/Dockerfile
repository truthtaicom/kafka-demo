FROM node:12-alpine

ENV PORT 3000

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY package*.json  ./
RUN npm install --silent

COPY ./src ./src

EXPOSE 3000

CMD "npm" "run" "start"