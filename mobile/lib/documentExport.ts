import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Alert, Platform } from 'react-native';

type ExportOpts = {
  html: string;
  dialogTitle: string;
  /** Título da janela no browser (imprimir → Salvar como PDF). */
  webDocumentTitle?: string;
};

/**
 * Exporta HTML como PDF: no browser abre diálogo de impressão (Ctrl+P → PDF);
 * no telemóvel gera ficheiro via expo-print e partilha.
 */
export async function exportHtmlDocument(opts: ExportOpts): Promise<{ uri?: string }> {
  if (Platform.OS === 'web') {
    if (typeof globalThis.window === 'undefined') {
      throw new Error('window_unavailable');
    }
    const w = globalThis.window.open('', '_blank');
    if (!w) {
      Alert.alert(
        opts.dialogTitle,
        'Permita pop-ups neste site para abrir a pré-visualização e use Imprimir → Guardar como PDF.',
      );
      throw new Error('popup_blocked');
    }
    w.document.open();
    w.document.write(opts.html);
    w.document.title = opts.webDocumentTitle ?? opts.dialogTitle;
    w.document.close();
    w.focus();
    globalThis.setTimeout(() => {
      w.print();
    }, 350);
    return {};
  }

  const { uri } = await Print.printToFileAsync({ html: opts.html });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: opts.dialogTitle });
  }
  return { uri };
}
