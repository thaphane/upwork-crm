import React, { useState } from 'react';
import { Box, Typography } from '@mui/material';
import QRScanner from './QRScanner';
import axios from 'axios';

interface Location {
  latitude: number;
  longitude: number;
  timestamp: number;
}

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  inventory: number;
}

export default function ScanProduct() {
  const [scannedProduct, setScannedProduct] = useState<Product | null>(null);
  const [error, setError] = useState<string>('');
  const [location, setLocation] = useState<Location | null>(null);

  const handleScan = async (productId: string) => {
    try {
      // Get current location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setLocation({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              timestamp: position.timestamp,
            });
          },
          (error) => {
            console.error('Error getting location:', error);
          }
        );
      }

      // Fetch product details
      const response = await axios.get(
        `http://localhost:5000/api/products/${productId}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }
      );

      setScannedProduct(response.data);

      // Log scan
      await axios.post(
        `http://localhost:5000/api/products/scan/${productId}`,
        {
          location,
          timestamp: new Date().toISOString(),
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }
      );
    } catch (error) {
      setError('Failed to fetch product details');
      console.error('Scan error:', error);
    }
  };

  const handleError = (message: string) => {
    setError(message);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Scan Product QR Code
      </Typography>
      <QRScanner onScan={handleScan} onError={handleError} />
      {error && (
        <Typography variant="body1" color="error">
          {error}
        </Typography>
      )}
      {scannedProduct && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="h5" gutterBottom>
            {scannedProduct.name}
          </Typography>
          <Typography variant="body2" paragraph>
            {scannedProduct.description}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Typography variant="body1" sx={{ mr: 1 }}>
              Price: ${scannedProduct.price.toFixed(2)}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Typography variant="body1" sx={{ mr: 1 }}>
              Category: {scannedProduct.category}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="body1" sx={{ mr: 1 }}>
              Inventory: {scannedProduct.inventory} units
            </Typography>
          </Box>
          {location && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="caption" display="block">
                Scanned at: {new Date().toLocaleString()}
              </Typography>
              <Typography variant="caption" display="block">
                Location: {location.latitude}, {location.longitude}
              </Typography>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}
