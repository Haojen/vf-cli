const fs = require('fs')
const ora = require('ora')
const path = require('path')
const fse = require('fs-extra')
const inquirer = require('inquirer')
const gitUserName = require('git-user-name')
const {downloadTS2JSONTemplate, downloadVueTemplate, checkUpdate} = require('../utils')

module.exports = async args => {
  if (args.length < 2) {
    console.error('please create a project name: vf init [Project Name]')
    return
  }
  const projectName = args[0]
  const projectFullPath = path.resolve(process.cwd(), projectName)

  if (fs.existsSync(projectFullPath)) {
    console.log("\x1b[31m", `The project directory name "${projectName}" already exists.`)
    return
  }

  const prompt = inquirer.createPromptModule();

  let next = await prompt([
    {
      name: 'projectName',
      message: 'Project Name:',
      default: projectName,
      validate: function (input) {
        if (!input) {
          return 'Not valid project name!'
        }
        return true
      }
    },
    {
      name: 'projectDescription',
      message: 'Project description:',
      default: 'vf-project'
    },
    {
      type: 'confirm',
      name: 'isUseVueTemplate',
      message: 'Install Vue template test?',
      default: false
    },
    {
      name: 'projectAuthor',
      message: 'Author:',
      default: gitUserName || ''
    }
  ])

  let t2jDistPath = '',
      installedNotice = '',
      downloadedVueTemplatePath = ''

  if (next.isUseVueTemplate) {
    installedNotice = `
      1. cd ${next.projectName}/ts2json && npm i && npm run start
      2. cd ${next.projectName}/web && npm i && npm run start
    `
    t2jDistPath = `${projectFullPath}/ts2json`
    next.outputJSON = '../web/vf-json'
    downloadedVueTemplatePath = await downloadVueTemplate(projectFullPath + '/web')
  }
  else {
    installedNotice = `
      cd ${next.projectName} && npm i && npm run start
    `
    t2jDistPath = projectFullPath
    next.outputJSON = './vf-json'
  }

  const spinner = ora(`Creating Project: ${next.projectName}`)
  spinner.start()

  const downloadedT2JTemplatePath = await downloadTS2JSONTemplate(t2jDistPath)

  const packageLockFile = `${downloadedT2JTemplatePath}/package-lock.json`
  fse.pathExistsSync(packageLockFile) && fse.removeSync(packageLockFile)

  if (next.isUseVueTemplate) {
    fse.removeSync(`${downloadedT2JTemplatePath}/vf-json`)
    fse.removeSync(`${downloadedT2JTemplatePath}/index.html`)
    fse.removeSync(`${downloadedVueTemplatePath}/.gitignore`)
  }

  fse.removeSync(`${downloadedT2JTemplatePath}/.gitignore`)

  const input = next
  const ts2jsonPackageJSON = require(`${downloadedT2JTemplatePath}/package.json`)
  const templatePackageJSON = require('../template/package')
  const t2jConfigJSON = require(`${downloadedT2JTemplatePath}/t2j.config`)
  const dowonloadPackagePath = `${downloadedT2JTemplatePath}/package.json`
  const dowonloadT2JConfigPath = `${downloadedT2JTemplatePath}/t2j.config.json`

  t2jConfigJSON.output = input.outputJSON
  templatePackageJSON.name = input.projectName
  templatePackageJSON.author = input.projectAuthor
  templatePackageJSON.description = input.projectDescription
  templatePackageJSON.dependencies = ts2jsonPackageJSON.dependencies

  fse.outputJsonSync(dowonloadPackagePath, templatePackageJSON, { spaces: 2 })
  fse.outputJsonSync(dowonloadT2JConfigPath, t2jConfigJSON, { spaces: 2 })

  spinner.info(`Run your project: ${next.projectName}`)
  console.log("\x1b[32m", installedNotice);
  spinner.succeed('Finish')
  checkUpdate()
}
