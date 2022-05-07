const fs = require('fs')
const path = require('path')
const qoa = require('qoa');//交互式命令行
const parse = require('swagger-parser')
const swaggerUrl = 'https://hezhaoming.natapp4.cc/v2/api-docs'//swagger json请求地址
// api接口方法存放目录
const API_PATH = path.resolve(__dirname, './src/apitest')

// 判断目录是否存在
const isExist = (lastPath = '') => {
	const privatePath = `${lastPath ? API_PATH + '/' + lastPath : API_PATH}`
	//判断路径是否存在  存在true
  const stat = fs.existsSync(privatePath)
	if (!stat) {
		fs.mkdirSync(privatePath)
    console.log('创建目录'+privatePath+'成功');
	}else{
    console.log('已存在目录'+privatePath);
  }
	if (!lastPath) {
		const configPath = `${API_PATH}/config.js`
		// api 目录下写入 config文件
		fs.access(configPath, function (err) {
			if (err && err.code === 'ENOENT') {
				fs.writeFileSync(`${API_PATH}/config.js`, 'export const ip = \'https://test.××××.com/\'')
			}
		})
	}
}

// 整理出相同模块路径
const getModules = (map) => {
	map.forEach((value, key) => {
		writeFileApi(key, value)
	})
}

// 写入ts
const writeFileApi = (fileName, apiData) => {
  console.log(fileName, apiData)
	// api.ts
	let tplApi = 'import { ip } from \'../config\' \n\nexport default {\n'
	// index.ts
	let tplIndex = 'import { post, get, put, delete } from \'../utils/request\'\nimport api from \'./api\'\n\n'

	const apiDataLen = apiData.length
	for (let i = 0; i < apiDataLen; i++) {
		const item = apiData[i]
		const itemKeys = Object.keys(item)	// 请求方法
		const itemTagKey = itemKeys[0]	// 方法数据信息
		const itemKeysFirest = item[itemTagKey]
		const pathName = itemKeysFirest.operationId
		const allPath = item.allPath
		tplApi = `${tplApi}   ${pathName}: \`\${ip}${allPath}\`,\n`
		tplIndex = `${tplIndex}\n//${itemKeysFirest.summary}\n` +
		`export const ${pathName} = (params) => {\n` +
		`	return ${itemTagKey}(api.${pathName}, params)\n}`
	}
	tplApi = tplApi + '\n}'
	fs.writeFileSync(`${API_PATH}/${fileName}/api.ts`, tplApi)
	fs.writeFileSync(`${API_PATH}/${fileName}/index.ts`, tplIndex)
}

// 入口方法
const apigen = async () => {
	isExist()
	try {
    // parsed 请求获取到的swagger json
		const parsed = await parse.parse(swaggerUrl)

    //结构赋值 
    const { paths } = parsed;
		const pathsKeys = Object.keys(paths)	// 获取url路径
		const pathsKeysLen = pathsKeys.length
    console.log('pathsKeys',pathsKeys);
    
		const modulesMap = new Map()
		for (let i = 0; i < pathsKeysLen; i++) {
			const item = pathsKeys[i]
			const itemAry = item.split('/')
      console.log('itemAry',itemAry)
			const pathsItem = paths[item]
			let fileName = itemAry[1] //定义对于的文件夹名称
			if (!fileName) continue
			fileName = fileName.toLowerCase()
			// 判断文件目录是否存在，并创建模块目录
			isExist(fileName)
			// 完整路径
			pathsItem.allPath = item
			if (modulesMap.has(fileName)) {
				const fileNameAry = modulesMap.get(fileName)
				fileNameAry.push(pathsItem)
				modulesMap.set(fileName, fileNameAry)
			} else {
				modulesMap.set(fileName, [pathsItem])
			}
		}
    
		getModules(modulesMap)
	} catch (e) {
		console.log(e)
	}
}

apigen()
