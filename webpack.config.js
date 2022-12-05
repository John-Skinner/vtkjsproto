const HTMLWebpackPlugin = require('html-webpack-plugin')
chunkName = 'vendor';

const path=require('path');
var webpack = require('webpack');
const bundleAnalysis='json'; // or 'server'
var vtkRules = require('@kitware/vtk.js/Utilities/config/dependency.js').webpack;
module.exports = {
    devServer: {
        static: {
            directory:path.join(__dirname,'dist')
        },
        port:9000,
    },

    stats: {

        modules:true
    },

    watchOptions: {
        ignored:/node_modules/
    },
    mode:'development',
    module: {
        rules: vtkRules.core.rules,
    },
    plugins: [new HTMLWebpackPlugin({template:'./dist/index.html'})],
    output: {
        path:path.resolve(__dirname,'dist'),
        filename: "vizBundle.js",
        libraryTarget: "var",
        library:'className',
        publicPath:""
    },
    entry: './src/main.js',
    devtool:'inline-source-map'
};
module.exports.module.rules.push({
    test: /\.tsx?$/,
    use: 'ts-loader',
    include: [
        path.resolve(__dirname, ".")
    ]
});
module.exports.resolve= {
    extensions: ['.tsx','.ts','.js']
}
//console.log(" static dirs:" + module.exports.devServer.static[1].directory);
