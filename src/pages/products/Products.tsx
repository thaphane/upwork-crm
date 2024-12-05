import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Snackbar,
  Alert,
  Typography,
  IconButton,
  Card,
  CardContent,
  Grid,
} from '@mui/material';
import {
  Add as AddIcon,
  QrCode as QrCodeIcon,
} from '@mui/icons-material';
import axios from 'axios';
import DataTable from '../../components/DataTable';

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  inventory: number;
  qrCode?: string;
  createdAt: string;
}

interface ProductFormData {
  name: string;
  description: string;
  price: number;
  category: string;
  inventory: number;
}

const initialFormData: ProductFormData = {
  name: '',
  description: '',
  price: 0,
  category: '',
  inventory: 0,
};

const columns = [
  { id: 'name', label: 'Name', minWidth: 170 },
  { id: 'description', label: 'Description', minWidth: 200 },
  {
    id: 'price',
    label: 'Price',
    minWidth: 100,
    format: (value: number) => `$${value.toFixed(2)}`,
  },
  { id: 'category', label: 'Category', minWidth: 100 },
  { id: 'inventory', label: 'Inventory', minWidth: 100 },
  {
    id: 'createdAt',
    label: 'Created At',
    minWidth: 170,
    format: (value: string) => new Date(value).toLocaleDateString(),
  },
];

export default function Products() {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openDialog, setOpenDialog] = useState(false);
  const [openQRDialog, setOpenQRDialog] = useState(false);
  const [formData, setFormData] = useState<ProductFormData>(initialFormData);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  const queryClient = useQueryClient();

  const { data: productsData, isLoading } = useQuery({
    queryKey: ['products', page, rowsPerPage, searchQuery],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:5000/api/products?page=${page + 1}&limit=${rowsPerPage}&search=${searchQuery}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      return response.data;
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:5000/api/products', data, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      handleCloseDialog();
      showSnackbar('Product created successfully', 'success');
    },
    onError: (error: any) => {
      showSnackbar(error.response?.data?.error || 'Error creating product', 'error');
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ProductFormData }) => {
      const token = localStorage.getItem('token');
      const response = await axios.put(`http://localhost:5000/api/products/${id}`, data, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      handleCloseDialog();
      showSnackbar('Product updated successfully', 'success');
    },
    onError: (error: any) => {
      showSnackbar(error.response?.data?.error || 'Error updating product', 'error');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      showSnackbar('Product deleted successfully', 'success');
    },
    onError: (error: any) => {
      showSnackbar(error.response?.data?.error || 'Error deleting product', 'error');
    }
  });

  const generateQRMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/products/${id}/qr`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    },
    onSuccess: (data) => {
      if (selectedProduct) {
        setSelectedProduct({ ...selectedProduct, qrCode: data.qrCode });
      }
      showSnackbar('QR code generated successfully', 'success');
    },
    onError: (error: any) => {
      showSnackbar(error.response?.data?.error || 'Error generating QR code', 'error');
    }
  });

  const handleOpenDialog = (product?: Product) => {
    if (product) {
      setFormData({
        name: product.name,
        description: product.description,
        price: product.price,
        category: product.category,
        inventory: product.inventory,
      });
      setEditingId(product._id);
    } else {
      setFormData(initialFormData);
      setEditingId(null);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormData(initialFormData);
    setEditingId(null);
  };

  const handleOpenQRDialog = (product: Product) => {
    setSelectedProduct(product);
    setOpenQRDialog(true);
    if (!product.qrCode) {
      generateQRMutation.mutate(product._id);
    }
  };

  const handleCloseQRDialog = () => {
    setOpenQRDialog(false);
    setSelectedProduct(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (product: Product) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      deleteMutation.mutate(product._id);
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const renderQRDialog = () => (
    <Dialog open={openQRDialog} onClose={handleCloseQRDialog} maxWidth="sm" fullWidth>
      <DialogTitle>QR Code</DialogTitle>
      <DialogContent>
        {selectedProduct && (
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <Typography variant="h6" gutterBottom>
              {selectedProduct.name}
            </Typography>
            {selectedProduct.qrCode ? (
              <img
                src={selectedProduct.qrCode}
                alt="Product QR Code"
                style={{ maxWidth: '100%', height: 'auto' }}
              />
            ) : (
              <Typography>Generating QR code...</Typography>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCloseQRDialog}>Close</Button>
        {selectedProduct?.qrCode && (
          <Button
            onClick={() => {
              const link = document.createElement('a');
              link.href = selectedProduct.qrCode!;
              link.download = `qr-${selectedProduct.name}.png`;
              link.click();
            }}
            variant="contained"
          >
            Download
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Product
        </Button>
      </Box>

      <DataTable
        columns={columns}
        rows={productsData?.data || []}
        title="Products"
        onEdit={handleOpenDialog}
        onDelete={handleDelete}
        totalCount={productsData?.pagination?.total || 0}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={setPage}
        onRowsPerPageChange={setRowsPerPage}
        onSearch={setSearchQuery}
        additionalActions={(row: Product) => (
          <IconButton
            size="small"
            onClick={() => handleOpenQRDialog(row)}
            color="primary"
            title="Generate QR Code"
          >
            <QrCodeIcon />
          </IconButton>
        )}
      />

      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <form onSubmit={handleSubmit}>
          <DialogTitle>{editingId ? 'Edit Product' : 'Add Product'}</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Name"
              type="text"
              fullWidth
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <TextField
              margin="dense"
              label="Description"
              type="text"
              fullWidth
              required
              multiline
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
            <TextField
              margin="dense"
              label="Price"
              type="number"
              fullWidth
              required
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
              inputProps={{ min: 0, step: 0.01 }}
            />
            <TextField
              margin="dense"
              label="Category"
              select
              fullWidth
              required
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            >
              <MenuItem value="Electronics">Electronics</MenuItem>
              <MenuItem value="Clothing">Clothing</MenuItem>
              <MenuItem value="Books">Books</MenuItem>
              <MenuItem value="Other">Other</MenuItem>
            </TextField>
            <TextField
              margin="dense"
              label="Inventory"
              type="number"
              fullWidth
              required
              value={formData.inventory}
              onChange={(e) => setFormData({ ...formData, inventory: parseInt(e.target.value) })}
              inputProps={{ min: 0 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button type="submit" variant="contained">
              {editingId ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {renderQRDialog()}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
} 