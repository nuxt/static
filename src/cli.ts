import fs from 'fs'
import path from 'path'
import _consola from 'consola'
import destr from 'destr'
import defu from 'defu'
import { SnapshotOptions, snapshot, compareSnapshots } from './utils/snapshot'
import { Nuxt, requireMaybeEdge } from './utils/nuxt'

const logger = _consola.withTag('nuxt-static')

async function main () {
  const { NuxtCommand, setup } = requireMaybeEdge('@nuxt/cli')

  // In case we run nuxt-static command directly
  setup({ dev: false })

  await NuxtCommand.run({
    name: 'static',
    description: '',
    usage: 'static <dir>',
    options: {},

    async run (cmd) {
      async function getNuxt (flags): Promise<Nuxt> {
        const config = await cmd.getNuxtConfig({ dev: false, ...flags })
        const isFullStatic = config.target === 'static'
        if (isFullStatic) {
          config._export = true
        } else {
          config._legacyGenerate = true
        }
        const cacheDir = (config.static && config.static.cacheDir) || path.resolve(config.rootDir, 'node_modules/.cache/nuxt')
        config.buildDir = cacheDir
        const nuxt = await cmd.getNuxt(config)
        return nuxt
      }

      await this.ensureBuild({ cmd, getNuxt })
      await this.generate({ cmd, getNuxt })
    },

    async generate ({ cmd, isFullStatic, getNuxt }) {
      const nuxt: Nuxt = await getNuxt({ server: true })
      const generator = await cmd.getGenerator(nuxt)

      generator.isFullStatic = isFullStatic

      generator.initiate = async () => {
        await nuxt.callHook('generate:before', generator, generator.options.generate)
        await nuxt.callHook('export:before', generator)
        await generator.initDist()
      }

      await nuxt.server.listen(0)
      await generator.generate()
      await nuxt.close()
    },

    async ensureBuild ({ cmd, getNuxt }) {
      const nuxt: Nuxt = await getNuxt({ _build: true, server: false })

      const staticOptions = defu(nuxt.options.static, {
        ignore: [
          nuxt.options.buildDir,
          nuxt.options.dir.static,
          nuxt.options.generate.dir,
          'node_modules',
          'content', // TODO: Ignore by content module itself
          '.**/*',
          '.*',
          'README.md'
        ],
        globbyOptions: {
          gitignore: true
        }
      })

      // Take a snapshot of current project
      const snapshotOptions: SnapshotOptions = {
        rootDir: nuxt.options.rootDir,
        ignore: staticOptions.ignore,
        globbyOptions: staticOptions.globbyOptions
      }
      const currentBuildSnapshot = await snapshot(snapshotOptions)

      // Current build meta
      const currentBuild = {
        // @ts-ignore
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
            logger.info(`Doing webpack rebuild because ${changed} modified`)
          }
        }
      }

      // Webpack build
      const builder = await cmd.getBuilder(nuxt)
      await builder.build()

      // Write build.json
      fs.writeFileSync(nuxtBuildFile, JSON.stringify(currentBuild, null, 2), 'utf-8')

      await nuxt.close()
    }
  })
}

main().catch((err) => {
  logger.error(err)
  process.exit(1)
})
