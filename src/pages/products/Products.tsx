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
  CircularProgress,
  Grid,
  Tooltip,
  IconButton,
} from '@mui/material';
import {
  Add as AddIcon,
  Upload as UploadIcon,
  Download as DownloadIcon,
  QrCode as QrCodeIcon,
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
}

interface ProductFormData {
  name: string;
  description: string;
  price: string;
  category: string;
  inventory: string;
}

export default function Products() {
  const [open, setOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    price: '',
    category: '',
    inventory: '',
  });

  const queryClient = useQueryClient();

  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: async () => {
      const response = await axios.get('http://localhost:5000/api/products', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      const response = await axios.post(
        'http://localhost:5000/api/products',
        {
          ...data,
          price: parseFloat(data.price),
          inventory: parseInt(data.inventory),
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      handleClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: ProductFormData & { id: string }) => {
      const response = await axios.put(
        `http://localhost:5000/api/products/${data.id}`,
        {
          ...data,
          price: parseFloat(data.price),
          inventory: parseInt(data.inventory),
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      handleClose();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (_id: string) => {
      await axios.delete(`http://localhost:5000/api/products/${_id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const generateQRMutation = useMutation({
    mutationFn: async (_id: string) => {
      const response = await axios.get(
        `http://localhost:5000/api/products/${_id}/qr`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }
      );
      return response.data;
    },
    onSuccess: (data, _id) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      // Open QR code in new window
      const win = window.open('', '_blank');
      win?.document.write(`<img src="${data.qrCode}" alt="QR Code" />`);
    },
  });

  const handleOpen = (product?: Product) => {
    if (product) {
      setSelectedProduct(product);
      setFormData({
        name: product.name,
        description: product.description,
        price: product.price.toString(),
        category: product.category,
        inventory: product.inventory.toString(),
      });
    } else {
      setSelectedProduct(null);
      setFormData({
        name: '',
        description: '',
        price: '',
        category: '',
        inventory: '',
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedProduct(null);
    setFormData({
      name: '',
      description: '',
      price: '',
      category: '',
      inventory: '',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedProduct) {
      updateMutation.mutate({ ...formData, id: selectedProduct._id });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const workbook = read(data, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = utils.sheet_to_json(worksheet);

      for (const row of jsonData) {
        await createMutation.mutateAsync(row as ProductFormData);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleExport = () => {
    if (!products) return;

    const worksheet = utils.json_to_sheet(products);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, 'Products');
    writeFile(workbook, 'products.xlsx');
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
    { id: 'category', label: 'Category', minWidth: 130 },
    { id: 'inventory', label: 'Inventory', minWidth: 100 },
  ];

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpen()}
          >
            Add Product
          </Button>
        </Grid>
        <Grid item>
          <input
            type="file"
            accept=".xlsx,.xls"
            style={{ display: 'none' }}
            id="import-file"
            onChange={handleImport}
          />
          <label htmlFor="import-file">
            <Button
              variant="outlined"
              component="span"
              startIcon={<UploadIcon />}
            >
              Import
            </Button>
          </label>
        </Grid>
        <Grid item>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleExport}
          >
            Export
          </Button>
        </Grid>
      </Grid>

      <DataTable
        columns={columns}
        rows={products ?? []}
        onEdit={handleOpen}
        onDelete={(row) => deleteMutation.mutate(row._id)}
        page={0}
        rowsPerPage={10}
        totalRows={products?.length ?? 0}
        onPageChange={() => {}}
        onRowsPerPageChange={() => {}}
      />

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedProduct ? 'Edit Product' : 'Add Product'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Name"
              fullWidth
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
            <TextField
              margin="dense"
              label="Description"
              fullWidth
              multiline
              rows={3}
              required
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
            <TextField
              margin="dense"
              label="Price"
              type="number"
              fullWidth
              required
              value={formData.price}
              onChange={(e) =>
                setFormData({ ...formData, price: e.target.value })
              }
            />
            <TextField
              margin="dense"
              label="Category"
              fullWidth
              required
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
            />
            <TextField
              margin="dense"
              label="Inventory"
              type="number"
              fullWidth
              required
              value={formData.inventory}
              onChange={(e) =>
                setFormData({ ...formData, inventory: e.target.value })
              }
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="submit" variant="contained">
              {selectedProduct ? 'Update' : 'Create'}
            </Button>
            {selectedProduct && (
              <Tooltip title="Generate QR Code">
                <IconButton
                  onClick={() => generateQRMutation.mutate(selectedProduct._id)}
                  color="primary"
                >
                  <QrCodeIcon />
                </IconButton>
              </Tooltip>
            )}
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
