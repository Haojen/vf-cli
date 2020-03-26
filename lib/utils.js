const ora = require('ora')
const path = require('path')
const fes = require('fs-extra')
const download = require('download-git-repo')

function downFile(URL, directory, logMsg = '') {
  const target = path.resolve(directory)

  fes.ensureDirSync(target)

  return new Promise((resolve, reject) => {
    // const spinner = ora(`Downloading template from ${URL}`)
    const spinner = ora(logMsg)

    spinner.start()

    download(URL, target, {clone: false}, err => {
      if (err) {
        spinner.fail()
        reject(err)
        return
      }

      spinner.succeed()
      resolve(target)
    })
  })
}

module.exports = {
  downloadTS2JSONTemplate(directory = '') {
    return downFile('vipkid-edu/vf-ts2json', directory, 'Downloading vf-ts2json..')
  },
  downloadVueTemplate(directory = '') {
    return downFile('vipkid-edu/vf-vue-template', directory, 'Downloading vue template..')
  }
}
