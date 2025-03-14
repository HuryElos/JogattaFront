module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Se você já usa reanimated/plugin, mantenha
      'react-native-reanimated/plugin',

      // (Nada de 'react-native-material-symbols/babel' aqui,
      //  pois o plugin não está publicado)
    ],
  };
};
