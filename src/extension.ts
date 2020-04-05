'use strict';

import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
	let disposable = vscode.commands.registerCommand('extension.processPayloadXML', async function () {
		// Get the active text editor
		let editor = vscode.window.activeTextEditor;

		if (editor) {
			let document = editor.document;
			let selection = editor.selection;

			// Get the word within the selection
			let input = document.getText(selection);
			let reversed = input.substring(input.indexOf('Payload:') + 'Payload:'.length).trim();
			editor.edit(editBuilder => {
				editBuilder.replace(selection, reversed);
			});

			const definitions = await vscode.commands.executeCommand<vscode.Location[]>(
				'vscode.executeDefinitionProvider',
				editor.document.uri,
				editor.selection.active
			);

			if (!definitions) {
				return;
			}

			for (const definition of definitions) {
				console.log(definition);
			}
		}

	});

	context.subscriptions.push(disposable);
}