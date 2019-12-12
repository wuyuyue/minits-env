import * as os from 'os'
import * as childProcess from 'child_process'
import * as  fse from 'fs-extra'
import * as path from 'path'
const createDownloadTask = require('./download')

import {win10ToolBoxUrl,dockerImage,LOCAL_CACHE_DIR} from '../config'


function ensureDirSync(dir) {
  try {
    fse.accessSync(dir);
  } catch (e) {
    fse.mkdirSync(dir);
  }
}

ensureDirSync(LOCAL_CACHE_DIR);
export const checkDocker=():boolean=>{
  try{
    var result = childProcess.spawnSync('docker', ['--version'],{encoding: 'utf-8'});
    return !result.error && !result.stderr
  }catch(e) {
    console.error(e,'\n')
    return false
  }
  
}

export const installDocker = async ():Promise<void>=>{
  if(checkDocker()) return 
  return new Promise((resolve,reject)=>{
    try {
      const type = os.type().toLowerCase()
      if (type === 'windows_nt') {
        console.info('start install docker-toolbox\n')
        const zipFilename = 'toolbox.exe'
        const tmpdir = LOCAL_CACHE_DIR;
          createDownloadTask({
            url: win10ToolBoxUrl,
            // md5: "c8c3085051e21d57e13d6544b7bbb832",
            filename: zipFilename,
            tmpdir
          }).then(function(task) {
            task.emit("start");
            task
              .on("totalSize", function({ totalSize }) {
                console.log("get total size", totalSize,'\n');
              })
              .on("progress", function({ percent }) {
                console.log("on progress", percent,'\n');
              })
              .on("end", function({ filepath }) {
                console.log("on end", filepath,'\n');
                try{
                  var env = Object.assign({}, process.env);
                  var SEPARATOR = process.platform === 'win32' ? ';' : ':';
                  // env.Path = path.resolve('C:/Program Files/Git/bin') + SEPARATOR + env.Path
                  // "C:\Program Files\Git\bin\bash.exe" --login -i "C:\Program Files\Docker Toolbox\start.sh"
                  env.Path = path.resolve('C:/Program Files/Docker Toolbox') + SEPARATOR + env.Path
                  childProcess.execFileSync('docker-start.cmd',{cwd: path.resolve('C:/Program Files/Docker Toolbox'),encoding: 'utf-8',stdio: 'inherit',env})
                }catch(e){
                  console.error(e,'\n')
                }
                resolve()
              })
              .on("error", function(err) {
                console.log("on error", err,'\n');
                reject()
                process.exit(-1)
                // clearInterval(st);
              })
              .on("abort", function() {
                console.log("on abort\n");
                reject()
                process.exit(-1)
              });
          });
      


      } else if (type === 'linux') {
        childProcess.spawnSync('sh', [path.join(__dirname,'../../scripts/linux-19.03.4.sh')],{encoding: 'utf-8',stdio: 'inherit'})
        childProcess.spawnSync('sh', [path.join(__dirname,'../../scripts/linux-sudo.sh')],{encoding: 'utf-8',stdio: 'inherit'})
        resolve()
      } else if (type === 'darwin') {
        childProcess.spawnSync('brew', ['tap'],{encoding: 'utf-8',stdio: 'inherit'})
        childProcess.spawnSync('brew', ['install','docker'],{encoding: 'utf-8',stdio: 'inherit'})
        childProcess.spawnSync('brew', ['install','docker-machine'],{encoding: 'utf-8',stdio: 'inherit'})
        childProcess.spawnSync('brew', ['cask','install','virtualbox'],{encoding: 'utf-8',stdio: 'inherit'})
        childProcess.spawnSync('docker-machine', ['create','--driver','virtualbox','default'],{encoding: 'utf-8',stdio: 'inherit'})
        childProcess.spawnSync('docker-machine', ['env','default'],{encoding: 'utf-8',stdio: 'inherit'})
        childProcess.spawnSync('eval', ['$(docker-machine env default)'],{encoding: 'utf-8',stdio: 'inherit'})
        resolve()
      } else {
        console.info('not supported OS\n')
        reject()
      }
    }catch(e){
      console.error(e,'\n')
      console.error('encountered unknown error, please install the docker yourself\n')
      reject()
      process.exit(-1)
    }
  })
}

export const checkDockerImage = (): boolean=>{
  try{
    var result = childProcess.spawnSync('docker', ['images'],{encoding: 'utf-8'});
    if(result && !result.error && result.output && result.output.toString() && result.output.toString().indexOf(dockerImage)>-1){
      return true
    }
    return false
  }catch(e) {
    console.error(e,'\n')
    process.exit(-1)
    return false
  }
}

export const installDockerImage =():void=>{
  if(!checkDocker()) return 
  try {
    childProcess.spawnSync('docker', [`pull`, dockerImage],{encoding: 'utf-8',stdio: 'inherit'})
  }catch(e) {
    console.error(e,'\n')
    process.exit(-1)
  }
  
}