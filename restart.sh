#!/bin/bash

while :; do

  nc -z localhost 4000
  if [ $? -eq 0 ]; then
    fuser -k -n tcp 4000
  else
    break
  fi

done

cd /www/wwwroot/AI-Landing-Page-Generator
nohup pnpm dev --port=4000 >> ailandingpage.log 2>&1 &