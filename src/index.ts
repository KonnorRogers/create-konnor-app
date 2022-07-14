#!/usr/bin/env node
import * as fs from "fs";
import * as path from "path";
import shell from "shelljs";
import * as ejs from "ejs";
import inquirer from "inquirer"
import chalk from "chalk"
import * as url from "url"

interface TemplateData {
  projectName: string;
  typescript: boolean;
}

interface CliOptions {
  projectName: string;
  templateName: string;
  templatePath: string;
  targetPath: string;
  typescript: boolean;
  documentation: boolean;
}

const __filename = url.fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const PKG_ROOT = path.join(__dirname, "../")

function render(content: string, data: TemplateData) {
  return ejs.render(content, data);
}

const SKIP_FILES = ["pnpm-lock.yaml", "node_modules", ".template.json"];
const CURR_DIR = process.cwd();
const CHOICES = fs.readdirSync(path.join(PKG_ROOT, "src", "templates"));

;(async () => {
  const QUESTIONS = [
    {
      name: "template",
      type: "list",
      message: "What template would you like to use?",
      choices: CHOICES,
    },
    {
      name: "typescript",
      type: "confirm",
      message: "Would you like to use Typescript? (Y/N)",
    },
    {
      name: "documentation",
      type: "confirm",
      message: "Would you like to generate documentation? (Y/N)",
    },
    {
      name: "name",
      type: "input",
      message: "Please input a new project name:",
    },
  ];


  const answers = await inquirer.prompt(QUESTIONS)
  const projectChoice = answers["template"];
  const projectName = answers["name"];
  const typescript = answers["typescript"];
  const documentation = answers["documentation"];
  const templatePath = path.join(PKG_ROOT, "src", "templates", projectChoice);
  const targetPath = path.join(CURR_DIR, projectName);

  const options: CliOptions = {
    projectName,
    templateName: projectChoice,
    templatePath,
    targetPath,
    typescript,
    documentation
  };

  if (!createProject(targetPath)) {
    return;
  }

  createDirectoryContents(templatePath, { projectName, typescript });

  postProcess(options);

  function createProject(projectPath: string) {
    if (fs.existsSync(projectPath)) {
      console.log(
        chalk.red(`Folder ${projectPath} exists. Delete or use another name.`)
      );
      return false;
    }
    fs.mkdirSync(projectPath);

    return true;
  }
})()


function createDirectoryContents(
  templatePath: string,
  { projectName, typescript }: TemplateData
) {
  // read all files/folders (1 level) from template folder
  const filesToCreate = fs.readdirSync(templatePath);
  // loop each file/folder
  filesToCreate.forEach((file) => {
    const origFilePath = path.join(templatePath, file);

    // get stats about the current file
    const stats = fs.statSync(origFilePath);

    // skip files that should not be copied
    if (SKIP_FILES.indexOf(file) > -1) return;

    if (stats.isFile()) {
      // read file content and transform it using template engine
      let contents = fs.readFileSync(origFilePath, "utf8");
      contents = render(contents, { projectName, typescript });
      // write file to destination folder
      const writePath = path.join(CURR_DIR, projectName, file);
      fs.writeFileSync(writePath, contents, "utf8");
    } else if (stats.isDirectory()) {
      // create folder in destination folder
      fs.mkdirSync(path.join(CURR_DIR, projectName, file));
      // copy files/folder inside current folder recursively
      createDirectoryContents(
        path.join(templatePath, file),
        {
          projectName: path.join(projectName, file),
          typescript
        }
      );
    }
  });
}

function postProcess(options: CliOptions) {
  const bridgetown = options.documentation ? "&& gem install bridgetown && (bridgetown new docs -t erb -c turbo,stimulus || echo 'failed to install bridgetown')" : ""
  shell.cd(options.targetPath);

  shell.exec(`git init && (pnpm install || echo 'failed to install with pnpm') ${bridgetown}`)
}
