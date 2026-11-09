import { Platform, Share } from 'react-native';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';

export async function sharePaymentScreenshot(
  screenshotUri: string,
  personName?: string
): Promise<void> {
  if (!screenshotUri) return;

  const title = personName ? `Payment Screenshot - ${personName}` : 'Payment Screenshot';

  // 1. Web Platform
  if (Platform.OS === 'web') {
    try {
      if (typeof navigator !== 'undefined' && (navigator as any).share) {
        const response = await fetch(screenshotUri);
        const blob = await response.blob();
        const ext = blob.type.includes('png') ? 'png' : 'jpg';
        const file = new (window as any).File(
          [blob],
          `payment_screenshot_${Date.now()}.${ext}`,
          { type: blob.type || 'image/jpeg' }
        );

        if ((navigator as any).canShare && (navigator as any).canShare({ files: [file] })) {
          await (navigator as any).share({
            files: [file],
            title,
          });
          return;
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return; // User cancelled
      console.log('Web share aborted or unsupported, fallback to download:', err);
    }

    // Web Fallback: download the file
    try {
      const link = document.createElement('a');
      link.href = screenshotUri;
      link.download = `payment_screenshot_${(personName || 'record').replace(/\s+/g, '_')}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      if (typeof window !== 'undefined') {
        window.open(screenshotUri, '_blank');
      }
    }
    return;
  }

  // 2. Mobile (Android & iOS)
  try {
    const isAvailable = await Sharing.isAvailableAsync().catch(() => false);

    if (isAvailable) {
      let fileUri = screenshotUri;

      // Handle Base64 Data URI
      if (screenshotUri.startsWith('data:')) {
        const match = screenshotUri.match(/^data:(image\/[a-zA-Z0-9+]+);base64,(.+)$/);
        const mimeType = match ? match[1] : 'image/jpeg';
        const base64Data = match ? match[2] : screenshotUri.replace(/^data:[^;]+;base64,/, '');
        const ext = mimeType.includes('png') ? 'png' : 'jpg';
        fileUri = `${FileSystem.cacheDirectory || ''}payment_screenshot_${Date.now()}.${ext}`;

        await FileSystem.writeAsStringAsync(fileUri, base64Data, {
          encoding: FileSystem.EncodingType.Base64,
        });

        await Sharing.shareAsync(fileUri, {
          mimeType,
          dialogTitle: title,
        });
        return;
      }

      // Handle remote HTTP URL
      if (screenshotUri.startsWith('http://') || screenshotUri.startsWith('https://')) {
        const ext = screenshotUri.includes('.png') ? 'png' : 'jpg';
        fileUri = `${FileSystem.cacheDirectory || ''}payment_screenshot_${Date.now()}.${ext}`;
        const downloadRes = await FileSystem.downloadAsync(screenshotUri, fileUri);
        await Sharing.shareAsync(downloadRes.uri, {
          mimeType: ext === 'png' ? 'image/png' : 'image/jpeg',
          dialogTitle: title,
        });
        return;
      }

      // Already a local file URI
      await Sharing.shareAsync(fileUri, {
        mimeType: 'image/jpeg',
        dialogTitle: title,
      });
      return;
    }

    // Fallback: React Native built-in Share
    await Share.share({
      title,
      message: `${title}\n${screenshotUri}`,
      url: screenshotUri,
    });
  } catch (err: any) {
    if (err.name === 'AbortError') return;
    console.error('Error sharing screenshot:', err);
  }
}

