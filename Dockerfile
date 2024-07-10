FROM node:22-alpine AS build
WORKDIR /opt/app
ADD *.json ./
RUN npm ci
ADD . .
RUN npm run build
RUN npm run browser:install

FROM node:22-alpine
WORKDIR /opt/app
ADD package*.json ./
RUN npm ci --omit=dev
COPY --from=build /opt/app/.env .env
COPY --from=build /opt/app/dist dist
CMD ["node", "dist/main"]
