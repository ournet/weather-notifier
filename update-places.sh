#!/bin/bash

git pull
yarn
tsc

COUNTRY=ro node ./lib/scripts/update-places
git add .
git commit -m "updated places ids"
git push
