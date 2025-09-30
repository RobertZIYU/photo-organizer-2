import type { Configuration } from 'webpack';

import { rules } from './webpack.rules';
import { plugins } from './webpack.plugins';

export const mainConfig: Configuration = {
  /**
   * This is the main entry point for your application, it's the first file
   * that runs in the main process.
   */
  entry: './src/index.ts',
  // Put your normal webpack config below here
  module: {
    rules,
  },
  plugins,
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.css', '.json'],
  },
  externals: {
    // Don't bundle electron or native modules
    'sharp': 'commonjs2 sharp',
    '@tensorflow/tfjs-node': 'commonjs2 @tensorflow/tfjs-node',
    '@tensorflow-models/mobilenet': 'commonjs2 @tensorflow-models/mobilenet',
    '@tensorflow-models/coco-ssd': 'commonjs2 @tensorflow-models/coco-ssd',
    'exifreader': 'commonjs2 exifreader',
  },
};
