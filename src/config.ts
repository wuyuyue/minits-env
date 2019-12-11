export const win10ToolBoxUrl = 'http://mirrors.aliyun.com/docker-toolbox/windows/docker-toolbox/DockerToolbox-18.03.0-ce.exe' //https://github.com/docker/toolbox/releases/download/v19.03.1/DockerToolbox-19.03.1.exe
// export const win10Boot2DockerIsoUrl = 'https://github.com/boot2docker/boot2docker/releases/download/v19.03.5/boot2docker.iso'
// export const win10ToolBoxInitPath = 'C:\\Program Files\\Docker Toolbox\\start.sh'
export const linuxDockerInstallShellUrl = 'https://raw.githubusercontent.com/rancher/install-docker/master/19.03.4.sh'
export const dockerImage = 'linyonghui/coto'

import * as os from 'os'
export const LOCAL_CACHE_DIR = os.homedir() + '/.docker-cache';
