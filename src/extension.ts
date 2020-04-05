'use strict';

import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
	let disposable = vscode.commands.registerCommand('extension.processPayloadXML', async function () {
		// Get the active text editor
		let editor = vscode.window.activeTextEditor;

		if (editor) {
			let document = editor.document;
			const selection = editor.selection;

			// Get the word within the selection
			const input = document.getText(selection);
			const updated = input.indexOf('Payload:') !== -1 ? 
				input.substring(input.indexOf('Payload:') + 'Payload:'.length).split("\n")[0].trim() : input;

			await editor.edit(editBuilder => {
				editBuilder.replace(selection, updated);
			});
			
			document = await vscode.languages.setTextDocumentLanguage(editor.document, 'xml');
			
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

	context.subscriptions.push(disposable);
}