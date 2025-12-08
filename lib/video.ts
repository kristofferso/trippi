export const generateVideoThumbnail = (file: File): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    const video = document.createElement("video");
    video.autoplay = false;
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = "anonymous"; // Sometimes helps with tainting issues, though usually not for local blobs

    const url = URL.createObjectURL(file);
    video.src = url;

    const cleanup = () => {
      URL.revokeObjectURL(url);
      video.remove();
      canvas.remove();
    };

    const timeoutId = setTimeout(() => {
      cleanup();
      reject(new Error("Thumbnail generation timed out"));
    }, 2000); // 2 seconds timeout

    video.onloadeddata = () => {
      video.currentTime = 0.1; // Capture at 0.1s to avoid black start frames
    };

    video.onseeked = () => {
      clearTimeout(timeoutId);
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        try {
          ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
          canvas.toBlob(
            (blob) => {
              cleanup();
              if (blob) resolve(blob);
              else reject(new Error("Thumbnail generation failed"));
            },
            "image/jpeg",
            0.7
          );
        } catch (e) {
          cleanup();
          reject(e);
        }
      } else {
        cleanup();
        reject(new Error("Canvas context failed"));
      }
    };

    video.onerror = (e) => {
      clearTimeout(timeoutId);
      cleanup();
      reject(e);
    };

    // Trigger load (important for iOS Safari)
    video.load();
  });
};
