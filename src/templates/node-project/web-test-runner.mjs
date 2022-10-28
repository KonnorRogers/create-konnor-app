import { playwrightLauncher } from '@web/test-runner-playwright'
import { esbuildPlugin } from '@web/dev-server-esbuild'

export default ({
  files: './**/*.test.{ts,js}',
  browsers: [
    playwrightLauncher({ product: 'chromium' }),
    playwrightLauncher({ product: 'webkit' })
  ],
  nodeResolve: true,
  rootDir: '.',

  plugins: [
    <% if (typescript) { %>
    esbuildPlugin({ ts: true })
    <% } else { %>
    esbuildPlugin()
    <% } %>
  ]
})
