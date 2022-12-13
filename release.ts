import fs from 'node:fs'
import { exec, execSync } from 'node:child_process'

const pkg = JSON.parse(fs.readFileSync('./package.json', { encoding: 'utf-8' })) as { version: string }

const releaseVersion = 'v' + pkg.version

execSync(`git ac "Release ${ releaseVersion }"`)

execSync(`git tag ${ releaseVersion }`)

exec('git push')
exec('git push --tags')
