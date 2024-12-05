import React, { useEffect, useRef, useState } from 'react';
import { Box, Button, Typography } from '@mui/material';
// @ts-ignore
import jsQR from 'jsqr';

interface QRScannerProps {
  onScan: (productId: string) => void;
  onError: (error: string) => void;
}

export default function QRScanner({ onScan, onError }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scanning, setScanning] = useState(false);

  const startScanning = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setScanning(true);
        scanQRCode();
      }
    } catch (error) {
      onError('Unable to access camera');
    }
  };

  const stopScanning = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      setScanning(false);
    }
  };

  const scanQRCode = () => {
    if (!scanning) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw current video frame
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

    // Scan for QR code
    const code = jsQR(imageData.data, imageData.width, imageData.height);
    
    if (code) {
      // Extract product ID from QR code data
      const productId = code.data.split('/').pop();
      if (productId) {
        stopScanning();
        onScan(productId);
        return;
      }
    }

    // Continue scanning if no QR code found
    requestAnimationFrame(scanQRCode);
  };

  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <Box sx={{ position: 'relative', width: '100%', maxWidth: 500, aspectRatio: '4/3' }}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
        <canvas
          ref={canvasRef}
          style={{
            display: 'none',
          }}
        />
        {scanning && (
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '200px',
              height: '200px',
              border: '2px solid #fff',
              boxShadow: '0 0 0 100vmax rgba(0, 0, 0, 0.5)',
            }}
          />
        )}
      </Box>
      <Button
        variant="contained"
        onClick={scanning ? stopScanning : startScanning}
        sx={{ minWidth: 200 }}
      >
        {scanning ? 'Stop Scanning' : 'Start Scanning'}
      </Button>
      {scanning && (
        <Typography variant="body2" color="textSecondary">
          Position the QR code within the frame
        </Typography>
      )}
    </Box>
  );
} 