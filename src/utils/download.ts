const request = require("request");
// const md5File = require("md5-file");
const path = require("path");
const fs = require("fs");
const fse = require("fs-extra");
const EventEmitter = require("events");
const nodeUtil = require("util");
const temporaryDirectory = require("os").tmpdir();
const lstatPromise = nodeUtil.promisify(fs.lstat);
const removePromise = nodeUtil.promisify(fse.remove);
const pathExistsPromise = nodeUtil.promisify(fse.pathExists);
const ensureDirPromise = nodeUtil.promisify(fse.ensureDir);
function getResHeaders(url) {
  return new Promise(function(resolve, reject) {
    request(
      {
        url,
        method: "GET", 
        forever: true,
        headers: {
          "Cache-Control": "no-cache",
          Range: "bytes=0-1"
        }
      },
      (err, r) => {
        if (err) {
          reject(err);
        } else {
          resolve(r.headers);
        }
      }
    );
  });
}

async function createDownloadTask({
  url,
  md5,
  filename,
  tmpdir = temporaryDirectory
}) {
  let emitter = new EventEmitter();
  let downStream, fileWrite;
  emitter.on("start", async function() {
    try {
      if (tmpdir !== temporaryDirectory) {
        await ensureDirPromise(tmpdir);
      }
      filename = filename || decodeURIComponent(path.basename(url));
      const destinationPath = path.join(tmpdir, filename);
      let headers = await getResHeaders(url);
      let totalSize = Number(headers["content-range"].split("/")[1]);
      let localSize = 0;
      let acceptRanges = headers["accept-ranges"];
      if (acceptRanges !== "bytes") {
        emitter.emit("error", new Error("not support accept-ranges"));
        return;
      }
      emitter.emit("totalSize", { totalSize });
      if (await pathExistsPromise(destinationPath)) {
        let stat = await lstatPromise(destinationPath);
        localSize = stat.size;
        if (
          localSize === totalSize //&&
          // (!md5 || md5File.sync(destinationPath) === md5)
        ) {
          console.log("file alread downloaded\n");
          emitter.emit("progress", {
            percent: 100,
            localSize,
            totalSize
          });
          emitter.emit("end", {
            filepath: destinationPath
          });
          return;
        }

        if (localSize > totalSize) {
          await removePromise(destinationPath);
          return;
        }
      }

      if (fileWrite || downStream) {
        console.warn("downloading...\n");
        return;
      }
      fileWrite = fs.createWriteStream(destinationPath, {
        flags: "a"
      });
      downStream = request(
        {
          method: "GET",
          url,
          forever: true,
          headers: {
            "Cache-Control": "no-cache",
            Range: `bytes=${localSize}-${totalSize - 1}`
          }
        },
        function() {}
      );
      let ended = false;
      downStream
        .on("data", function(data) {
          fileWrite.write(data, async function() {
            
            localSize += data.length;
            let percent =
              Math.floor((10000 * localSize) / totalSize) / 100 || 0;
            emitter.emit("progress", { percent, localSize, totalSize });
            if (totalSize === localSize) {
              if (fileWrite) {
                fileWrite.end();
                fileWrite = null;
              }
              // if (md5 && md5File.sync(destinationPath) !== md5) {
              //   emitter.emit("error", new Error("file md5 verify error"));
              //   if (downStream) {
              //     downStream.abort();
              //     downStream = null;
              //   }
              //   if (fileWrite) {
              //     fileWrite.end();
              //     fileWrite = null;
              //   }
              //   removePromise(destinationPath);
              //   return;
              // }
              ended = true;
              emitter.emit("end", {
                filepath: destinationPath
              });
            }
            if (localSize > totalSize) {
              if (fileWrite) {
                fileWrite.end();
                fileWrite = null;
              }
              emitter.emit("error", new Error("file size error"));
            }
          });
        })
        .on("response", function(response) {
          emitter.emit("response", response.headers);
        })
        .on("abort", function() {
          downStream = null;
          if (fileWrite) {
            fileWrite.end();
            fileWrite = null;
          }
          emitter.emit("abort", new Error("download interupted"));
        })
        .on("error", function(err) {
          console.error(err,'\n');
          emitter.emit("error", new Error("download error"));
          downStream = null;
          if (fileWrite) {
            fileWrite.end();
            fileWrite = null;
          }
        })
        .on("end", function() {
          if (fileWrite) {
            fileWrite.end();
            fileWrite = null;
          }
          downStream = null;
        });
    } catch (e) {
      console.error(e,'\n');
      emitter.emit("error", new Error("unknown error"));
    }
  });
  emitter.on("stop", function() {
    downStream && downStream.abort();
  });

  return emitter;
}

module.exports = createDownloadTask;