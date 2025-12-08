export const generateVideoThumbnail = (file: File): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    const video = document.createElement("video");
    video.autoplay = false;
    video.muted = true;
    video.playsInline = true;
    video.src = URL.createObjectURL(file);

    video.onloadeddata = () => {
      video.currentTime = 0.1; // Capture at 0.1s to avoid black start frames
    };

    video.onseeked = () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error("Thumbnail generation failed"));
            URL.revokeObjectURL(video.src);
          },
          "image/jpeg",
          0.7
        );
      } else {
        reject(new Error("Canvas context failed"));
      }
    };

    video.onerror = (e) => {
      reject(e);
      URL.revokeObjectURL(video.src);
    };
  });
};

