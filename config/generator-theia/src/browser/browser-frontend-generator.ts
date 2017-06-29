/*
 * Copyright (C) 2017 TypeFox and others.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */

import { AbstractGenerator, FileSystem } from "./abstract-generator";

export class BrowserFrontendGenerator extends AbstractGenerator {

    generate(fs: FileSystem): void {
        fs.write(this.frontend('index.html'), this.compileIndexHtml())
        fs.write(this.frontend('index.js'), this.compileIndexJs());
    }

    protected compileIndexHtml(): string {
        return `<!DOCTYPE html>
<html>

<head>
  <meta charset="UTF-8">
  <link href="http://maxcdn.bootstrapcdn.com/font-awesome/4.2.0/css/font-awesome.min.css" rel="stylesheet">
  <script type="text/javascript" src="https://www.promisejs.org/polyfills/promise-6.1.0.js" charset="utf-8"></script>
  <script type="text/javascript" src="./vs/loader.js" charset="utf-8"></script>
  <script type="text/javascript" src="./bundle.js" charset="utf-8"></script>
</head>

<body>
</body>

</html>`;
    }

    protected compileIndexJs(): string {
        return `${this.compileCopyright()}
import { Container } from 'inversify';
import { FrontendApplication, frontendApplicationModule, loggerFrontendModule } from 'theia-core/lib/application/browser';
import { messagingFrontendModule } from 'theia-core/lib/messaging/browser';

const container = new Container();
container.load(frontendApplicationModule);
container.load(messagingFrontendModule);
container.load(loggerFrontendModule);

function load(raw) {
    return Promise.resolve(raw.default).then(module =>
        container.load(module)
    )
}

function start() {
    const application = container.get(FrontendApplication);
    application.start();
}

Promise.resolve()${this.compileFrontendModuleImports(this.model.frontendModules)}
.then(start);`;
    }

}