import * as childProcess from 'child_process'
import {dockerImage} from './config'
import * as path from 'path'
import * as os from 'os'



const mapPrefix = "/share"
const conainerName = 'minits'

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

const isContainerStoped = ():boolean=>{
  var searchResult = childProcess.spawnSync('docker', ['ps',"-a","--format","{{.Names}}:{{.Status}}"],{encoding: 'utf-8'});
  const result = searchResult.output && searchResult.output.toString() 
  if(result && result.indexOf(conainerName)>-1 && result.indexOf('Exited')>-1){
    return true
  }
  return false
}

const restartContainer = ()=>{
  if(isContainerStoped()){
    console.info('container already exist, begin restart container')
    try{
      childProcess.spawnSync('docker', ['start',conainerName],{encoding: 'utf-8',stdio: 'inherit',env:process.env});
    }catch(e){
      console.error('failed restart container',e,'\n')
    }finally{
      console.info('end restart container')
    }
  }
}

const updateContainer=()=>{
  try{
    console.info('begin update container')
    childProcess.spawnSync('docker', ['exec',conainerName, 'bash','-c','cp -f -r /usr/lib/llvm-6.0 /usr/lib/llvm;cd /usr/lib/minits;git pull;npm install yarn -g;yarn;rm -f -r build;yarn build'],{encoding: 'utf-8',stdio: 'inherit',env:process.env});
  }catch(e){
    console.error('failed update container',e,'\n')
  }finally{
    console.info('end update container')
  }
}

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
    if(isContainerStoped()){
      restartContainer()
    }
    childProcess.spawnSync('docker', ['run','-itd','-v', vCommand,'--name', conainerName, dockerImage, '/bin/bash'],{encoding: 'utf-8'});
    if(opts.update){
      updateContainer()
    }
    childProcess.spawnSync('docker', ['exec',conainerName, 'node','/usr/lib/minits/build/main/index.js','build', `${mapPath(sourceFull)}`].concat(otherArgs),{encoding: 'utf-8',stdio: 'inherit',env:process.env});
  }catch(err){
    console.error(err,'\n')
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
    if(isContainerStoped()){
      restartContainer()
    }
    childProcess.spawnSync('docker', ['run','-itd','-v', vCommand,'--name', conainerName, dockerImage, '/bin/bash'],{encoding: 'utf-8'});
    if(opts.update){
      updateContainer()
    }
    childProcess.spawnSync('docker', ['exec',conainerName, 'node','/usr/lib/minits/build/main/index.js','run',`${mapPath(sourceFull)}`].concat(otherArgs),{encoding: 'utf-8',stdio: 'inherit',env:process.env});
  }catch(err){
    console.error(err,'\n')
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
    if(isContainerStoped()){
      restartContainer()
    }
    childProcess.spawnSync('docker', ['run','-itd','-v', vCommand,'--name', conainerName, dockerImage, '/bin/bash'],{encoding: 'utf-8'});
    childProcess.spawnSync('docker', ['exec',conainerName, 'bash','/tmp/ts-to-riscv.sh',`${mapPath(sourceFull)}`,`${mapPath(destFull)}`],{encoding: 'utf-8',stdio: 'inherit',env:process.env});
  }catch(err){
    console.error(err,'\n')
    process.exit(-1)
  }
}