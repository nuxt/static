import fs from 'fs'
import path from 'path'
import _consola from 'consola'
import destr from 'destr'
import { SnapshotOptions, snapshot, compareSnapshots } from './snapshot'
import { Nuxt, requireMaybeEdge } from './utils/nuxt'

const logger = _consola.withTag('nuxt-static')

async function main () {
  const { NuxtCommand } = requireMaybeEdge('@nuxt/cli')

  await NuxtCommand.run({
    name: 'static',
    description: '',
    usage: 'static <dir>',
    options: {},
    async run (cmd) {
      const config = await cmd.getNuxtConfig({ dev: false, _build: true })
      const isFullStatic = config.target === 'static'
      if (!isFullStatic) {
        config._export = true
      } else {
        config._legacyGenerate = true
      }
      const nuxt: Nuxt = await cmd.getNuxt(config)
      await this.ensureBuild({ cmd, nuxt })
      await this.generate({ cmd, isFullStatic, nuxt })
      await nuxt.close()
    },

    async generate ({ cmd, isFullStatic, nuxt }) {
      const generator = await cmd.getGenerator(nuxt)

      generator.isFullStatic = isFullStatic

      generator.initiate = async () => {
        await nuxt.callHook('generate:before', generator, generator.options.generate)
        await nuxt.callHook('export:before', generator)
        await generator.initDist()
      }

      await nuxt.server.listen(0)
      await generator.generate()
    },

    async ensureBuild ({ cmd, nuxt }) {
      // Take a snapshot of current project
      const snapshotOptions: SnapshotOptions = {
        rootDir: nuxt.options.rootDir,
        patterns: [
          'nuxt.config.js',
          'nuxt.config.ts',
          'pages'
        ],
        globbyOptions: {
          gitignore: true,
          ignore: [
            nuxt.options.dir.static,
            nuxt.options.generate.dir,
            'content', // TODO: Ignore by content module itself
            '.**/*',
            '.*'
          ]
        }
      }
      const currentBuildSnapshot = await snapshot(snapshotOptions)

      // Current build meta
      const currentBuild = {
        nuxtVersion: nuxt.constructor.version,
        ssr: nuxt.options.ssr,
        target: nuxt.options.target,
        snapshot: currentBuildSnapshot
      }

      // Check if build can be skipped
      const nuxtBuildFile = path.resolve(nuxt.options.buildDir, 'build.json')
      if (fs.existsSync(nuxtBuildFile)) {
        const previousBuild: typeof currentBuild = destr(fs.readFileSync(nuxtBuildFile, 'utf-8')) || {}

        // Quick diff
        const needBuild = false
        for (const field of ['nuxtVersion', 'ssr', 'target']) {
          if (previousBuild[field] !== currentBuild[field]) {
            logger.info(`Doing webpack rebuild because ${field} changed`)
            break
          }
        }

        // Full snapshot diff
        if (!needBuild) {
          const changed = compareSnapshots(previousBuild.snapshot, currentBuild.snapshot)
          if (!changed) {
            logger.success('Skipping webpack build as no changes detected')
            return
          } else {
            logger.info(`Doing webpack rebuild because ${typeof changed === 'string' ? changed : 'some file(s)'} modified`)
          }
        }
      }

      // Webpack build
      const builder = await cmd.getBuilder(nuxt)
      await builder.build()

      // Write build.json
      fs.writeFileSync(nuxtBuildFile, JSON.stringify(currentBuild, null, 2), 'utf-8')
    }
  })
}

main().catch((err) => {
  logger.error(err)
  process.exit(1)
})
