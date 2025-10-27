# ! adapted from https://developers.redhat.com/blog/2021/03/04/making-environment-variables-accessible-in-front-end-containers#inject_the_environment_variables

FROM node:18

ARG NPM_LOGIN_EMAIL
ARG NPM_LOGIN_USER
ARG NPM_LOGIN_PASSWORD
ARG NPM_LOGIN_REGISTRY

# Copy only requirements to cache them in docker layer
WORKDIR /app
COPY package-lock.json package.json /app/

# Login and install dependencies
## https://stackoverflow.com/questions/23460980/how-to-set-npm-credentials-using-npm-login-without-reading-from-stdin
## https://github.com/rlidwka/sinopia/issues/329#issuecomment-217406747
 RUN DATASTRING="{\"name\": \"$NPM_LOGIN_USER\", \"password\": \"$NPM_LOGIN_PASSWORD\"}" \
    && \
    TOKEN=$(curl -s \
    -H "Accept: application/json" \
    -H "Content-Type:application/json" \
    -X PUT --data "${DATASTRING}" \
    --user "$NPM_LOGIN_USER":"$NPM_LOGIN_PASSWORD" \
   "${NPM_LOGIN_REGISTRY}/-/user/org.couchdb.user:${NPM_LOGIN_USER}" 2>&1 | grep -Po \
    '(?<="token": ")[^"]*') \
    && \
    npm config set registry "$NPM_LOGIN_REGISTRY" \
    && \
   npm config set //$(echo "$NPM_LOGIN_REGISTRY" | grep -o -P '(?<=https://).*(?=:)')/:_authToken "$TOKEN"
RUN npm install

## Install JQ
ENV JQ_VERSION=1.6
RUN wget --no-check-certificate https://github.com/stedolan/jq/releases/download/jq-${JQ_VERSION}/jq-linux64 -O /tmp/jq-linux64
RUN cp /tmp/jq-linux64 /usr/bin/jq
RUN chmod +x /usr/bin/jq


# Now copy everything
COPY . .

## -- Magic environment variables remapping. Will be used by start-nginx.sh
RUN jq 'to_entries | map_values({ (.key) : ("$" + .key) }) | reduce .[] as $item ({}; . + $item)' ./src/environment.json > ./src/environment.tmp.json && mv ./src/environment.tmp.json ./src/environment.json

# Parcel build
RUN npx parcel build --public-url "\$BASE_URL"
# you can't escape $ in json...
# --

# CREATE ENTRYPOINT WITH NGINX
FROM nginx:1.17
## To use sponge in start_nginx.sh
RUN apt-get update && apt-get install moreutils -y
## Copy everything
ENV HTMLFOLDER=/usr/share/nginx/html/*.html
ENV JSFOLDER=/usr/share/nginx/html/*.js
COPY ./start-nginx.sh /usr/bin/start-nginx.sh
RUN chmod +x /usr/bin/start-nginx.sh
WORKDIR /usr/share/nginx/html
COPY --from=0 /app/dist .
ENTRYPOINT [ "start-nginx.sh" ]