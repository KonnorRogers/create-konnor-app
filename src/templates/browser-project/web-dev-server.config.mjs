import { esbuildPlugin } from '@web/dev-server-esbuild'
export default ({
  rootDir: '.',
  nodeResolve: true,
  appIndex: 'examples/index.html',
  open: true,
  plugins: [
    <% if (typescript) { %>
      esbuildPlugin({ ts: true })
    <% } else {
      esbuildPlugin()
    <%  } %>
  ]
})
