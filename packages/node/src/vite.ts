import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { normalizePath } from 'vite'
import type { PluginOption, ResolvedConfig, ViteDevServer } from 'vite'
// import sirv from 'sirv'
import { PLUGIN_NAME, createRPCServer } from '@vite-plugin-clt-terminal/core'

// import { DIR_CLIENT } from './dir'

import {
  execScript as _execScript,
} from './features'

function getTerminalPath() {
  const pluginPath = normalizePath(path.dirname(fileURLToPath(import.meta.url)))
  return pluginPath.replace(/\/dist$/, '/\/src')
}

export interface VitePluginClientTerminalOptions {
  appendTo?: string | RegExp
}

export default function VitePluginClientTerminal(options: VitePluginClientTerminalOptions = { }): PluginOption {
  const terminalPath = getTerminalPath()
 
  let config: ResolvedConfig

  function configureServer(server: ViteDevServer) {
    // const base = (server.config.base) || '/'
    // server.middlewares.use(`${base}__terminal_`, sirv(DIR_CLIENT, {
    //   single: true,
    //   dev: true,
    // }))

    const rpc = createRPCServer<RPCFunctions>(server.ws, {
      root: () => config.root,
      execScript: (packages: string[], options: ExecNpmScriptOptions = {}) => _execScript(packages, {
        ...options,
        type: 'install',
        cwd: config.root,
        callback: (type: string, data: string) => {
          if (type === 'data')
            rpc.onTerminalData({ data })

          else if (type === 'exit')
            rpc.onTerminalExit({ data })
        },
      }),
    })
  }
  const plugin = <PluginOption>{
    name: PLUGIN_NAME,
    enforce: 'pre',
    apply: 'serve',
    configResolved(resolvedConfig) {
      config = resolvedConfig
    },
    configureServer(server) {
      configureServer(server)
    },
    async resolveId(importee: string) {
      if (importee.startsWith('virtual:vue-devtools-options')) {
        return importee
      }
      else if (importee.startsWith('virtual:vue-devtools-path:')) {
        const resolved = importee.replace('virtual:vue-devtools-path:', `${terminalPath}/`)
        return resolved
      }
    },
    async load(id) {
      if (id === 'virtual:vue-devtools-options')
        return `export default ${JSON.stringify({ base: config.base })}`
    },
    transform(code, id) {
      const { appendTo } = options

      if (!appendTo)
        return

      const [filename] = id.split('?', 2)
      if ((typeof appendTo === 'string' && filename.endsWith(appendTo))
        || (appendTo instanceof RegExp && appendTo.test(filename)))
        return { code: `${code}\nimport 'virtual:vue-devtools-path:app.js'` }
    },
    transformIndexHtml(html) {
      if (options.appendTo)
        return

      return {
        html,
        tags: [
          {
            tag: 'script',
            injectTo: 'head',
            attrs: {
              type: 'module',
              src: '/@id/virtual:vue-devtools-path:app.js',
            },
          },
        ],
      }
    },
    async buildEnd() {
    },
  }

  return [
    plugin,
  ]
}
