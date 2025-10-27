# BrainArt Webapp Visualizer

Brainart BrainFrame viewer built with Processing (https://p5js.org/), controllable via socket (https://socket.io/) and built with parcel (https://parceljs.org/).

Designed to be used with the BrainArt Web platform.

`npm run serve` or `npm run start` to start the application. `npm run build` to build a local version; for the building of the CI version, check the Dockerfile.

`npm run test` to start the test server, normally exposed on port `5000` of `localhost`, which will send:
- a single BrainFrame
- a couple BrainFrame with concurrent submission
- a couple BrainFrame with deferred submission
such sending will involve only the visualizer with `test` code, so it is important to start the visualizer with parameter `?vid=test` in the url.

## How the heck are environment variables passed to a dockerized and production built frontend application?
I used [this reference](https://developers.redhat.com/blog/2021/03/04/making-environment-variables-accessible-in-front-end-containers#inject_the_environment_variables).
=> long story short:
- in `src/environment.json` I defined the environment variables I want to control through the Docker, with defaults for local development (`npm run serve`);
- in `Dockerfile` I replace all defaults in the json with a same-named $placeholder (eg. the `SOCKET_ADDRESS` env variable will be set to `SOCKET_ADDRESS: "$SOCKET_ADDRESS"` inside the json) using the `jq` library, and I set the `start_nginx.sh` script as entrypoint; 
- in `start_nginx.sh` i replace all $placeholders with the actual values of the current `docker run` / `docker compose` environment _(check it out, it's a slightly modified, safer version than the one in the reference!)_

The `BASE_URL` environment variable is slightly different. It is embedded in the build process of the `package.json` file: the `--public-url` parameter changes all `/` paths in the exported `index.html` to `$BASE_URL`. This placeholder is then replaced in the `start_nginx.sh` entrypoint as well.


## Build Dockerfile
It's heavily suggested to build in Linux / inside WSL!
```
docker build --build-arg NPM_LOGIN_EMAIL=value1 --build-arg NPM_LOGIN_USER=value2 --build-arg NPM_LOGIN_PASSWORD=value3 --build-arg NPM_LOGIN_REGISTRY=https://verdaccio.vibre.io:443 -t webapp:latest . 
```
Add `--progress=plain --no-cache` options for debugging purposes (eg. showing the outputs of echo and cat commands).
