const { defineConfig } = require('@vue/cli-service')
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin')

module.exports = defineConfig({
  transpileDependencies: true,
  chainWebpack: (config) => {
    if (config.optimization.minimizers.has('css')) {
      config.optimization.minimizers.delete('css')
    }
    config.optimization
      .minimizer('css')
      .use(CssMinimizerPlugin, [
        {
          minimizerOptions: {
            preset: ['default', { discardDuplicates: false }],
          },
        },
      ])
  },
})
