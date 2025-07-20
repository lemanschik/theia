TODO:

npm run compile

fix

npm run compile

fix.


=========================

import express = require('@theia/core/shared/express');
import fs = require('@theia/core/shared/fs-extra');
import React from 'react';

needs fixing

There are Plugin worker ESM => CJS Issues we need to fix that
packages\plugin-ext\src\hosted\browser\plugin-worker.ts

$ ts-clean-dangling && tsc --build

Error: ../../dev-packages/request/src/proxy.ts(60,12): error TS2349: This expression is not callable.
  No constituent of type 'typeof createHttpProxyAgent | typeof createHttpsProxyAgent' is callable.
Error: ../../dev-packages/localization-manager/src/deepl-api.ts(20,14): error TS2349: This expression is not callable.
  Type 'typeof bent' has no call signatures.
Error: ../../dev-packages/localization-manager/src/localization-extractor.ts(95,24): error TS2349: This expression is not callable.
  Type 'typeof deepmerge' has no call signatures.
Error: ../../dev-packages/localization-manager/src/localization-extractor.ts(103,24): error TS2349: This expression is not callable.


> @theia/monorepo@0.0.0 postinstall
> theia-patch && npm run -s compute-references && lerna run afterInstall

patch-package = D:\theia-fix_build\fix\node_modules\patch-package\dist\index.js
patchesdir = node_modules\@theia\cli\patches
patch-package 8.0.0
Applying patches...
@lumino/widgets@2.5.0 ✔
lerna notice cli v7.4.2

 >  Lerna (powered by Nx)   Running target afterInstall for 4 projects:

    - @theia/eslint-plugin
    - @theia/re-exports
    - @theia/core
    - @theia/electron

 ———————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————— 

> @theia/re-exports:afterInstall
