'use strict';
import { ExtensionContext, commands, window, languages, CodeLensProvider, Event, TextDocument, CancellationToken, ProviderResult, CodeLens, Range, Position, Selection, TextEditorRevealType } from 'vscode';

type Header = { level: number; text: string; range: Range; };

export function activate(context: ExtensionContext) {
    context.subscriptions.push(commands.registerTextEditorCommand('extension.jumpToHeader', async (textEditor, _, ...headers: Header[]) => {
        const text = await window.showQuickPick(headers.map(header => header.text));
        const header = headers.find(header => header.text === text)!;
        textEditor.selection = new Selection(header.range.start, header.range.end);
        textEditor.revealRange(header.range, TextEditorRevealType.AtTop);
    }));
    context.subscriptions.push(commands.registerTextEditorCommand('extension.jumpToTop', (textEditor) => {
        textEditor.selection = new Selection(new Position(0, 0), new Position(0, 0));
        textEditor.revealRange(textEditor.selection, TextEditorRevealType.AtTop);
    }));
    context.subscriptions.push(languages.registerCodeLensProvider({ language: 'markdown' }, new TocCodeLensProvider()));
}

class TocCodeLensProvider implements CodeLensProvider {
    onDidChangeCodeLenses?: Event<void> | undefined;

    provideCodeLenses(document: TextDocument, token: CancellationToken): ProviderResult<CodeLens[]> {
        const headers: Header[] = [];
        for (let index = 0; index < document.lineCount; index++) {
            const { text, range } = document.lineAt(index);
            const match = /^#{1,6}/.exec(text);
            if (match !== null) {
                const level = match[0].length;
                headers.push({ level, text, range });
            }
        }

        return headers.map(header => {
            if (header.level === 1) {
                return new CodeLens(header.range, { title: 'Jump to header', command: 'extension.jumpToHeader', arguments: headers });
            } else {
                return new CodeLens(header.range, { title: 'Jump to top', command: 'extension.jumpToTop' });
            }
        });
    }

    resolveCodeLens(codeLens: CodeLens, token: CancellationToken): ProviderResult<CodeLens> {
        return codeLens;
    }
}
