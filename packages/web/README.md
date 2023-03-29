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
