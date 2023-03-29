## theia-web 
The Theia Web Package contains npm install theia-web and that contains theia-web/server and serviceWorker

this also superseeds theia extensions

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
