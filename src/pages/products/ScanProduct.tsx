import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import {
  Box,
  Container,
  Typography,
  Alert,
  Paper,
  CircularProgress,
  Button,
} from '@mui/material';
import {
  LocationOn as LocationIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import axios from 'axios';
import QRScanner from './QRScanner';

interface Location {
  latitude: number;
  longitude: number;
  accuracy: number;
  address?: string;
}

interface ScanResult {
  product: {
    _id: string;
    name: string;
    description: string;
    category: string;
  };
  scannedAt: string;
  location?: {
    latitude: number;
    longitude: number;
    accuracy: number;
    address?: string;
  };
}

export default function ScanProduct() {
  const navigate = useNavigate();
  const [error, setError] = useState<string>('');
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [location, setLocation] = useState<Location | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);

  useEffect(() => {
    getLocation();
  }, []);

  const getLocation = async () => {
    setLoadingLocation(true);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0,
        });
      });

      const { latitude, longitude, accuracy } = position.coords;
      
      // Get address using reverse geocoding
      try {
        const response = await axios.get(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
        );
        const address = response.data.display_name;
        setLocation({ latitude, longitude, accuracy, address });
      } catch (error) {
        // If reverse geocoding fails, still save coordinates
        setLocation({ latitude, longitude, accuracy });
      }
    } catch (error) {
      setError('Unable to get location. Please enable location services.');
    } finally {
      setLoadingLocation(false);
    }
  };

  const scanMutation = useMutation({
    mutationFn: async (productId: string) => {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `http://localhost:5000/api/products/${productId}/scan`,
        {
          location: location ? {
            ...location,
            timestamp: new Date().toISOString(),
          } : undefined,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    },
    onSuccess: (data) => {
      setScanResult(data);
    },
    onError: (error: any) => {
      setError(error.response?.data?.error || 'Error scanning product');
    },
  });

  const handleScan = (productId: string) => {
    if (!location && !loadingLocation) {
      getLocation();
    }
    scanMutation.mutate(productId);
  };

  const handleError = (error: string) => {
    setError(error);
  };

  const handleBack = () => {
    if (scanResult) {
      setScanResult(null);
    } else {
      navigate(-1);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={handleBack}
            sx={{ mr: 2 }}
          >
            Back
          </Button>
          <Typography variant="h4" align="center" sx={{ flex: 1 }}>
            Scan Product QR Code
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {loadingLocation && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Getting location...
          </Alert>
        )}

        {location && (
          <Alert severity="success" icon={<LocationIcon />} sx={{ mb: 2 }}>
            Location: {location.address || `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`}
          </Alert>
        )}

        {scanResult ? (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Product Found!
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1">
                {scanResult.product.name}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {scanResult.product.description}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Category: {scanResult.product.category}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Scanned at: {new Date(scanResult.scannedAt).toLocaleString()}
              </Typography>
              {scanResult.location && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="textSecondary">
                    Location: {scanResult.location.address || 
                      `${scanResult.location.latitude.toFixed(6)}, ${scanResult.location.longitude.toFixed(6)}`}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Accuracy: ±{Math.round(scanResult.location.accuracy)}m
                  </Typography>
                </Box>
              )}
            </Box>
            <Button
              variant="contained"
              onClick={() => setScanResult(null)}
              fullWidth
            >
              Scan Another Product
            </Button>
          </Paper>
        ) : (
          <Paper sx={{ p: 3 }}>
            <QRScanner onScan={handleScan} onError={handleError} />
            {!location && !loadingLocation && (
              <Button
                variant="outlined"
                startIcon={<LocationIcon />}
                onClick={getLocation}
                fullWidth
                sx={{ mt: 2 }}
              >
                Enable Location
              </Button>
            )}
          </Paper>
        )}
      </Box>
    </Container>
  );
} 