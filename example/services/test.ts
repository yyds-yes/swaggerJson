import { filterPaths } from "../../lib/utils/format";
import { changeFile } from "../../lib/utils";
import { getExtraDefinitions } from "../../lib/utils/format";
import buildService from "../../lib/Service";
import buildInterface from "../../lib/Interface";

const fs = require("fs");
const path = require("path");
const request = require("request");
const qoa = require("qoa"); //交互式命令行

// swagger api-docs
const api = 'https://hezhaoming.natapp4.cc/v2/api-docs';
console.log(`try to request ${api}`);

// 自定义api接口方法存放目录
const API_PATH = path.resolve(__dirname, "./src/apitest");

// 判断目录是否存在
const isExist = (lastPath = "") => {
  const privatePath = `${lastPath ? API_PATH + "/" + lastPath : API_PATH}`;
  //判断路径是否存在  存在true
  const stat = fs.existsSync(privatePath);
  if (!stat) {
    fs.mkdirSync(privatePath);
    console.log("🚀🚀🚀创建目录" + privatePath + "成功");
  } else {

  }
};
const generatorService = (
  serviceDir: string,
  serviceSource: string,
  path: any,
  control: string,
) => {
  const buildServiceInst = new buildService({
    controllerName: control,
    importTypePath: "./type",
  });
  changeFile(
    serviceDir,
    buildServiceInst.generator(serviceSource, path),
    () => {
      console.log(`🚀🚀🚀成功文件写入文件 -- ${serviceDir}`);
    },
  );
};

const generatorInterface = (
  interDir: string,
  interSource: string,
  definitions: any,
) => {
  const buildInterfaceInst = new buildInterface();
  changeFile(
    interDir,
    buildInterfaceInst.generator(interSource, getExtraDefinitions(definitions)),
    () => {

      console.log(`🚀🚀🚀成功写入文件 -- ${interDir}`);
    },
  );
};

/**
 * 
 * @param dir 删除文件夹地址
 */
const removeDir = (dir) => {
  let files = fs.readdirSync(dir)
  for(var i=0;i<files.length;i++){
    let newPath = path.join(dir,files[i]);
    let stat = fs.statSync(newPath)
    if(stat.isDirectory()){
      //如果是文件夹就递归下去
      removeDir(newPath);
    }else {
     //删除文件
      fs.unlinkSync(newPath);
    }
  }
  fs.rmdirSync(dir)//如果文件夹是空的，就将自己删除掉
}



/**
 * node writeFileSync
 * @param fileName  qoa选择的api controller，创建的文件名称 例如：order.ts
 * @param  definitions  写入文件数据
 * @param  p  
 * 
 */
const writeFileApi = (fileName, definitions, p) => {
  isExist(fileName)
  // const serviceDir = path.join(`./${fileName}.ts`);//store.ts 所有文件连接的操作
  const serviceDir = `${fileName}.ts`; //store.ts 对应的命名文件放在对应的目录中
  fs.readFile(serviceDir, (err, serviceSource) => {
    if (err) {
      // console.log('9999',serviceDir,serviceSource,definitions)
      fs.writeFileSync(`${API_PATH}/${fileName}/` + serviceDir, "");
    }
    generatorService(
      `${API_PATH}/${fileName}/` + serviceDir,
      serviceSource || "",
      p,
      fileName,
    );
  });

  // const interDir = path.join(`${API_PATH}/${fileName}/type.ts`); 所有文件连接的操作
  const interDir = `${API_PATH}/${fileName}/type.ts`; //对应的命名文件放在对应的目录中
  fs.readFile(interDir, (err, interSource) => {
    if (err) {
      fs.writeFileSync(interDir, "");
    }
    generatorInterface(interDir, interSource || "", definitions);
  });
};

const cb = async (err: any, response: any) => {
  if (!err && response.statusCode === 200) {
    console.log("🚀🚀🚀🚀🚀🚀success request!");
    const { tags, paths, definitions } = JSON.parse(response.body); //请求获取到的 swagger json 数据

    console.log(JSON.parse(response.body));

    /********创建对应目录文件 start*/
    const pathsKeys = Object.keys(paths); // 获取url路径
    const pathsKeysLen = pathsKeys.length;
    let fileName = "";
    for (let i = 0; i < pathsKeysLen; i++) {
      const item = pathsKeys[i];
      const itemAry = item.split("/");      
      fileName = itemAry[1]; //定义对于的文件夹名称
      if (!fileName) continue;
      fileName = fileName.toLowerCase();
      // 判断文件目录是否存在，并创建模块目录
      // isExist(fileName);
    }
    /********创建对应目录文件 end */

    /****qoa交互命令行选择  start*/
    const selectList = tags.filter((i: { name: string }) => i.name !== "");
    const selectControl = {
      type: "interactive",
      query: "Select your api controller:",
      handle: "control",
      symbol: ">>>>",
      menu: selectList.map((i: { name: string }) => i.name),
    };
    const { control } = await qoa.prompt([selectControl]);

    const p = filterPaths(control, paths);
    if(control.includes('-')){
      // let delfile = control.split('-')[0]
      // const delFilePath = `${API_PATH + "/" + delfile}`;
      const delFilePath = `${API_PATH + "/" + control}`;
      const stat = fs.existsSync(delFilePath);
      //如果包含了则删除重新去创建 cp无法保证原子性  直接rf 再去写入
      if(stat){
        removeDir(delFilePath,)
      }
    }else if(control.includes('/')){

    }
    /****qoa交互命令行选择 end */
    // 写入文件
    writeFileApi(control, definitions, p);
  }else{
    console.log('❌❌❌ 请求失败！请重新尝试！');
    
  }
};

request(api, cb);
