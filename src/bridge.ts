import * as childProcess from 'child_process'
import {dockerImage} from './config'
import * as path from 'path'
import * as os from 'os'

const getContainerId = ():string=>{
  let conainerID = ""
  var searchResult = childProcess.spawnSync('docker', ['ps',"--format","{{.ID}}:{{.Image}}"],{encoding: 'utf-8'});
  if(searchResult.output){
    searchResult.output.forEach((r:string)=>{
      if(r && r.indexOf(dockerImage)>-1){
        conainerID = r.split(":")[0]
        return conainerID
      }
    })
  }
  return conainerID
}

const mapPrefix = "/share"
const mapPath = (path)=>{
  let result = path
  const type = os.type().toLowerCase()
  if (type === 'windows_nt') {
    result = result.replace(/^([a-z|A-Z]):/g,'').replace(/\\/g,'/')
  }
  return mapPrefix + result
}

const wslPath = (path)=>{
  let result = path
  const type = os.type().toLowerCase()
  if (type === 'windows_nt') {
    result = result.replace(/^([a-z|A-Z]):/g,(_all,first)=>{
      return '\\'+first.toLowerCase()
    })
  }
  return result.replace(/\\/g,'/')
}

const conainerID = 'minits'
export const build = (args, opts)=>{
  
  var source = args;
  var dest = opts.output
  var sourceFull = path.resolve(source)
  var destFull = path.resolve(dest)
  const originPrefix = path.resolve(path.parse(sourceFull).root)
  const vCommand = `${wslPath(originPrefix)}:${mapPrefix}`
  // console.info(vCommand)
  let otherArgs = ['-o',`${mapPath(destFull)}`]
  if(opts.show){
    otherArgs.push('-s')
  }
  // if(opts.triple){
  //   var triple = opts.triple
  //   var tripleFull = path.resolve(triple)
  //   otherArgs.push('-t')
  //   otherArgs.push(`${mapPath(tripleFull)}`)
  // }
  try{
      childProcess.spawnSync('docker', ['run','-itd','-v', vCommand,'--name', conainerID, dockerImage, '/bin/bash'],{encoding: 'utf-8'});
      // update minits
      // try{
      //   childProcess.spawnSync('docker', ['exec',conainerID, 'bash','-c','cd /usr/lib/minits;git pull;npm install yarn -g;yarn;rm -f -r build;yarn build'],{encoding: 'utf-8'});
      // }catch(e){
      //   console.error(e)
      // }finally{
        childProcess.spawnSync('docker', ['exec',conainerID, 'node','/usr/lib/minits/build/main/index.js','build', `${mapPath(sourceFull)}`].concat(otherArgs),{encoding: 'utf-8',stdio: 'inherit',env:process.env});
      // }

    }catch(err){
    console.error(err)
    process.exit(-1)
  }
}

export const run = (args, opts)=>{
  var source = args;
  var sourceFull = path.resolve(source)
  const originPrefix = path.resolve(path.parse(sourceFull).root)
  const vCommand = `${wslPath(originPrefix)}:${mapPrefix}`
  let otherArgs = []
  if(opts.triple){
    // otherArgs.push('-t')
  }
  try{
      childProcess.spawnSync('docker', ['run','-itd','-v', vCommand,'--name', conainerID, dockerImage, '/bin/bash'],{encoding: 'utf-8'});
      childProcess.spawnSync('docker', ['exec',conainerID, 'node','/usr/lib/minits/build/main/index.js','run',`${mapPath(sourceFull)}`].concat(otherArgs),{encoding: 'utf-8',stdio: 'inherit',env:process.env});
    }catch(err){
    console.error(err)
    process.exit(-1)
  }
}

export const riscv = (args, opts)=>{
  var source = args;
  var sourceFull = path.resolve(source)

  const originPrefix = path.resolve(path.parse(sourceFull).root)
  const vCommand = `${wslPath(originPrefix)}:${mapPrefix}`
  const dest = opts.output
  const destFull = path.resolve(dest)
  try{
      childProcess.spawnSync('docker', ['run','-itd','-v', vCommand,'--name', conainerID, dockerImage, '/bin/bash'],{encoding: 'utf-8'});
      childProcess.spawnSync('docker', ['exec',conainerID, 'bash','/tmp/ts-to-riscv.sh',`${mapPath(sourceFull)}`,`${mapPath(destFull)}`],{encoding: 'utf-8',stdio: 'inherit',env:process.env});
    }catch(err){
    console.error(err)
    process.exit(-1)
  }
}