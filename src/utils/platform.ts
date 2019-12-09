var os = require('os');

export const detectPlatform =():string=>{
  var type = os.type().toLowerCase();
  var arch = os.arch().toLowerCase();

  if (type === 'darwin') {
    return 'osx-64';
  }

  if (type === 'windows_nt') {
    return arch === 'x64' ? 'windows-64' : 'windows-32';
  }

  if (type === 'linux') {
    if (arch === 'arm' || arch === 'arm64') {
      return 'linux-armel';
    }
    return arch === 'x64' ? 'linux-64' : 'linux-32';
  }

  return null;
}
