import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: [
    'src/vite',
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
