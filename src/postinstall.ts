import {checkDocker, installDocker,installDockerImage, checkDockerImage}  from './utils/docker'
import * as cli from 'cli-color'

async function main():Promise<void>{
  console.info(cli.red.underline('1. checking docker application'))
  if(!checkDocker()){
    process.stdout.write(cli.move(2, 12)); 
    console.info(cli.red.underline('docker not exist, start install docker'))
    await installDocker()
  } else {
    process.stdout.write(cli.move(2, 12)); 
    console.info(cli.red.underline('docker already exist'))
  }
  console.info(cli.red.underline('2. checking minits docker image'))
  if(!checkDockerImage()){
    process.stdout.write(cli.move(2, 12)); 
    console.info(cli.red.underline('docker image not exist, start download minits image'))
    await installDockerImage()
  } else {
    process.stdout.write(cli.move(2, 12)); 
    console.info(cli.red.underline('minits image already exist'))
  }
}


main()