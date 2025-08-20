export PATH := "./node_modules/.bin:" + env_var('PATH')

dev:
  vite dev --port 4647

build:
  vite build

deploy target: build
  rsync -av --delete --progress build .npmrc package.json package-lock.json {{target}}:~/nstart/
  ssh {{target}} 'cd nstart; nvm use; npm ci --omit dev'
  ssh {{target}} 'systemctl restart nstart'

npm-publish:
  npm login
  cd modal-package && npm publish

bump what:
  npm version --git-tag-version false {{what}}

sync-package:
  nstart_version=`jq -r .version package.json` && \
  jq ".version = \"$nstart_version\"" modal-package/package.json > modal-package/package.tmp.json && \
  mv modal-package/package.tmp.json modal-package/package.json && \
  echo "Updated modal-package version to $nstart_version"

git-tag:
  nstart_version=`jq -r .version package.json` && \
  git tag "v$nstart_version" && \
  git push --tags
