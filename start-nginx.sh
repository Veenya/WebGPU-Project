#!/usr/bin/env bash
# https://developers.redhat.com/blog/2021/03/04/making-environment-variables-accessible-in-front-end-containers#inject_the_environment_variables
export EXISTING_VARS=$(printenv | awk -F= '{print $1}' | sed 's/^/\$/g' | paste -sd,);
for file in $JSFOLDER;
do
  # cat $file | envsubst $EXISTING_VARS | tee $file
  # -- FROM COMMENTS, there can be a race condition, the command below fixes it. Sponge must be installed with moreutils
  envsubst $EXISTING_VARS < $file | sponge $file
done
for file in $HTMLFOLDER;
do
  # this is mostly useful for the $BASE_URL environment variable.
  envsubst $EXISTING_VARS < $file | sponge $file
done
nginx -g 'daemon off;'