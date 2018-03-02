// TODO: Webpack Aglify

require('colors');
const co = require('co');

const util = require('util');
const chalk = require('chalk');

const deviceInfo = {
  version: '',
  irChangePoint: 0x00,
  maxOfHighIrSignal: 0x00,
  minOfHighIrSignal: 0x00,
  maxOfLowIrSignal: 0x00,
  minOfLowIrSignal: 0x00,
  postScaler: 0x00,
  currentBank: 0x00
};
const SerialPort = require('serialport');
const fs = require('fs');

function open(device) {
  return new Promise((resolve, reject) => {
    this.port = new SerialPort(device, {
      baudRate: 9600
    });
    this.port.on('open', () => {
      resolve(true);
      port;
    });
    this.port.on('error', error => {
      console.error(error);
      reject(error);
    });
  });
}

function getInfo() {
  return new Promise((resolve, reject) => {
    // Console.log("get Info");
    infoPart(0)
      .then(type => infoPart(type))
      .then(type => infoPart(type))
      .then(type => infoPart(type))
      .then(type => infoPart(type))
      .then(type => infoPart(type))
      .then(type => infoPart(type))
      .then(type => infoPart(type))
      .then(() => resolve(deviceInfo))
      .catch(error => reject(error));
  });
}

function command(commandStr, completion, failure) {
  // Console.log(commandStr)
  this.port.write(commandStr, err => {
    if (err) {
      console.log(err);
      if (failure) {
        failure(err);
      }
      return;
    }
    this.port.once('data', result => {
      // SetTimeout(() => {
      // console.log(result.toString())
      if (completion) {
        completion(result);
      }
      // }, 50)
    });
  });
}

function infoPart(type) {
  // Console.log("info part");
  return new Promise((resolve, reject) => {
    const commandStr = 'i,' + type + '\r\n';
    command(
      commandStr,
      result => {
        setInfo(type, result);
        resolve(type + 1);
      },
      error => {
        reject(error);
      }
    );
  });
}


function close() {
  console.log('port close');
  return new Promise(resolve => {
    this.port.close();
    resolve();
  });
}

const infoTypes = {
  version: 0,
  irChangePoint: 1,
  maxOfHighIrSignal: 2,
  minOfHighIrSignal: 3,
  maxOfLowIrSignal: 4,
  minOfLowIrSignal: 5,
  postScaler: 6,
  currentBank: 7
};

var setInfo = (type, value) => {
  value = value.toString().replace(/\r\n/, '');
  switch (type) {
    case infoTypes.version:
      deviceInfo.version = value;
      break;
    case infoTypes.irChangePoint:
      deviceInfo.irChangePoint = parseInt(value, 16);
      break;
    case infoTypes.maxOfHighIrSignal:
      deviceInfo.maxOfHighIrSignal = parseInt(value, 16);
      break;
    case infoTypes.minOfHighIrSignal:
      deviceInfo.minOfHighIrSignal = parseInt(value, 16);
      break;
    case infoTypes.maxOfLowIrSignal:
      deviceInfo.maxOfLowIrSignal = parseInt(value, 16);
      break;
    case infoTypes.minOfLowIrSignal:
      deviceInfo.minOfLowIrSignal = parseInt(value, 16);
      break;
    case infoTypes.postScaler:
      deviceInfo.postScaler = parseInt(value, 16);
      break;
    case infoTypes.currentBank:
      deviceInfo.currentBank = value;
      break;
    default:
      break;
  }
};

// -------------------------


function capture() {
  return new Promise((resolve, reject) => {
    this.port.write('c\r\n', (error, bytesWritten) => {
      let logMessage = '';
      this.port.on('data', data => {
        logMessage += data.toString().replace(/\r\n/, '');
        console.log(logMessage);
        if (/[0-640]/.test(data)) {
          resolve();
        } else if (/Time Out !/.test(data)) {
          // Console.log(`time out close!!`)
          resolve();
        }
      });
      if (error) {
        console.log('Error: ', error.message);
        reject(error);
      }
      console.log(bytesWritten, 'bytes written');
    });
  });
}

function play() {
  return new Promise((resolve, reject) => {
    // If (this.port.isOpen() == false) return
    this.port.write('p\r\n', error => {
      if (error) {
        console.log('Error: ', error.message);
        reject(error);
      }
      this.port.on('data', data => {
        // Console.log(data.toString())
        if (data.toString().match(/Done \!/)) {
          resolve();
        }
      });
    });
  });
}

function signalArray(dataSize) {
  // Console.log("get signal array");
  const result = [];
  for (let i = 0; i < dataSize; i++) {
    const bank = Math.floor(i / 64);
    const pos = i % 64;
    result.push({
      bank,
      pos
    });
  }
  // Console.log("generated signal array");
  return result;
}

function setRecordPointer(value) {
  // Console.log("set Record Pointer");
  return new Promise((resolve, reject) => {
    command(
      `n,${value}\r\n`,
      result => {
        if (/OK/.test(result)) {
          // Console.log("recode pointer update...");
          resolve();
        }
      },
      error => {
        console.log(error);
        reject(error);
      }
    );
  });
}

function write(path) {
  // Console.log("write start");
  return new Promise((resolve, reject) => {
    // Console.log(path)
    const json = JSON.parse(fs.readFileSync(path, 'utf-8'));
    // Console.log(json)

    const array = signalArray(json.data.length);
    // Console.log(array)
    // console.log(json.data)
    if (json.data == undefined) {
      reject('json not found');
    }
    co(function*() {
      yield setRecordPointer(json.data.length);
      yield setPostScale(json.postscale);
      for (const key in array) {
        yield setBank(array[key].bank, array[key].pos);
        yield writeFragment(array[key].pos, json.data[key]);
        // Console.log(key)
      }
      resolve();
    });
  });
}

function setPostScale(value) {
  // Console.log(`set postscale ${value}`)
  return new Promise((resolve, reject) => {
    command(
      `k,${value}\r\n`,
      result => {
        // Console.log(result.toString().replace(/\r\n/,""))
        if (/OK/.test(result)) {
          // Console.log(`set post scaler: ${value}`)
          resolve(result);
        }
      },
      error => {
        reject(error);
      }
    );
  });
}

function writeFragment(pos, value) {
  return new Promise((resolve, reject) => {
    // Console.log(`write fragment pos: ${pos} value:${value}`)
    command_immediate(
      `w,${pos},${parseInt(value)}\r\n`,
      () => {
        setTimeout(() => {
          resolve();
        }, 1);
      },
      error => {
        console.log(error);
        reject(error);
      }
    );
  });
}

function dump(info, fileName) {
  return new Promise((resolve, reject) => {
    const array = signalArray(info.irChangePoint);
    // Console.log(array)
    const data = [];
    co(function*() {
      for (const key in array) {
        // Console.log(array[key]);
        yield setBank(array[key].bank, array[key].pos);
        const fragment = yield dumpFragment(array[key].pos);
        data.push(fragment);
      }
      generateSignalFile(fileName, info, data, resolve, reject);
    });
  });
}

function generateSignalFile(fileName, info, data, resolve, reject) {
  const json = JSON.stringify({
    postscale: info.postScaler.toString(16),
    freq: 38,
    data,
    format: 'raw'
  });
  console.log(json);
  if (fileName) {
    fs.writeFile(fileName, json, error => {
      if (error) {
        console.log('failed write file');
        reject(error);
      } else {
        console.log('file saved...');
        resolve();
      }
    });
  } else {
    resolve();
  }
}

function dumpFragment(pos) {
  // Console.log("dump fragment");
  return new Promise((resolve, reject) => {
    command(
      `d,${pos}\r\n`,
      result => {
        const fragment = parseInt(result.toString(), 16);
        // Console.log(fragment)
        resolve(fragment);
      },
      error => reject(error)
    );
  });
}

function command_immediate(commandStr, completion, failure) {
  // Console.log(commandStr)
  this.port.write(commandStr, (error, result) => {
    if (error) {
      console.log(error);
      if (failure) {
        failure(error);
      }
      return;
    }
    if (completion) {
      completion(result);
    }
  });
}

function setBank(bank, pos) {
  // Console.log(`set bank ${bank} pos:${pos}`)
  return new Promise((resolve, reject) => {
    if (pos != 0) {
      resolve();
    } else {
      const pattern = `b,${bank}\r\n`;
      this.port.write(pattern, error => {
        if (error) {
          console.log(error);
          reject(error);
          return;
        }
        // Console.log(`set bank: ${bank}`)
        resolve();
      });
    }
  });
}


exports.capture = port => {
  co(function*() {
    const validPort = yield autoSelectDevicePort();
    port = port || validPort;
    yield open(port);
    yield capture();
    yield close();
  }).catch(error => {
    console.log(`💀  Error: ${error}`);
    close();
  });
};

exports.play = (path, port) => {
  co(function*() {
    const validPort = yield autoSelectDevicePort();
    port = port || validPort;
    yield open(port);
    if (path) {
      yield write(path);
    }
    yield play();
    yield close();
  }).catch(error => {
    console.log(`💀  Error: ${error}`);
    close();
  });
};

exports.write = (path, port) => {
  co(function*() {
    const validPort = yield autoSelectDevicePort();
    port = port || validPort;
    yield open(port);
    yield write(path);
    yield close();
  }).catch(error => {
    console.log(`💀  Error: ${error}`);
    close();
  });
};

exports.temp = port => {
  co(function*() {
    const validPort = yield autoSelectDevicePort();
    port = port || validPort;
    yield open(port);
    yield temp();
    yield close();
  }).catch(error => {
    console.log(`💀  Error: ${error}`);
    close();
  });
};

exports.dump = (fileName, port) => {
  co(function*() {
    const validPort = yield autoSelectDevicePort();
    port = port || validPort;
    yield open(port);
    const info = yield getInfo();
    yield dump(info, fileName);
    yield close();
  }).catch(error => {
    console.log(`💀  Error: ${error}`);
    close();
  });
};

exports.reco = value => {
  co(function*() {
    yield open();
    yield setRecordPointer(value);
    yield close();
  }).catch(error => {
    console.log(`💀  Error: ${error}`);
    close();
  });
};

class IRMagician {
  constructor() {
    console.log('Constructor');
    return (async () => {
      const devices = (await SerialPort.list()).filter(element => {
        if (typeof element === 'undefined') return false;
        if (/\/dev\/(tty|cu)\.usbmodem\d?\d/.test(element.comName)) return true;
        return /\/dev\/ttyACM0/.test(element.comName);
      });

      if (devices.length <= 0) {
        throw Error(
          "Valid device port is not found. Please confirm connection of irMagician. 🔌'v"
        );
      }

      console.log('open start');
      this.port = new SerialPort(devices[0].comName, { baudRate: 9600 });

      await new Promise(resolve => {
        this.port.on('open', () => {
          console.log('port open');
          resolve(this);
        });
      });

      this.port.on('error', error => {
        console.log('error: port open');
        console.error(error);
        throw error;
      });

      return this;
    })();
  }

  async capture() {
  
  }

  /**
   * メモリの表示
   * @param n Target memory number (0 ~ 63)
   * @returns {Promise<void>}
   */
  async dump(n) {
    for (let i = 0; i < 64; i++) {
      let x = await this.exec(`D,${i}\n`);
      if (i % 4 === 0) process.stdout.write('  ');
      if (i % 16 === 0) process.stdout.write('\n');
      process.stdout.write(`${x} `);
    }
    process.stdout.write('\n\n');
  }

  /**
   * メモリのバンク設定を行います。メモリバンクは64バイトがひとつの単位になっています。
   * 全部で10バンクあり、64×10=640バイトの信号保存領域があります。
   * @param bank Bank ID 0 ~ 9
   * @returns {Promise<void>}
   */
  async bankSet(bank) {
    console.log(`Bank set to ${bank}`);
    // TODO: range check
    return await this.exec(`n,${bank}`);
  }

  /**
   * LED on/off
   * @param on
   * @returns {Promise<void>}
   */
  async led(on) {
    const ledState = on ? 1 : 0;
    const res = await this.exec(`L,${ledState}`);
    console.log(res);
  }

  /**
   * Get Temperature
   * 温度センサの値を0000-1023の範囲で返します。上位のアプリの補正式を通して、℃に換算します。
   * degree Celsius = ((5 / 1024 * T[value]) – 0.4) / (19.53 / 1000)
   */
  async temp() {
    // TODO: raw mode, ˚F mode
    const res = await this.exec('T');
    const c = ((5 / 1024 * parseInt(res)) - 0.4) / (19.53 / 1000);
    console.log(c);
  }

  /**
   * Information
   * @returns {Promise<any>}
   * @see http://www.omiya-giken.com/?page_id=889
   */
  async info() {

    // const irInfo = {
    //   0: 'バージョン表示',
    //   1: '赤外線信号の変化点 (L/Hの切り替わり)の数',
    //   2: 'H側の赤外線信号の最大値',
    //   3: 'H側の赤外線信号の最小値',
    //   4: 'L側の赤外線信号の最大値',
    //   5: 'L側の赤外線信号の最小値',
    //   6: 'postScalerの値',
    //   7: '現在のバンクの値'
    // };

    // TODO: cli-tables
    // TODO: toString(16)
    console.log(`
  0) Version              : ${await this.exec('i,0')}
  1) IR change point      : ${await this.exec('i,1')}
  2) Max of high IR signal: ${await this.exec('i,2')}
  3) Min of high IR signal: ${await this.exec('i,3')}
  4) Max of low  IR signal: ${await this.exec('i,4')}
  5) Min of low  IR signal: ${await this.exec('i,5')}
  6) postScaler           : ${await this.exec('i,6')}
  7) current bank         : ${await this.exec('i,7')}
`);
  }

  async list() {
    console.log('List');
    (await SerialPort.list()).forEach(p => {
      console.log(p.comName);
    });
  }

  async exec(cmd) {
    return new Promise(resolve => {
      this.port.write(`${cmd}\n`, err => {
        if (err) throw err;
        return this.port.once('data', res => {
          resolve(res.toString().trim());
        });
      });
    });
  }

  async version() {
    console.log('Version');
    const v = await this.exec('V');
    console.log(v);
  }

  close() {
    console.log('Close');
    this.port.close();
  }
}

function autoSelectDevicePort() {
  return new Promise((resolve, reject) => {
    SerialPort.list((err, ports) => {
      const validPorts = ports.filter(element => {
        if (typeof element === 'undefined') {
          return false;
        }
        if (/\/dev\/tty\.usbmodem\d?\d/.test(element.comName)) {
          return true;
        }
        if (/\/dev\/cu\.usbmodem\d?\d/.test(element.comName)) {
          return true;
        }
        return /\/dev\/ttyACM0/.test(element.comName);
      });
      if (validPorts.length > 0) {
        resolve(validPorts[0].comName);
      } else {
        reject(
          'Valid device port is not found. Please confirm connection of irMagician. 🔌'
        );
      }
    });
  });
}

module.exports = IRMagician;
