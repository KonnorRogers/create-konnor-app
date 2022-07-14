import * as path from "path";
import resolve from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import { terser } from "rollup-plugin-terser";
import { brotliCompressSync } from "zlib";
import gzipPlugin from "rollup-plugin-gzip";
import glob from "glob"

let entries = {}
glob
  .sync("src/**/*.{ts,js}")
  .forEach((file) => {
    const key = path.join(path.dirname(file), path.basename(file, path.extname(file)))
    entries[key] = file
  });

const input = "src/index.<%= typescript ? 'ts' : 'js' %>"

export default [
  {
    input,
    plugins: [compressionPlugins()],
    output: [
      {
        file: "dist/bundle/<%= projectName %>.umd.js",
        format: "umd",
        name: "<%= projectName %>",
        esModule: false,
      },
      {
        file: "dist/bundle/<%= projectName %>.module.js",
        format: "es",
      }
    ]
  },
  {
    input: entries,
    plugins: basePlugins(),
    output: [
      {
        dir: "dist",
        format: "es",
      },
    ],
  },
];

function basePlugins(tsconfig = "./tsconfig.json") {
  return [
    resolve(),
    <% if (typescript) { %>
    typescript({ tsconfig })
    <% } else { %>
    // typescript({ tsconfig })
    <% } %>
  ];
}

function compressionPlugins(tsconfig = "./tsconfig.json") {
  return [
    ...basePlugins(tsconfig),
    terser({
      compress: {
        passes: 10,
      },
    }),
    // GZIP compression as .gz files
    gzipPlugin(),
    // Brotil compression as .br files
    gzipPlugin({
      customCompression: (content) => brotliCompressSync(Buffer.from(content)),
      fileName: ".br",
    }),
  ];
}
