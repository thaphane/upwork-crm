import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Typography,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  QrCode as QrCodeIcon,
  CloudUpload as CloudUploadIcon,
  CloudDownload as CloudDownloadIcon,
  FileDownload as FileDownloadIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import axios from 'axios';
import DataTable from '../../components/DataTable';
import { utils, read, writeFile } from 'xlsx';

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  inventory: number;
  qrCode?: string;
  customFields: Record<string, any>;
  scanHistory?: Array<{
    timestamp: Date;
    location?: string;
    scannedBy?: string;
  }>;
}

interface ProductFormData {
  name: string;
  description: string;
  price: number;
  category: string;
  inventory: number;
  customFields: Record<string, any>;
}

interface ImportRow {
  name: string;
  description: string;
  price: string | number;
  category: string;
  inventory: string | number;
}

const EXCEL_TEMPLATE = {
  name: '',
  description: '',
  price: 0,
  category: '',
  inventory: 0,
};

const initialFormData = {
  name: '',
  description: '',
  price: 0,
  category: '',
  inventory: 0,
  customFields: {},
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
];

export default function Products() {
  const [openDialog, setOpenDialog] = useState(false);
  const [openQRDialog, setOpenQRDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [scanHistoryDialogOpen, setScanHistoryDialogOpen] = useState(false);
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    price: 0,
    category: '',
    inventory: 0,
    customFields: {},
  });
  const [importError, setImportError] = useState<string>('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
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
    mutationFn: async (productId: string) => {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:5000/api/products/${productId}/qr`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      if (selectedProduct) {
        setSelectedProduct({ ...selectedProduct, qrCode: data.qrCode });
      }
    },
  });

  const importMutation = useMutation({
    mutationFn: async (products: ProductFormData[]) => {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:5000/api/products/bulk-import',
        { products },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setImportError('');
    },
    onError: (error: any) => {
      setImportError(error.response?.data?.error || 'Error importing products');
    },
  });

  const handleOpenDialog = (product?: Product) => {
    if (product) {
      setFormData({
        name: product.name,
        description: product.description,
        price: product.price,
        category: product.category,
        inventory: product.inventory,
        customFields: product.customFields,
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

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = utils.sheet_to_json(worksheet) as ImportRow[];

        // Validate and transform data
        const products = jsonData.map((row: ImportRow) => ({
          name: row.name,
          description: row.description,
          price: Number(row.price),
          category: row.category,
          inventory: Number(row.inventory),
          customFields: {},
        }));

        // Validate required fields
        const invalidProducts = products.filter(
          (p: ProductFormData) => !p.name || isNaN(p.price) || !p.category || isNaN(p.inventory)
        );

        if (invalidProducts.length > 0) {
          setImportError('Some products have invalid or missing data');
          return;
        }

        importMutation.mutate(products);
      } catch (error) {
        setImportError('Error reading Excel file');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleExportProducts = () => {
    if (!productsData?.data) return;

    const exportData = productsData.data.map((product: Product) => ({
      name: product.name,
      description: product.description,
      price: product.price,
      category: product.category,
      inventory: product.inventory,
    }));

    const worksheet = utils.json_to_sheet(exportData);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, 'Products');
    writeFile(workbook, 'products.xlsx');
  };

  const handleDownloadTemplate = () => {
    const worksheet = utils.json_to_sheet([EXCEL_TEMPLATE]);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, 'Template');
    writeFile(workbook, 'product_template.xlsx');
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Products</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<FileDownloadIcon />}
            onClick={handleDownloadTemplate}
          >
            Download Template
          </Button>
          <Button
            variant="outlined"
            startIcon={<CloudUploadIcon />}
            component="label"
          >
            Import Products
            <input
              type="file"
              hidden
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
            />
          </Button>
          <Button
            variant="outlined"
            startIcon={<CloudDownloadIcon />}
            onClick={handleExportProducts}
          >
            Export Products
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Add Product
          </Button>
        </Box>
      </Box>

      {importError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {importError}
        </Alert>
      )}

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