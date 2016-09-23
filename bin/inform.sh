#!/usr/bin/env bash

STAGE=$1
BRANCH=$2
LIFECYCLE=$3
NAME=sparks-cyclejs
VERSION=`jq -r ".version" package.json`

curl -X POST https://sparks-bi.herokuapp.com/release \
-F "stage=$STAGE" \
-F "name=sparks-backend" \
-F "changelog=@./CHANGELOG.md" \
-F "branch=$BRANCH" \
-F "version=$VERSION" \
-F "lifecycle=$LIFECYCLE"
