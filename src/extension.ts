'use strict';

import * as vscode from 'vscode';
import { decode } from 'html-entities';
import * as xml from 'tsxml';

async function processXmlText(input: string) : Promise<string> {
	input = input.replace(/(?<!\n) +(([A-Za-z]+: )(?=.*Payload: )|Payload: )/gs, "\n    $1")
	const offset = input.indexOf('Payload:');
	const payload = offset !== -1 ? input.substring(offset + 'Payload:'.length).replace(/^\s*/, '') : input;
	let formatted;
	if (payload.startsWith('<')) {
		const processed = decode(payload)
			.replace(/(?<=<!\[CDATA\[.*)<\?xml[^>]*\?>/gs, "")
			.replace("<![CDATA[", "")
			.replace("]]>", "");

		try {
			formatted = await xml.Compiler.formatXmlString(processed, {
				indentChar: '  ',
				newlineChar: '\n',
				attrParen: '"'
			})
		} catch(e) {
			// our preprocessing probably crippled document, try agin by-passing it
			console.warn(e)
			formatted = await xml.Compiler.formatXmlString(payload, {
				indentChar: '  ',
				newlineChar: '\n',
				attrParen: '"'
			})
		}
		// inline tags with short and simple content
		formatted = formatted.replace(/(?<=>)\n[ \t]+([^<>\n]{0,30}[^<> \t\n])[ \t]*\n[ \t]+(?=<)/mg, "$1")
	} else {
		formatted =  JSON.stringify(JSON.parse(payload), null, 4)
	}
	return input.substring(0, offset) + 'Payload: ' + formatted;
}


export async function activate(context: vscode.ExtensionContext) {
	vscode.window.registerUriHandler({
		async handleUri(uri:vscode.Uri) {
			const pathParts = uri.path.split('/');
			console.log(uri.path);
			//Create output channel
			let orange = vscode.window.createOutputChannel("orange");

			//Write to output.
			orange.appendLine("TEST");
			orange.appendLine(JSON.stringify(pathParts));
			if (pathParts[1] == 'base64') {
				const result = await processXmlText(atob(pathParts[2]));
				vscode.workspace.openTextDocument({
					language: 'xml',
					content: result
				})
			}
		}
	});

	let disposable = vscode.commands.registerCommand('processCXF.processPayloadXML', async function () {
		// Get the active text editor
		let editor = vscode.window.activeTextEditor;

		if (editor) {
			let document = editor.document;
			const selection = editor.selection.isEmpty ? new vscode.Selection(
				document.positionAt(0),
				document.positionAt(document.getText().length)
			) : editor.selection;

			const updated = await processXmlText(document.getText(selection));
			await editor.edit(editBuilder => {
				editBuilder.replace(selection, updated);
			});
			
			// change the language of the document
			document = await vscode.languages.setTextDocumentLanguage(editor.document, 'cxf');
			
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
        async provideDocumentFormattingEdits(document: vscode.TextDocument): Promise<vscode.TextEdit[]> {
			const selection = new vscode.Selection(
				document.positionAt(0),
				document.positionAt(document.getText().length)
			);
			const updated = await processXmlText(document.getText(selection));
			return [vscode.TextEdit.replace(selection, updated)];
        }
    });

	context.subscriptions.push(disposable);
}