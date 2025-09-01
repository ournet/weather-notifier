#!/bin/bash

#echo $COUNTRY

git pull
yarn
yarn tsc

COUNTRY=ro node ./lib/scripts/update-places
COUNTRY=ru node ./lib/scripts/update-places
COUNTRY=al node ./lib/scripts/update-places
git add .
git commit -m "updated places ids"
git push origin
