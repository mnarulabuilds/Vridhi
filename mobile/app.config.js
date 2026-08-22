module.exports = ({ config }) => {
  const production = process.env.EAS_BUILD_PROFILE === 'production';
  const allowCleartext = !production;

  const plugins = (config.plugins || []).map((plugin) => {
    if (Array.isArray(plugin) && plugin[0] === 'expo-build-properties') {
      const opts = plugin[1] || {};
      return [
        'expo-build-properties',
        {
          ...opts,
          android: {
            ...(opts.android || {}),
            usesCleartextTraffic: allowCleartext,
          },
        },
      ];
    }
    return plugin;
  });

  return {
    ...config,
    android: {
      ...config.android,
      usesCleartextTraffic: allowCleartext,
    },
    plugins,
  };
};
