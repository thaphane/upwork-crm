import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Alert,
  IconButton,
  Collapse,
  Grid,
  Paper,
} from '@mui/material';
import {
  Close as CloseIcon,
  LocalOffer as PriceIcon,
  Category as CategoryIcon,
  Inventory as InventoryIcon,
} from '@mui/icons-material';
import axios from 'axios';
import QRScanner from './QRScanner';

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
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Scan Product QR Code
            </Typography>
            <QRScanner onScan={handleScan} onError={handleError} />
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Collapse in={Boolean(error)}>
            <Alert
              severity="error"
              action={
                <IconButton
                  aria-label="close"
                  color="inherit"
                  size="small"
                  onClick={() => setError('')}
                >
                  <CloseIcon fontSize="inherit" />
                </IconButton>
              }
              sx={{ mb: 2 }}
            >
              {error}
            </Alert>
          </Collapse>

          {scannedProduct && (
            <Card>
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  {scannedProduct.name}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  paragraph
                >
                  {scannedProduct.description}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <PriceIcon sx={{ mr: 1 }} color="primary" />
                  <Typography>
                    Price: ${scannedProduct.price.toFixed(2)}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <CategoryIcon sx={{ mr: 1 }} color="primary" />
                  <Typography>Category: {scannedProduct.category}</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <InventoryIcon sx={{ mr: 1 }} color="primary" />
                  <Typography>
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
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>
    </Box>
  );
}
