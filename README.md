# github-package-reference

doc: https://docs.github.com/en/packages/quickstart

Publish npm package with Github Actions, Typescript, and Vite.

## Setup Github Packages

Configure Github Actions to authenticate and publish to Github Packages using `GITHUB_TOKEN` built-in environment secret.
Publish is triggered when there is a new release + tag.
Requires package version increment.
Github Package's registry is located at https://npm.pkg.github.com

`.github/workflows/release-package.yml`:

```yml
name: Node.js Package

on:
  release:
    types: [created]

jobs:
  ...
  publish-gpr:
    ...
    permissions:
      packages: write
      contents: read
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          registry-url: https://npm.pkg.github.com/
      - run: npm ci
      - run: npm run build
      - run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{secrets.GITHUB_TOKEN}}


```

Configure `package.json` and `vite` to define build entry and output points.
Package will be importable from `@vpvnguyen/github-package-reference` - name of `package.json`.
Define npm registry scope: `@vpvnguyen`

```zsh
npm install @vpvnguyen/github-package-reference
```

```js
import hello from "@vpvnguyen/github-package-reference";
```

`package.json`:

```json
{
  "name": "@vpvnguyen/github-package-reference",
  "version": "1.0.7",
  "source": "src/index.ts",
  "main": "dist/index.cjs.js",
  "module": "dist/index.es.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.es.js",
      "require": "./dist/index.cjs.js"
    }
  },
  "publishConfig": {
    "@vpvnguyen:registry": "https://npm.pkg.github.com"
  }
}
```

## Changesets

doc: https://www.christopherbiscardi.com/post/shipping-multipackage-repos-with-github-actions-changesets-and-lerna

Setup changesets cli

```zsh
npm install @changesets/cli --save-dev
npx changeset init
```

Should auto-generate `.changesets/config.json` and `.changesets/README.md`

`.changesets/config.json` should look like:

```json
{
  "$schema": "https://unpkg.com/@changesets/config@3.1.1/schema.json",
  "changelog": "@changesets/cli/changelog",
  "commit": false,
  "fixed": [],
  "linked": [],
  "access": "restricted",
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "ignore": []
}
```

To bump version, run:

```zsh
npx changeset
```

```zsh
What kind of change is this for @vpvnguyen/github-package-reference? (current version is 1.0.7) …
❯ patch
  minor
  major
```

### App Versioning

doc: https://github.com/changesets/changesets/blob/main/docs/versioning-apps.md

Changesets can also be used to manage application versions with a `package.json`.

Minium `package.json` requirement:

````json
{
  "name": "my-project",
  "private": true,
  "version": "0.0.1"
}

By default changesets will only update the changelog and version:
```json
"privatePackages": {
  "version": true,
  "tag": false
}
````

To enable this feature set `.changesets/config.json`:

```json
"privatePackages": {
  "version": true,
  "tag": true
}
```

## Changeset + Github Actions

doc: https://github.com/changesets/action

Update workflow permissions for `GITHUB_TOKEN` if needed to read, write, create and approve pull requests
(Repo > Settings > Actions > General)

### Without Publishing

```yml
on:
  push:
    branches:
      - main
jobs:
  ...
  publish:
    ...
    steps:
      ...
      - name: Create Release Pull Request
        uses: changesets/action@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### With Publishing

By default the GitHub Action creates a `.npmrc`.
If a `.npmrc` file is found, the GitHub Action does not recreate the file.

```
//registry.npmjs.org/:_authToken=${process.env.NPM_TOKEN}

```

```yml
on:
  push:
    branches:
      - main

concurrency: ${{ github.workflow }}-${{ github.ref }}

jobs:
  release:
    name: Release
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Repo
        uses: actions/checkout@v3

      - name: Setup Node.js 20.x
        uses: actions/setup-node@v3
        with:
          node-version: 20.x

      - name: Install Dependencies
        run: yarn

      - name: Create Release Pull Request or Publish to npm
        id: changesets
        uses: changesets/action@v1
        with:
          # This expects you to have a script called release which does a build for your packages and calls changeset publish
          publish: yarn release
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}

      - name: Send a Slack notification if a publish happens
        if: steps.changesets.outputs.published == 'true'
        # You can do something when a publish happens.
        run: my-slack-bot send-notification --message "A new version of ${GITHUB_REPOSITORY} was published!"
```

Configure the `.npmrc` file if needed:

```yml
- name: Creating .npmrc with npm registry
  run: |
    cat << EOF > "$HOME/.npmrc"
      //registry.npmjs.org/:_authToken=$NPM_TOKEN
    EOF
  env:
    NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
```

## Changeset Config Options `.changeset/config.json`

| Option                           | Type                               | Description                                                                                                                                 |
| -------------------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **`changelog`**                  | `false` or `[string, object]`      | Plugin to generate changelogs. Common: `"@changesets/changelog-github"` with `{ "repo": "your-org/your-repo" }`. Set to `false` to disable. |
| **`commit`**                     | `boolean`                          | If `true`, Changesets will auto-commit version bumps/changelog changes (used in CI with GitHub Actions).                                    |
| **`linked`**                     | `string[][]`                       | Link packages so they’re always released with the same version. Useful in monorepos.                                                        |
| **`access`**                     | `"public"` or `"restricted"`       | Controls npm access level of packages (only affects `changeset publish`).                                                                   |
| **`baseBranch`**                 | `string`                           | Your default branch—usually `"main"` or `"master"`. Used by GitHub Actions.                                                                 |
| **`updateInternalDependencies`** | `"patch"`, `"minor"`, or `"major"` | How internal dependency bumps affect related packages.                                                                                      |
| **`ignore`**                     | `string[]`                         | List of packages that should be ignored for versioning/publishing.                                                                          |

## Changesets in Monorepos

Manage multiple packages in a `packages/` directory with:

- GitHub-style changelogs
- Auto-committing in CI (e.g., with GitHub Actions)
- Public package publishing (e.g., to npm)
- Dependency bumping for internal packages

### Example Monorepo

Directory structure:
.
├── packages/
│ ├── pkg-a/
│ ├── pkg-b/
├── .changeset/
│ └── config.json
├── package.json

#### Internal Dependencies

If `pkg-a` depends on `pkg-b`, setting `"updateInternalDependencies": "patch"` means that any version bump in `pkg-b` will result in a patch bump in `pkg-a`.

#### Linked Versions

If you want linked versioning (pkg-a`and`pkg-b` always release the same version), use:

```json
"linked": [["pkg-a", "pkg-b"]]
```

#### Ignoring Internal Tools

```json
"ignore": ["internal-cli", "storybook-config"]
```

Example `.changeset/config.json`:

```json
{
  "$schema": "https://unpkg.com/@changesets/config@2.3.0/schema.json",
  "changelog": [
    "@changesets/changelog-github",
    {
      "repo": "your-org/your-repo"
    }
  ],
  "commit": true,
  "linked": [],
  "access": "public",
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "ignore": []
}
```
