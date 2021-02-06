'use strict';

import * as vscode from 'vscode';
import { decode } from 'html-entities';

var format = require('xml-formatter');

function processXmlText(input: string) : string {
	var offset = input.indexOf('Payload:');
	var payload = offset !== -1 ? input.substring(offset + 'Payload:'.length).replace(/^\s*/, '') : input;
	if (payload.startsWith('<')) {
		payload = decode(payload)
			.replace(/<\?xml[^>]*\?>/g, "")
			.replace("<![CDATA[", "")
			.replace("]]>", "");
		payload = format(payload, {collapseContent: true})
	} else {
		payload =  JSON.stringify(JSON.parse(payload), null, 4)
	}
	return input.substring(0, offset) + 'Payload: ' + payload;
}


export function activate(context: vscode.ExtensionContext) {
	vscode.window.registerUriHandler({
		handleUri(uri:vscode.Uri) {
			const pathParts = uri.path.split('/');
			console.log(uri.path);
			    //Create output channel
				let orange = vscode.window.createOutputChannel("XXX");

				//Write to output.
				orange.appendLine("TEST");
				orange.appendLine(JSON.stringify(pathParts));
			if (pathParts[1] == 'base64') {
				vscode.workspace.openTextDocument({
					language: 'xml',
					content: processXmlText(atob(pathParts[2]))
				})
			}
		}
	});

	console.log("aaa");

	let disposable = vscode.commands.registerCommand('processCXF.processPayloadXML', async function () {
		// Get the active text editor
		let editor = vscode.window.activeTextEditor;

		if (editor) {
			let document = editor.document;
			const selection = editor.selection;

			// Get the word within the selection
			const updated = processXmlText(document.getText(selection));
			await editor.edit(editBuilder => {
				editBuilder.replace(selection, updated);
			});
			
			// document = await vscode.languages.setTextDocumentLanguage(editor.document, 'xml');
			
			editor.selection = new vscode.Selection(
				document.positionAt(0),
				document.positionAt(document.getText().length - 1)
			);
			
			await vscode.commands.executeCommand('xmlTools.textToXml');
			await vscode.commands.executeCommand('editor.action.formatDocument')
			
			editor.selection = new vscode.Selection(
				document.positionAt(0),
				document.positionAt(0),
			);

			editor.revealRange(
				new vscode.Range(
					document.positionAt(0),
					document.positionAt(0),
				),
				vscode.TextEditorRevealType.AtTop
			)
		}

	});

    vscode.languages.registerDocumentFormattingEditProvider('cxf', {
        provideDocumentFormattingEdits(document: vscode.TextDocument): vscode.TextEdit[] {
			const selection = new vscode.Selection(
				document.positionAt(0),
				document.positionAt(document.getText().length)
			);
			const updated = processXmlText(document.getText(selection));
			return [vscode.TextEdit.replace(selection, updated)];
        }
    });

	context.subscriptions.push(disposable);
}