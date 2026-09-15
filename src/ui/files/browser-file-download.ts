type BrowserFileDownloadInput = {
  url: string;
  fileName: string;
};

function clickBrowserDownload(objectUrl: string, fileName: string) {
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = fileName;
  anchor.hidden = true;

  try {
    document.body.append(anchor);
    anchor.click();
  } finally {
    anchor.remove();
  }
}

export async function downloadBrowserFile({
  url,
  fileName,
}: BrowserFileDownloadInput): Promise<void> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`File download failed with status ${response.status}.`);
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);

  try {
    clickBrowserDownload(objectUrl, fileName);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
