import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: [
    'src/node/index',
  ],
  clean: false,
  declaration: true,
  externals: [
    'vite',
    'execa',
  ],
  rollup: {
    emitCJS: true,
    inlineDependencies: true,
  },
})
