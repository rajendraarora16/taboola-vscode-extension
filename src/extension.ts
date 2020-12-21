// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as url from "url";
import * as http from "http";
import * as https from "https";
let beautify = require('js-beautify').js;


// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	let disposable = vscode.commands.registerCommand('taboola-loader.taboolaLoader', () => {

		const configParams = vscode.workspace.getConfiguration('download-file'),
			defaultFolder = vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders[0].uri.fsPath + '/' + configParams.get('defaultFolder') as string;


		vscode.window.showInputBox({prompt: 'Please enter the publisher name'}).then((res) => {
			if(!res) {
				vscode.window.showErrorMessage('Please enter valid Taboola\'s publisher name');
				return;
			}
			fetchAndSaveFile(res, defaultFolder);
		});
	});

	context.subscriptions.push(disposable);
}

function fetchAndSaveFile(loaderFileName:any, dest:any) {
	const timeout = 1000,
		urlParsed = url.parse(loaderFileName),
		uri = urlParsed && urlParsed.pathname && urlParsed.pathname.split('/');

	let req,
		filename = 'loader.js',
		publisherName = loaderFileName;

	let fileUrl = '';
	if(urlParsed.protocol === null) {
		fileUrl = 'http://cdn.taboola.com/libtrc/' + publisherName+'/loader.js';
	}

	if(fileUrl === '') {
		vscode.window.showErrorMessage('Please enter valid Taboola\'s publisher name');
		return;
	}

	req = (urlParsed.protocol === 'https:') ? https : http; 

	let taboolaLoaderFile = req.get(fileUrl, function(response) {

		let body = '';

		if(filename && filename.indexOf('.') < 0) {
			const contentType = response.headers['content-type'];
			filename += `.${contentType && contentType.split('/')[1]}`;
		}

		const targetPath = `${dest}/${publisherName}`,
			fileTargetPath = `${targetPath}/${filename}`;

		if(response.statusCode === 200) {
			response.setEncoding('utf8');
			
			// If directory exists then delete and create it again..
			if (true){
				fs.rmdirSync(targetPath, { recursive: true });
				fs.mkdirSync(targetPath);
			}

			//response body
			response.on("data", function(chunk) {
				body += chunk;
			});
		} else {
			vscode.window.showErrorMessage(`Failed to download ${publisherName} loader file!`);
		}

		response.on('end', function() {
			fs.writeFile(fileTargetPath, beautify(body, { preserve_newlines: false}), function (err) {
				if (err) { 
					vscode.window.showErrorMessage(`Something went wrong: ${err}`);
					return;
				}
				
				//Download index.html file
				downloadHtmlIndexFile(dest, publisherName, loaderFileName);
				//Download impl file
				downloadImplReleaseFile(dest, publisherName, loaderFileName);
			});
			vscode.window.showInformationMessage(`Loader file for ${publisherName} is downloaded!`);
		});

	}).on('error', function(e) {
		vscode.window.showErrorMessage(`Downloading ${publisherName} name is failed, please make sure the publisher name is correct: ${e}`);
	});

}

function downloadHtmlIndexFile(dest:any, publisherName:any, loaderFileName:any) {
	// Download Tabool mock html template..
	let taboolaMockTemplateUrl = 'http://cdn.taboola.com/static/impl/html/vs-code-mock.html';
	let taboolaMockTemplate = http.get(taboolaMockTemplateUrl, function(mockResp) {
		
		let mockFilePath = `${dest}/${publisherName}`,
		mockFileTargetPath = `${mockFilePath}/index.html`;

		if (!fs.existsSync(mockFileTargetPath)){
			
			let mockTemplateHtml = '';

			if(mockResp.statusCode === 200) {
				mockResp.setEncoding('utf8');
				
				mockResp.on("data", function(chunk) {
					mockTemplateHtml += chunk;
				});

				mockResp.on('end', function() {
					fs.writeFile(mockFileTargetPath, mockTemplateHtml.replace('<publisher-name>', loaderFileName), function (err) {
						if (err) { 
							vscode.window.showErrorMessage(`Cannot create taboola mock template: ${err}`);
							return;
						}
					});
					vscode.window.showInformationMessage(`Taboola html template is created`);
				});
			} else {
				vscode.window.showErrorMessage(`Something went wrong while creating Taboola html template`);
			}
		}else {
			vscode.window.showInformationMessage(`Taboola html template already exists`);
		}

	}).on('error', function(e) {
		vscode.window.showErrorMessage(`Unable to create Taboola html template: ${e}`);
	});
}


function downloadImplReleaseFile(dest:any, publisherName:any, loaderFileName:any) {
	// Download Tabool mock impl release..
	let taboolaMockTemplateUrl = 'http://cdn.taboola.com/static/impl/js/impl-file-mock-vscode.js';
	let taboolaMockTemplate = http.get(taboolaMockTemplateUrl, function(mockResp) {
		
		let mockFilePath = `${dest}/${publisherName}`,
		mockFileTargetPath = `${mockFilePath}/impl-release.js`;

		if (!fs.existsSync(mockFileTargetPath)){
			
			let mockTemplateImplRelease = '';

			if(mockResp.statusCode === 200) {
				mockResp.setEncoding('utf8');
				
				mockResp.on("data", function(chunk) {
					mockTemplateImplRelease += chunk;
				});

				mockResp.on('end', function() {
					fs.writeFile(mockFileTargetPath, mockTemplateImplRelease, function (err) {
						if (err) { 
							vscode.window.showErrorMessage(`Cannot create taboola impl release template: ${err}`);
							return;
						}
					});
					vscode.window.showInformationMessage(`Taboola impl release file is created`);
				});
			} else {
				vscode.window.showErrorMessage(`Something went wrong while creating Taboola impl release`);
			}
		}else {
			vscode.window.showInformationMessage(`Taboola impl release template already exists`);
		}

	}).on('error', function(e) {
		vscode.window.showErrorMessage(`Unable to create Taboola impl release: ${e}`);
	});
}

// this method is called when your extension is deactivated
export function deactivate() {}
