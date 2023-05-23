const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const { ProgressPlugin, ProvidePlugin, DefinePlugin } = require('webpack')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const path = require('path')
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin')
const fs = require('fs')
const DotenvPlugin = require('dotenv-webpack')
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin')

const NODE_ENV = process.env.NODE_ENV || 'development'
const EXTENSION_NAME =
  NODE_ENV === 'development' ? '(DEV) Uniswap Wallet' : 'Uniswap Wallet'

const isDevelopment = NODE_ENV === 'development'
const appDirectory = path.resolve(__dirname)

// This is needed for webpack to compile JavaScript.
// Many OSS React Native packages are not compiled to ES5 before being
// published. If you depend on uncompiled packages they may cause webpack build
// errors. To fix this webpack can be configured to compile to the necessary
// `node_module`.
const babelLoaderConfiguration = {
  test: /\.js$/,
  // Add every directory that needs to be compiled by Babel during the build.
  include: [
    // path.resolve(appDirectory, "index.web.js"),
    // path.resolve(appDirectory, "src"),
    path.resolve(appDirectory, 'node_modules/react-native-uncompiled'),
  ],
  use: {
    loader: 'babel-loader',
    options: {
      cacheDirectory: true,
      // The 'metro-react-native-babel-preset' preset is recommended to match React Native's packager
      presets: ['module:metro-react-native-babel-preset'],
      // Re-write paths to import only the modules needed by the app
      plugins: ['react-native-web'],
    },
  },
}

const swcLoaderConfiguration = {
  test: ['.jsx', '.js', '.tsx', '.ts'].map((ext) => new RegExp(`${ext}$`)),
  exclude: /node_modules/,
  use: {
    loader: 'swc-loader',
    options: {
      // parseMap: true, // required when using with babel-loader
      env: {
        targets: require('./package.json').browserslist,
      },
      sourceMap: isDevelopment,
      jsc: {
        target: 'es2022',
        parser: {
          syntax: 'typescript',
          tsx: true,
          dynamicImport: true,
        },
        transform: {
          react: {
            development: isDevelopment,
            refresh: isDevelopment,
          },
        },
      },
    },
  },
}

const fileExtensions = [
  'eot',
  'gif',
  'jpeg',
  'jpg',
  'otf',
  'png',
  'ttf',
  'woff',
  'woff2',
  'mp4',
]

const {
  dir,
  plugins = [],
  ...extras
} = isDevelopment
  ? {
      dir: 'dev',
      devServer: {
        // watchFiles: ['src/**/*', 'webpack.config.js'],
        host: 'localhost',
        port: 9997,
        server: fs.existsSync('localhost.pem')
          ? {
              type: 'https',
              options: {
                key: 'localhost-key.pem',
                cert: 'localhost.pem',
              },
            }
          : {},
        compress: false,
        static: {
          directory: path.join(__dirname, '../dev'),
        },
        client: {
          // logging: "info",
          progress: true,
          reconnect: false,
          overlay: {
            errors: true,
            warnings: false,
          },
        },
        devMiddleware: {
          writeToDisk: true,
        },
      },
      devtool: 'cheap-module-source-map',
      plugins: [
        new ForkTsCheckerWebpackPlugin(),
        new ReactRefreshWebpackPlugin(),
      ],
    }
  : {
      dir: 'build',
      plugins: [new ForkTsCheckerWebpackPlugin()],
    }

const options = {
  mode: NODE_ENV,
  entry: {
    background: './src/background/index.ts',
    index: './src/index.tsx',
    injected: './src/contentScript/injected.ts',
    ethereum: './src/contentScript/ethereum.js',
  },
  output: {
    filename: '[name].js',
    chunkFilename: '[name].js',
    path: path.resolve(__dirname, dir),
    clean: true,
    publicPath: '',
  },
  // https://webpack.js.org/configuration/other-options/#level
  infrastructureLogging: { level: 'warn' },
  module: {
    rules: [
      {
        test: /\.m?js$/,
        resolve: {
          fullySpecified: false, // disable the behaviour
        },
      },
      {
        test: /\.css$/,
        use: [
          {
            loader: 'style-loader',
          },
          {
            loader: 'css-loader',
          },
        ],
      },
      {
        type: 'javascript/auto',
        test: /\.json$/,
        use: ['file-loader'],
        include: /tokenlist/,
      },
      // Used for creating SVG React components (similar to react=native-svg-transformer on mobile)
      {
        test: /\.svg$/,
        use: ['@svgr/webpack'],
      },
      {
        test: new RegExp('.(' + fileExtensions.join('|') + ')$'),
        type: 'asset/resource',
      },
      babelLoaderConfiguration,
      swcLoaderConfiguration,
      // tamaguiLoaderConfiguration, // NOTE(peter) turned off for now bc it's not working with our webpack conifg. it's just an optimization compiler that we can configure later once i figure it out
    ],
  },
  resolve: {
    alias: {
      'react-native$': 'react-native-web',
      'react-native-vector-icons$': 'react-native-vector-icons/dist',
      'src': path.resolve(__dirname, 'src') // absolute imports in apps/web
    },
    // Add support for web-based extensions so we can share code between mobile/extension
    extensions: [
      '.web.js',
      '.web.jsx',
      '.web.ts',
      '.web.tsx',
      ...fileExtensions.map((e) => `.${e}`),
      ...['.js', '.jsx', '.ts', '.tsx', '.css'],
    ],
    fallback: {
      fs: false,
    },
  },
  plugins: [
    new DotenvPlugin({
      path: '../../.env',
      defaults: true,
    }),
    new DefinePlugin({
      '__DEV__': NODE_ENV === 'development' ? 'true' : 'false',
      'process.env.IS_STATIC': '""',
      'process.env.NODE_ENV': JSON.stringify(NODE_ENV),
      'process.env.TAMAGUI_TARGET': JSON.stringify('web'),
      'process.env.DEBUG': JSON.stringify(process.env.DEBUG || '0'),
    }),
    new CleanWebpackPlugin(),
    new NodePolyfillPlugin(), // necessary to compile with reactnative-dotenv
    ...plugins,
    new MiniCssExtractPlugin(),
    new ProgressPlugin(),
    new ProvidePlugin({
      process: 'process/browser',
      React: 'react',
      Buffer: ['buffer', 'Buffer'],
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: 'src/manifest.json',
          force: true,
          transform(content, path) {
            return Buffer.from(
              JSON.stringify(
                {
                  description: process.env.npm_package_description,
                  version: process.env.npm_package_version,
                  name: EXTENSION_NAME,
                  ...JSON.parse(content.toString()),
                },
                null,
                2
              )
            )
          },
        },
        {
          from: 'src/assets/*.{html,png,svg}',
          to: 'assets/[name][ext]',
          force: true,
        },
        {
          from: 'src/*.{html,png,svg}',
          to: '[name][ext]',
          force: true,
        },
      ],
    }),
  ],
  ...extras,
}

module.exports = options
