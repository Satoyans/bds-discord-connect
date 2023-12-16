cd %~dp0
chcp 65001
call "./node/node18"
call npx tsc index.ts
title BDS-Discord-Connection-Main
node .
pause