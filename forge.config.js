const config = {
  packagerConfig: {
    extraResources:['./lib/**', './flowscript/**','./userData/**','./doc/**','./logs/**','./ref_**/**']
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {},
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
    },
    {
      name: '@electron-forge/maker-deb',
      config: {},
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {},
    },
  ],
};

module.exports = config
