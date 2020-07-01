import consola from 'consola'
import { Nuxt, requireMaybeEdge } from './utils/nuxt'

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

      const nuxt: Nuxt = await cmd.getNuxt(config)

      if (!isFullStatic) {
        nuxt.options._export = true
      } else {
        nuxt.options._legacyGenerate = true
      }

      // TODO: Check if build is required
      const builder = await cmd.getBuilder(nuxt)
      await builder.build()
      // TODO: Persist build status (dependencies, target, ssr)

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
    }
  })
}

main().catch((err) => {
  consola.error(err)
  process.exit(1)
})
