## theia-web 
The Theia Web Package contains npm install theia-web and that contains theia-web/server and serviceWorker

this also superseeds theia extensions

## Use case
This project can be used to build a strong web file editor/reader. You need to implement your own [`FileSystemProvider`](https://code.visualstudio.com/api/references/vscode-api#FileSystemProvider) through extension. 
Additional you can also use [proposed API](https://code.visualstudio.com/api/advanced-topics/using-proposed-api) to implement a `TextSearchProvider` and `FileSearchProvider`.

## Sample project
This project is aimed to be used through npm package to avoid consumer to recompile whole solution.

Sample project can be found in this repository to illustate vscode-web usage. This sample is not fully functional as it misses a `FileSystemProvider` extension.

To run sample project 
```sh
cd ./sample
yarn
yarn sample
```

## Extension Gallery
Based on VS MarketPlace rules, you are not allowed to consume VSCode Marketplace from your own VSCode Web
But [Open VSX Registry](https://open-vsx.org/) is here to provide an alternate marketplace.

See the [product.json](sample/product.json) file in `sample` folder to configure it.


## Build from source

To build from source, you need same prerequisites as vscode : 
[VSCode Prerequisites](https://github.com/microsoft/vscode/wiki/How-to-Contribute#prerequisites)

Then simply run following commands

```
yarn
yarn build
```

## Run demo

To run the demo you need to build from source, then run following commands

```
yarn prepare-demo
yarn demo
```

## Notes
```
git clone github.com/microsoft/vscode
cd vscode
## the current version used comes from ./scripts/code-web.sh & code-server.sh 
## Error at the end can be fixed in ./build/gulpfile.js maybe
yarn add -D node 16.14.2
mkdir -p .build/node/v16.14.2
ln -s ../../../node_modules/node/bin .build/node/v16.14.2/linux-x64

## method one use patched yarn
PATH=$(pwd)/node_modules/node/bin:$PATH yarn compile-web
PATH=$(pwd)/node_modules/node/bin:$PATH ./scripts/code-web.sh
```


## Example Extension
http.js
```js
var express = require('express')
var serveStatic = require('serve-static')

var staticBasePath = './';
 
var app = express()
 
app.use(serveStatic(staticBasePath))
app.listen(8080)
console.log('Listening on port 8080');
```

package.json
```json
{
  "name": "web-editor",
  "version": "1.0.0",
  "description": "Theia web sample",
  "scripts": {
    "sample": "node ./http.js"
  },
  "author": "",
  "license": "Unlicense",
  "dependencies": {
    "express": "^4.17.1",
    "@theia/web": "^1.75.0"
  }
}
```

product.json
```json
{
	"productConfiguration": {
	  "nameShort": "VSCode Web Sample",
	  "nameLong": "VSCode Web sample",
	  "applicationName": "code-web-sample",
	  "dataFolderName": ".vscode-web-sample",
	  "version": "1.75.0",
	  "extensionsGallery": {
		"serviceUrl": "https://open-vsx.org/vscode/gallery",
		"itemUrl": "https://open-vsx.org/vscode/item",
		"resourceUrlTemplate":
		  "https://openvsxorg.blob.core.windows.net/resources/{publisher}/{name}/{version}/{path}"
	  },
	  "extensionEnabledApiProposals": {
		"vscode.vscode-web-playground": [
		  "fileSearchProvider",
		  "textSearchProvider"
		]
	  }
	},
	"folderUri": {
	  "scheme": "memfs",
	  "path": "/sample-folder"
	},
	"additionalBuiltinExtensions": [
	  {
		"scheme": "http",
		"path": "/myExt"
	  }
	]
  }
```

```html
<!DOCTYPE html>
<html>
	<head>
		<meta charset="utf-8" />

		<!-- Mobile tweaks -->
		<meta name="mobile-web-app-capable" content="yes" />
		<meta name="apple-mobile-web-app-capable" content="yes" />
		<meta name="apple-mobile-web-app-title" content="Code">
		<link rel="apple-touch-icon" href="/code-192.png" />

		<!-- Disable pinch zooming -->
		<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no">

		<!-- Workbench Icon/Manifest/CSS -->
		<link rel="icon" href="/favicon.ico" type="image/x-icon" />
		<link rel="manifest" href="/manifest.json">
		<link data-name="vs/workbench/workbench.web.main" rel="stylesheet" href="./node_modules/@theia/web/dist/out/vs/workbench/workbench.web.main.css">

	</head>

	<body aria-label="">
	</body>

	<!-- Startup (do not modify order of script tags!) -->
	<script src="./node_modules/@theia/web/dist/out/vs/loader.js"></script>
	<script src="./node_modules/@theia/web/dist/out/vs/webPackagePaths.js"></script>
	<script>
		Object.keys(self.webPackagePaths).map(function (key, index) {
			self.webPackagePaths[key] = `${window.location.origin}/node_modules/vscode-web/dist/node_modules/${key}/${self.webPackagePaths[key]}`;
		});
		require.config({
			baseUrl: `${window.location.origin}/node_modules/@theia/web/dist/out`,
			recordStats: true,
			trustedTypesPolicy: window.trustedTypes?.createPolicy('amdLoader', {
				createScriptURL(value) {
					return value;
				}
			}),
			paths: self.webPackagePaths
		});
	</script>
	<script src="./node_modules/@theia/web/dist/out/vs/workbench/workbench.web.main.nls.js"></script>
	<script src="./node_modules/@theia/web/dist/out/vs/workbench/workbench.web.main.js"></script>
	<script src="./node_modules/@theia/web/dist/out/vs/code/browser/workbench/workbench.js"></script>
</html>
```


in this case playground web as default 
// TODO: Needs upgrade refactoring to @theia/web/playground-extension
editor-implementation-extension see: https://github.com/unlicense-code/vscode-playground
myExt/
```js
{
    "name": "vscode-web-playground",
    "description": "Web playground for VS Code",
    "version": "0.0.13",
    "publisher": "vscode",
    "license": "MIT",
    "enabledApiProposals": ["fileSearchProvider", "textSearchProvider"],
    "private": true,
    "activationEvents": ["onFileSystem:memfs", "onDebug"],
    "browser": "./extension",
    "engines": {
      "vscode": "^1.48.0"
    },
    "contributes": {
      "viewsWelcome": [
        {
          "view": "debug",
          "contents": "In order to run and debug you'll need to create a local workspace."
        },
        {
          "view": "terminal",
          "contents": "In order to run and debug you'll need to create a local workspace."
        }
      ],
      "taskDefinitions": [
        {
          "type": "custombuildscript",
          "required": ["flavor"],
          "properties": {
            "flavor": {
              "type": "string",
              "description": "The build flavor. Should be either '32' or '64'."
            },
            "flags": {
              "type": "array",
              "description": "Additional build flags."
            }
          }
        }
      ]
    },
    "scripts": {
      "compile": "yarn webpack-cli --config extension.webpack.config --mode production",
      "watch": "yarn webpack-cli --config extension.webpack.config --mode production --watch --info-verbosity verbose",
      "prepublish": "yarn webpack-cli --config extension.webpack.config --mode production"
    },
    "devDependencies": {
      "@types/vscode": "^1.48.0",
      "ts-loader": "^4.4.2",
      "typescript": "^3.9.7",
      "webpack": "^4.43.0",
      "webpack-cli": "^3.3.12"
    }
  }
```
