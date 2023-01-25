#! /usr/bin/bash

cd packages

echo "What do you want to call the new package?"
read packageName
echo "What should the description of the package be?"
read description

mkdir "$packageName"
cd "$packageName"

# set up source
mkdir src && echo '// Entry point of the project' > src/index.ts
mkdir src/typings

# set up tests
mkdir tests && echo '// Main tests here' > tests/index.ts

# ignore files
echo $'node_modules/\n.DS_Store\ndist/' > .gitignore
echo $'tests/\nsrc/\ndocs/\n.gitignore\ntsconfig.json' > .npmignore

# npm files
echo "{
    \"name\": \"@shochu/$packageName\",
    \"version\": \"0.0.1\",
    \"description\": \"$description\",
    \"author\": \"DidaS\",
    \"license\": \"MIT\",
    \"main\": \"dist/index.js\",
    \"types\": \"dist\",
    \"scripts\": {
        \"dev\": \"ts-node src/index.ts\",
        \"lint\": \"eslint\",
        \"build\": \"rm -rf dist && tsc\",
        \"test\": \"ts-node tests/index.ts\",
        \"docs\": \"rm -rf docs && typedoc && typedoc --plugin typedoc-plugin-coverage --plugin typedoc-plugin-markdown\",
        \"start\": \"node .\"
    },
    \"repository\": {
        \"type\": \"git\",
        \"url\": \"https://github.com/Didas-git/Shochu.git\"
    },
    \"homepage\": \"https://github.com/Didas-git/Shochu/tree/main/packages/$packageName\"
}" > package.json

# typescript shenanigans
echo '{
    "extends": "../../tsconfig.json",
    "include": [
        "src/**/*"
    ]
}' > tsconfig.json

pnpm i tslib

cd ../..

pnpm i