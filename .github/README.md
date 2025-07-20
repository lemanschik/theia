import express = require('@theia/core/shared/express');
import fs = require('@theia/core/shared/fs-extra');
import * as React from '@theia/core/shared/react';

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
