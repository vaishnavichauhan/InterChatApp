import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Alert,
  TouchableOpacity,
  Linking,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as XLSX from 'xlsx';
import mammoth from 'mammoth';
import { colors, fontSizes, fontWeights, spacing, borderRadius, shadows } from '../../theme';
import { AppHeader } from '../../components/common/AppHeader';
import { AppButton } from '../../components/common/AppButton';
import {
  FileIcon,
  DownloadIcon,
  SearchIcon,
  LockIcon,
  AlertCircleIcon,
  EyeIcon,
  CheckIcon,
} from '../../components/icons/SvgIcons';
import { formatFileSize, getFileCategory } from '../../utils/formatters';
import { resolveFileUrl } from '../../config/api';
import { useAuthStore, isDeviceDownloadAllowed } from '../../store/authStore';
import { WatermarkOverlay } from '../../components/common/WatermarkOverlay';

const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  const chunkSize = 8192;
  for (let i = 0; i < len; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, len));
    binary += String.fromCharCode.apply(null, chunk as unknown as number[]);
  }
  const globalBtoa = (globalThis as any)?.btoa;
  if (typeof globalBtoa === 'function') {
    return globalBtoa(binary);
  }
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let result = '';
  let i = 0;
  while (i < binary.length) {
    const a = binary.charCodeAt(i++);
    const b = binary.charCodeAt(i++);
    const c = binary.charCodeAt(i++);
    result += chars[a >> 2];
    result += chars[((a & 3) << 4) | (b >> 4)];
    result += isNaN(b) ? '=' : chars[((b & 15) << 2) | (c >> 6)];
    result += isNaN(b) || isNaN(c) ? '=' : chars[c & 63];
  }
  return result;
};

interface FileViewerScreenProps {
  route: any;
  navigation: any;
}

export const FileViewerScreen: React.FC<FileViewerScreenProps> = ({
  route,
  navigation,
}) => {
  const { file } = route.params || {};
  const { width, height } = useWindowDimensions();

  const token = useAuthStore((state) => state.token);
  const permissions = useAuthStore((state) => state.permissions);
  const user = useAuthStore((state) => state.user);

  const canView = permissions?.canView !== false;
  const isDevAllowed = isDeviceDownloadAllowed(user);
  const canDownload = Boolean(permissions?.canDownload && isDevAllowed);

  // Document parsing states
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Text & Code state
  const [textContent, setTextContent] = useState<string | null>(null);

  // PDF Base64 state for reliable in-app WebView rendering
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);

  // Word (.docx) HTML state
  const [wordHtml, setWordHtml] = useState<string | null>(null);

  // Excel state
  const [excelSheets, setExcelSheets] = useState<string[]>([]);
  const [activeSheetIndex, setActiveSheetIndex] = useState(0);
  const [rawWorkbook, setRawWorkbook] = useState<any>(null);
  const [excelData, setExcelData] = useState<any[][]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  if (!file) {
    return (
      <View style={styles.container}>
        <AppHeader title="File Viewer" showBack onBack={() => navigation.goBack()} />
        <View style={styles.center}>
          <Text style={styles.errorText}>No file information provided.</Text>
        </View>
      </View>
    );
  }

  const fileName = file.original_name || file.name || file.originalName || 'Document';
  const fileId = file.id || file.attachmentId;
  const mimeType = (file.mime_type || file.type || file.fileType || '').toLowerCase();
  const fileSize = file.file_size || file.size || 0;
  const category = getFileCategory(fileName, mimeType);

  const ext = (fileName.split('.').pop() || '').toLowerCase();

  const isImage = category === 'image' || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(ext);
  const isPdf = ext === 'pdf' || mimeType.includes('pdf');
  const isDocx = ext === 'docx' || mimeType.includes('wordprocessingml');
  const isDoc = ext === 'doc' || mimeType.includes('msword');
  const isWord = isDocx || isDoc;
  const isExcel = ['xlsx', 'xls', 'csv', 'tsv', 'ods'].includes(ext) || mimeType.includes('spreadsheet') || mimeType.includes('excel');
  const isText = ['txt', 'json', 'log', 'md', 'xml', 'html', 'css', 'js', 'jsx', 'ts', 'tsx', 'py', 'sql', 'env', 'yml', 'yaml', 'ini', 'sh', 'bat'].includes(ext) || mimeType.startsWith('text/');

  const viewUrl = resolveFileUrl(`/api/chat/files/${fileId}/view?token=${encodeURIComponent(token || '')}`);



  // Fetch & Parse Document Data
  useEffect(() => {
    let isMounted = true;

    if (!canView) {
      setIsLoading(false);
      return;
    }

    if (isImage) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setTextContent(null);
    setWordHtml(null);
    setExcelData([]);
    setExcelSheets([]);
    setSearchQuery('');

    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

    // 1. Text & Code files
    if (isText && !isPdf && !isExcel && !isWord) {
      fetch(viewUrl, { headers })
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch file`);
          return res.text();
        })
        .then((text) => {
          if (isMounted) setTextContent(text);
        })
        .catch((err) => {
          if (isMounted) setErrorMsg('Failed to load text preview.');
        })
        .finally(() => {
          if (isMounted) setIsLoading(false);
        });
      return () => {
        isMounted = false;
      };
    }

    // 2. Excel spreadsheets (.xlsx, .xls, .csv)
    if (isExcel) {
      fetch(viewUrl, { headers })
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch spreadsheet`);
          return res.arrayBuffer();
        })
        .then((arrayBuffer) => {
          if (!isMounted) return;
          try {
            const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });
            setRawWorkbook(workbook);
            const sheets = workbook.SheetNames || [];
            setExcelSheets(sheets);
            if (sheets.length > 0) {
              setActiveSheetIndex(0);
              const firstSheet = workbook.Sheets[sheets[0]];
              const rows = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: '' }) as any[][];
              setExcelData(rows);
            }
          } catch (parseErr) {
            // Fallback for CSV text
            try {
              let text = '';
              if (typeof (globalThis as any).TextDecoder !== 'undefined') {
                text = new (globalThis as any).TextDecoder().decode(arrayBuffer);
              } else {
                const uint8 = new Uint8Array(arrayBuffer);
                for (let i = 0; i < uint8.length; i++) {
                  text += String.fromCharCode(uint8[i]);
                }
              }
              const lines = text
                .split(/\r?\n/)
                .filter((r: string) => r.trim().length > 0)
                .map((r: string) => r.split(','));
              if (lines.length > 0) {
                setExcelSheets(['Data']);
                setActiveSheetIndex(0);
                setExcelData(lines);
              } else {
                setErrorMsg('Could not parse spreadsheet data.');
              }
            } catch (e) {
              setErrorMsg('Could not parse spreadsheet data.');
            }
          }
        })
        .catch((err) => {
          if (isMounted) setErrorMsg('Failed to load spreadsheet for in-app view.');
        })
        .finally(() => {
          if (isMounted) setIsLoading(false);
        });
      return () => {
        isMounted = false;
      };
    }

    // 3. Word Documents (.docx / .doc)
    if (isWord) {
      fetch(viewUrl, { headers })
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch document`);
          return res.arrayBuffer();
        })
        .then(async (arrayBuffer) => {
          if (!isMounted) return;
          if (isDocx) {
            try {
              const result = await mammoth.convertToHtml({ arrayBuffer });
              if (result.value && result.value.trim().length > 0) {
                setWordHtml(result.value);
              } else {
                setWordHtml('<p style="color:#94a3b8; font-style:italic; text-align:center;">This Word document contains no visible text.</p>');
              }
            } catch (err) {
              try {
                const raw = await mammoth.extractRawText({ arrayBuffer });
                if (raw.value && raw.value.trim().length > 0) {
                  const paras = raw.value
                    .split(/\n\n+/)
                    .map((p) => `<p style="margin-bottom:12px; line-height:1.6;">${p.replace(/\n/g, '<br/>')}</p>`)
                    .join('');
                  setWordHtml(paras);
                } else {
                  setErrorMsg('Could not render Word document in-app preview.');
                }
              } catch (fallbackErr) {
                setErrorMsg('Could not parse Word document content.');
              }
            }
          } else {
            // Legacy .doc text extraction
            try {
              const bytes = new Uint8Array(arrayBuffer);
              let text = '';
              for (let i = 0; i < bytes.length; i++) {
                const c = bytes[i];
                if ((c >= 32 && c <= 126) || c === 10 || c === 13) {
                  text += String.fromCharCode(c);
                } else if (text.length > 0 && text[text.length - 1] !== '\n') {
                  text += ' ';
                }
              }
              const cleaned = text.replace(/ {2,}/g, ' ').trim();
              const paragraphs = cleaned
                .split(/[\r\n]+/)
                .filter((p) => p.trim().length > 15)
                .map((p) => `<p style="margin-bottom:12px; line-height:1.6;">${p}</p>`)
                .join('');
              if (paragraphs.length > 0) {
                setWordHtml(paragraphs);
              } else {
                setWordHtml('<p style="color:#94a3b8;">Legacy Word document (.doc) loaded.</p>');
              }
            } catch (docErr) {
              setErrorMsg('Could not render legacy .doc preview.');
            }
          }
        })
        .catch(() => {
          if (isMounted) setErrorMsg('Failed to load Word document.');
        })
        .finally(() => {
          if (isMounted) setIsLoading(false);
        });
      return () => {
        isMounted = false;
      };
    }

    // 4. PDFs: fetch bytes and convert to Base64 for offline/CORS-safe in-app rendering
    if (isPdf) {
      setPdfBase64(null);
      fetch(viewUrl, { headers })
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch PDF`);
          return res.arrayBuffer();
        })
        .then((arrayBuffer) => {
          if (!isMounted) return;
          const base64 = arrayBufferToBase64(arrayBuffer);
          setPdfBase64(base64);
        })
        .catch((err) => {
          if (isMounted) {
            console.warn('In-app PDF fetch warning:', err);
            // Fallback: let pdf.js attempt direct viewUrl
            setPdfBase64('');
          }
        })
        .finally(() => {
          if (isMounted) setIsLoading(false);
        });
      return () => {
        isMounted = false;
      };
    } else {
      setIsLoading(false);
    }
  }, [viewUrl, isImage, isText, isExcel, isWord, isDocx, isPdf, canView, token]);

  const handleDownload = async () => {
    if (!canDownload) {
      Alert.alert('Download Restricted', 'Your account or device policy restricts downloading files.');
      return;
    }
    const downloadUrl = resolveFileUrl(`/api/chat/files/${fileId}/download?token=${encodeURIComponent(token || '')}`);
    try {
      await Linking.openURL(downloadUrl);
    } catch (err: any) {
      console.warn('Failed to open download url', err);
      Alert.alert('Download Error', 'Could not initiate file download.');
    }
  };

  const handleSheetChange = (index: number) => {
    setActiveSheetIndex(index);
    if (rawWorkbook && excelSheets[index]) {
      const sheet = rawWorkbook.Sheets[excelSheets[index]];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as any[][];
      setExcelData(rows);
    }
  };

  // Filter spreadsheet rows
  const filteredExcelData = useMemo(() => {
    if (!searchQuery.trim()) return excelData;
    const q = searchQuery.toLowerCase().trim();
    return excelData.filter((row, idx) => {
      if (idx === 0) return true; // keep header
      return row.some((cell) => String(cell || '').toLowerCase().includes(q));
    });
  }, [excelData, searchQuery]);

  // Filter text content
  const filteredTextLines = useMemo(() => {
    if (!textContent) return [];
    const lines = textContent.split(/\r?\n/);
    if (!searchQuery.trim()) return lines;
    const q = searchQuery.toLowerCase().trim();
    return lines.filter((line) => line.toLowerCase().includes(q));
  }, [textContent, searchQuery]);

  // HTML template for in-app PDF rendering via Mozilla PDF.js
  const pdfHtml = useMemo(() => {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=4.0, user-scalable=yes">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #0f172a;
      color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      padding: 16px 10px 80px;
      display: flex;
      flex-direction: column;
      align-items: center;
      min-height: 100vh;
    }
    #loading {
      padding: 60px 20px;
      text-align: center;
      color: #94a3b8;
      font-size: 14px;
      font-weight: 500;
    }
    .spinner {
      width: 36px;
      height: 36px;
      border: 3px solid rgba(255,255,255,0.15);
      border-top-color: #3b82f6;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 16px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .page-wrap {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-bottom: 20px;
      width: 100%;
      max-width: 800px;
    }
    .page-badge {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.5px;
      color: #94a3b8;
      background: #1e293b;
      padding: 4px 14px;
      border-radius: 9999px;
      margin-bottom: 8px;
      border: 1px solid #334155;
    }
    canvas {
      width: 100% !important;
      height: auto !important;
      max-width: 100%;
      border-radius: 6px;
      box-shadow: 0 8px 20px -4px rgba(0, 0, 0, 0.6);
      background: #ffffff;
    }
    .error-box {
      background: rgba(239, 68, 68, 0.12);
      border: 1px solid rgba(239, 68, 68, 0.3);
      border-radius: 12px;
      padding: 24px 16px;
      text-align: center;
      max-width: 360px;
      margin: 40px auto;
    }
  </style>
</head>
<body>
  <div id="loading">
    <div class="spinner"></div>
    <div id="loading-msg">Rendering PDF pages...</div>
  </div>
  <div id="pages-container" style="width: 100%; display: flex; flex-direction: column; align-items: center;"></div>

  <script>
    (function() {
      var base64Data = "${pdfBase64 || ''}";

      function renderPdf() {
        if (!window.pdfjsLib) {
          document.getElementById('loading').innerHTML = '<div class="error-box"><div style="color:#f87171;font-weight:bold;margin-bottom:6px;">PDF Engine Unavailable</div><div style="font-size:12px;color:#94a3b8;">Please check network connection and try again.</div></div>';
          return;
        }

        try {
          pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        } catch(e) {}

        var loadingTask;
        if (base64Data && base64Data.length > 0) {
          try {
            var rawData = atob(base64Data);
            var bytes = new Uint8Array(rawData.length);
            for (var i = 0; i < rawData.length; i++) {
              bytes[i] = rawData.charCodeAt(i);
            }
            loadingTask = pdfjsLib.getDocument({ data: bytes });
          } catch(convErr) {
            loadingTask = pdfjsLib.getDocument("${viewUrl}");
          }
        } else {
          loadingTask = pdfjsLib.getDocument("${viewUrl}");
        }

        loadingTask.promise.then(function(pdf) {
          document.getElementById('loading').style.display = 'none';
          var container = document.getElementById('pages-container');

          for (var pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            (function(num) {
              pdf.getPage(num).then(function(page) {
                var viewport = page.getViewport({ scale: 2.0 });
                var wrap = document.createElement('div');
                wrap.className = 'page-wrap';

                var badge = document.createElement('div');
                badge.className = 'page-badge';
                badge.textContent = 'PAGE ' + num + ' OF ' + pdf.numPages;

                var canvas = document.createElement('canvas');
                var context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;

                var renderContext = {
                  canvasContext: context,
                  viewport: viewport
                };
                page.render(renderContext);

                wrap.appendChild(badge);
                wrap.appendChild(canvas);
                container.appendChild(wrap);
              });
            })(pageNum);
          }
        }).catch(function(err) {
          document.getElementById('loading').innerHTML = '<div class="error-box"><div style="color:#f87171;font-weight:bold;margin-bottom:6px;">Unable to load PDF document</div><div style="font-size:12px;color:#94a3b8;">' + (err.message || 'The file may be corrupted or inaccessible.') + '</div></div>';
        });
      }

      if (window.pdfjsLib) {
        renderPdf();
      } else {
        window.addEventListener('load', renderPdf);
        setTimeout(function() {
          if (document.getElementById('loading').style.display !== 'none' && !document.getElementById('pages-container').hasChildNodes()) {
            renderPdf();
          }
        }, 1200);
      }
    })();
  </script>
</body>
</html>`;
  }, [viewUrl, pdfBase64]);

  // HTML template for Word document preview
  const formattedWordHtml = useMemo(() => {
    if (!wordHtml) return '';
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=3.0, user-scalable=yes">
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 20px 16px 60px;
      background: #0f172a;
      display: flex;
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Georgia, serif;
    }
    .paper {
      background: #ffffff;
      color: #1e293b;
      padding: 32px 24px;
      border-radius: 12px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.4);
      width: 100%;
      max-width: 800px;
      line-height: 1.7;
      font-size: 15px;
    }
    h1 { font-size: 22px; font-weight: 800; color: #0f172a; margin-top: 0; margin-bottom: 16px; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; }
    h2 { font-size: 18px; font-weight: 700; color: #1e293b; margin-top: 24px; margin-bottom: 12px; }
    h3 { font-size: 16px; font-weight: 600; color: #334155; margin-top: 20px; margin-bottom: 8px; }
    p { margin-top: 0; margin-bottom: 14px; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px; }
    th, td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; }
    th { background: #f1f5f9; font-weight: 600; color: #0f172a; }
    ul, ol { margin-top: 0; padding-left: 24px; margin-bottom: 14px; }
    li { margin-bottom: 6px; }
  </style>
</head>
<body>
  <div class="paper">
    ${wordHtml}
  </div>
</body>
</html>`;
  }, [wordHtml]);

  // RESTRICTED VIEW PERMISSION SCREEN
  if (!canView) {
    return (
      <View style={styles.container}>
        <AppHeader title="Restricted Document" showBack onBack={() => navigation.goBack()} />
        <View style={styles.restrictedContainer}>
          <View style={styles.restrictedIconBox}>
            <LockIcon size={44} color="#ef4444" />
          </View>
          <Text style={styles.restrictedTitle}>Document View Restricted</Text>
          <Text style={styles.restrictedDesc}>
            Your security role policy does not permit previewing confidential documents inside this workspace.
          </Text>
          <AppButton
            title="Return to Chat"
            onPress={() => navigation.goBack()}
            size="md"
            style={{ width: 220, marginTop: spacing.xl }}
          />
        </View>
        <WatermarkOverlay force />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader
        title={fileName}
        subtitle={`${formatFileSize(fileSize)} • ${category.toUpperCase()}`}
        showBack
        onBack={() => navigation.goBack()}
        rightAction={
          canDownload ? (
            <TouchableOpacity
              onPress={handleDownload}
              style={styles.headerDownloadBtn}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <DownloadIcon size={20} color={colors.primary} />
            </TouchableOpacity>
          ) : <></>
        }
      />

      {/* Main Content Area */}
      <View style={styles.content}>
        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading document in-app preview...</Text>
            <Text style={styles.loadingSubtext}>Confidential In-App Secure Viewer</Text>
          </View>
        ) : errorMsg ? (
          <View style={styles.center}>
            <View style={styles.errorIconBox}>
              <AlertCircleIcon size={36} color={colors.danger} />
            </View>
            <Text style={styles.errorTitle}>{errorMsg}</Text>
            <Text style={styles.errorSub}>The document could not be rendered for direct in-app preview.</Text>
            {canDownload ? (
              <AppButton
                title="Download File"
                onPress={handleDownload}
                size="md"
                style={{ width: 200, marginTop: spacing.lg }}
              />
            ) : null}
          </View>
        ) : isImage ? (
          /* 1. IMAGE VIEWER */
          <View style={styles.imageContainer}>
            <Image source={{ uri: viewUrl }} style={styles.image} resizeMode="contain" />
            {canDownload && (
              <TouchableOpacity
                style={styles.floatingDownloadBtn}
                onPress={handleDownload}
                activeOpacity={0.8}
              >
                <DownloadIcon size={18} color="#ffffff" />
                <Text style={styles.floatingDownloadText}>Download Photo</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : isPdf ? (
          /* 2. IN-APP PDF VIEWER */
          <View style={styles.fullViewerWrap}>
            <WebView
              source={{ html: pdfHtml, baseUrl: 'https://cdnjs.cloudflare.com' }}
              style={styles.webView}
              originWhitelist={['*']}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              allowFileAccess={true}
              allowFileAccessFromFileURLs={true}
              allowUniversalAccessFromFileURLs={true}
              mixedContentMode="always"
              scalesPageToFit={true}
              startInLoadingState={true}
              renderLoading={() => (
                <View style={styles.center}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={styles.loadingText}>Rendering PDF pages...</Text>
                </View>
              )}
            />
          </View>
        ) : isWord ? (
          /* 3. IN-APP WORD DOCUMENT VIEWER */
          <View style={styles.fullViewerWrap}>
            {wordHtml ? (
              <WebView
                source={{ html: formattedWordHtml, baseUrl: 'https://localhost' }}
                style={styles.webView}
                originWhitelist={['*']}
                scalesPageToFit={true}
              />
            ) : (
              <ScrollView contentContainerStyle={styles.textContainer}>
                <View style={styles.wordPaper}>
                  <Text style={styles.wordTitle}>{fileName}</Text>
                  <Text style={styles.textContent}>
                    {wordHtml?.replace(/<[^>]+>/g, ' ') || 'No previewable text.'}
                  </Text>
                </View>
              </ScrollView>
            )}
          </View>
        ) : isExcel ? (
          /* 4. IN-APP EXCEL SPREADSHEET VIEWER */
          <View style={styles.spreadsheetContainer}>
            {/* Sheet Switcher Tabs */}
            {excelSheets.length > 1 && (
              <View style={styles.sheetsBar}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {excelSheets.map((sheet, idx) => (
                    <TouchableOpacity
                      key={sheet + idx}
                      style={[styles.sheetTab, activeSheetIndex === idx && styles.sheetTabActive]}
                      onPress={() => handleSheetChange(idx)}
                    >
                      <Text
                        style={[
                          styles.sheetTabText,
                          activeSheetIndex === idx && styles.sheetTabTextActive,
                        ]}
                      >
                        {sheet}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Filter Search Bar */}
            <View style={styles.searchBarWrap}>
              <SearchIcon size={16} color="#94a3b8" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search spreadsheet cells..."
                placeholderTextColor="#64748b"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            {/* Scrollable Spreadsheet Table */}
            <ScrollView horizontal showsHorizontalScrollIndicator={true} style={styles.tableScrollX}>
              <ScrollView showsVerticalScrollIndicator={true} style={styles.tableScrollY}>
                <View style={styles.table}>
                  {filteredExcelData.map((row, rIdx) => {
                    const isHeader = rIdx === 0;
                    return (
                      <View
                        key={`r_${rIdx}`}
                        style={[styles.tableRow, isHeader && styles.tableHeaderRow]}
                      >
                        <Text style={[styles.rowIndexCell, isHeader && styles.tableHeaderCell]}>
                          {isHeader ? '#' : rIdx}
                        </Text>
                        {row.map((cell, cIdx) => (
                          <Text
                            key={`c_${rIdx}_${cIdx}`}
                            style={[styles.tableCell, isHeader && styles.tableHeaderCell]}
                            numberOfLines={2}
                          >
                            {String(cell !== undefined && cell !== null ? cell : '')}
                          </Text>
                        ))}
                      </View>
                    );
                  })}
                </View>
              </ScrollView>
            </ScrollView>
          </View>
        ) : isText ? (
          /* 5. IN-APP TEXT / CODE VIEWER */
          <View style={styles.textViewerWrap}>
            <View style={styles.searchBarWrap}>
              <SearchIcon size={16} color="#94a3b8" />
              <TextInput
                style={styles.searchInput}
                placeholder="Filter text lines..."
                placeholderTextColor="#64748b"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
            <ScrollView style={styles.textScroll} showsVerticalScrollIndicator={true}>
              <View style={styles.codeContainer}>
                {filteredTextLines.map((line, idx) => (
                  <View key={`line_${idx}`} style={styles.codeLine}>
                    <Text style={styles.lineNum}>{idx + 1}</Text>
                    <Text style={styles.lineText}>{line || ' '}</Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        ) : (
          /* 6. GENERIC DOCUMENT SUMMARY */
          <View style={styles.docPlaceholder}>
            <View style={styles.docIconCircle}>
              <FileIcon size={48} color={colors.primary} />
            </View>
            <Text style={styles.docTitle} numberOfLines={2}>
              {fileName}
            </Text>
            <Text style={styles.docSize}>{formatFileSize(fileSize)}</Text>
            <View style={styles.securityPill}>
              <Text style={styles.securityText}>🛡️ Protected Enterprise Document</Text>
            </View>
            {canDownload ? (
              <AppButton
                title="Download Document"
                onPress={handleDownload}
                size="md"
                style={styles.downloadBtn}
              />
            ) : (
              <Text style={styles.restrictedText}>
                🔒 Local download restricted by administrator policy
              </Text>
            )}
          </View>
        )}
      </View>

      {/* Screen Watermarking Protection Always Present */}
      <WatermarkOverlay force />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  content: {
    flex: 1,
    position: 'relative',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    color: '#e2e8f0',
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
    marginTop: spacing.md,
  },
  loadingSubtext: {
    color: '#64748b',
    fontSize: fontSizes.xs,
    marginTop: 4,
  },
  errorText: {
    color: '#ffffff',
    fontSize: fontSizes.base,
  },
  errorIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  errorTitle: {
    fontSize: fontSizes.md,
    fontWeight: fontWeights.bold,
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 6,
  },
  errorSub: {
    fontSize: fontSizes.xs,
    color: '#94a3b8',
    textAlign: 'center',
    maxWidth: 280,
  },

  /* Restricted Permission Screen */
  restrictedContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
  },
  restrictedIconBox: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  restrictedTitle: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.extrabold,
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  restrictedDesc: {
    fontSize: fontSizes.sm,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 300,
  },

  /* Image View */
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },

  /* Full Viewer (PDF / Word WebView) */
  fullViewerWrap: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  webView: {
    flex: 1,
    backgroundColor: '#0f172a',
  },

  /* Word Paper Fallback */
  textContainer: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  wordPaper: {
    backgroundColor: '#ffffff',
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 700,
    ...shadows.md,
  },
  wordTitle: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.extrabold,
    color: '#0f172a',
    marginBottom: spacing.md,
    borderBottomWidth: 1.5,
    borderBottomColor: '#e2e8f0',
    paddingBottom: spacing.sm,
  },

  /* Excel Spreadsheet View */
  spreadsheetContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  sheetsBar: {
    backgroundColor: '#1e293b',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    paddingHorizontal: spacing.sm,
  },
  sheetTab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    marginRight: spacing.xs,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  sheetTabActive: {
    borderBottomColor: colors.primary,
  },
  sheetTabText: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.semibold,
    color: '#94a3b8',
  },
  sheetTabTextActive: {
    color: '#ffffff',
    fontWeight: fontWeights.bold,
  },
  searchBarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    paddingHorizontal: spacing.md,
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: '#334155',
  },
  searchInput: {
    flex: 1,
    height: 38,
    color: '#ffffff',
    fontSize: fontSizes.xs,
    paddingLeft: spacing.sm,
  },
  tableScrollX: {
    flex: 1,
  },
  tableScrollY: {
    flex: 1,
  },
  table: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    margin: spacing.sm,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tableHeaderRow: {
    backgroundColor: '#f1f5f9',
    borderBottomWidth: 2,
    borderBottomColor: '#cbd5e1',
  },
  rowIndexCell: {
    width: 44,
    padding: spacing.xs + 2,
    fontSize: 11,
    fontWeight: fontWeights.bold,
    color: '#64748b',
    backgroundColor: '#f8fafc',
    borderRightWidth: 1,
    borderRightColor: '#e2e8f0',
    textAlign: 'center',
  },
  tableCell: {
    width: 140,
    padding: spacing.xs + 2,
    fontSize: 12,
    color: '#1e293b',
    borderRightWidth: 1,
    borderRightColor: '#e2e8f0',
  },
  tableHeaderCell: {
    fontWeight: fontWeights.bold,
    color: '#0f172a',
    fontSize: 12,
  },

  /* Text & Code View */
  textViewerWrap: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  textScroll: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  codeContainer: {
    backgroundColor: '#1e293b',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: '#334155',
  },
  codeLine: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 1,
  },
  lineNum: {
    width: 36,
    color: '#64748b',
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    textAlign: 'right',
    paddingRight: spacing.sm,
    userSelect: 'none',
  },
  lineText: {
    flex: 1,
    color: '#e2e8f0',
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  textContent: {
    fontSize: fontSizes.sm,
    color: '#334155',
    lineHeight: 22,
  },

  /* Generic Info Box / Fallback */
  docInfoBox: {
    padding: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    padding: spacing.xxl,
    borderRadius: borderRadius.xxl,
    maxWidth: 320,
    width: '100%',
    alignSelf: 'center',
    marginTop: spacing.xxl,
  },
  docIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primarySubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  docTitle: {
    fontSize: fontSizes.md,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 4,
  },
  docSize: {
    fontSize: fontSizes.sm,
    color: colors.textMuted,
    marginBottom: spacing.lg,
  },
  securityPill: {
    backgroundColor: colors.surfaceSubtle,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    marginBottom: spacing.lg,
  },
  securityText: {
    fontSize: fontSizes.tiny,
    color: colors.textSecondary,
    fontWeight: fontWeights.semibold,
  },
  downloadBtn: {
    width: '100%',
  },
  headerDownloadBtn: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primarySubtle,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.primaryMuted,
  },
  floatingDownloadBtn: {
    position: 'absolute',
    bottom: spacing.xxl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  floatingDownloadText: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
    color: '#ffffff',
  },
  restrictedText: {
    fontSize: fontSizes.tiny,
    color: colors.danger,
    textAlign: 'center',
  },
});
