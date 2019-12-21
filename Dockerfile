FROM node:alpine

RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app

WORKDIR /home/node/app

COPY package*.json ./

USER node

RUN npm install
# RUN npm install typescript -g
# RUN npm install nodemon -g

COPY --chown=node:node . .

RUN npm run build

EXPOSE 3000
CMD node build/server.js