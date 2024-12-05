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
  IconButton,
  Typography,
  Grid,
  Paper,
  Tooltip,
  CircularProgress,
  Collapse,
  Card,
  CardContent,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Note as NoteIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import axios from 'axios';
import DataTable from '../../components/DataTable';

interface Address {
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
}

interface Note {
  content: string;
  createdAt: string;
  createdBy?: string;
}

interface Customer {
  _id: string;
  fullName: string;
  companyName: string;
  email: string;
  phone: string;
  address: Address;
  notes: Note[];
  registrationDate: string;
}

interface CustomerFormData {
  fullName: string;
  companyName: string;
  email: string;
  phone: string;
  address: Address;
}

export default function Customers() {
  const [open, setOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [newNote, setNewNote] = useState('');
  const [formData, setFormData] = useState<CustomerFormData>({
    fullName: '',
    companyName: '',
    email: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      country: '',
      postalCode: '',
    },
  });

  const queryClient = useQueryClient();

  const { data: customers, isLoading } = useQuery<Customer[]>({
    queryKey: ['customers'],
    queryFn: async () => {
      const response = await axios.get('http://localhost:5000/api/customers', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: CustomerFormData) => {
      const response = await axios.post(
        'http://localhost:5000/api/customers',
        data,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      handleClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: CustomerFormData & { id: string }) => {
      const { id, ...rest } = data;
      const response = await axios.put(
        `http://localhost:5000/api/customers/${id}`,
        rest,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      handleClose();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`http://localhost:5000/api/customers/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });

  const addNoteMutation = useMutation({
    mutationFn: async ({
      customerId,
      note,
    }: {
      customerId: string;
      note: string;
    }) => {
      const response = await axios.post(
        `http://localhost:5000/api/customers/${customerId}/notes`,
        { content: note },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      handleNoteClose();
    },
  });

  const handleOpen = (customer?: Customer) => {
    if (customer) {
      setSelectedCustomer(customer);
      setFormData({
        fullName: customer.fullName,
        companyName: customer.companyName,
        email: customer.email,
        phone: customer.phone,
        address: { ...customer.address },
      });
    } else {
      setSelectedCustomer(null);
      setFormData({
        fullName: '',
        companyName: '',
        email: '',
        phone: '',
        address: {
          street: '',
          city: '',
          state: '',
          country: '',
          postalCode: '',
        },
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedCustomer(null);
  };

  const handleNoteOpen = (customer: Customer) => {
    setSelectedCustomer(customer);
    setNoteOpen(true);
  };

  const handleNoteClose = () => {
    setNoteOpen(false);
    setSelectedCustomer(null);
    setNewNote('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCustomer) {
      updateMutation.mutate({ ...formData, id: selectedCustomer._id });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCustomer && newNote.trim()) {
      addNoteMutation.mutate({
        customerId: selectedCustomer._id,
        note: newNote.trim(),
      });
    }
  };

  const columns = [
    { id: 'fullName', label: 'Full Name', minWidth: 170 },
    { id: 'companyName', label: 'Company', minWidth: 170 },
    { id: 'email', label: 'Email', minWidth: 170 },
    { id: 'phone', label: 'Phone', minWidth: 130 },
    {
      id: 'address',
      label: 'Address',
      minWidth: 200,
      format: (value: Address) =>
        `${value.street}, ${value.city}, ${value.state}, ${value.country}`,
    },
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
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={() => handleOpen()}
        sx={{ mb: 3 }}
      >
        Add Customer
      </Button>

      <DataTable
        columns={columns}
        rows={customers || []}
        onEdit={handleOpen}
        onDelete={(row) => deleteMutation.mutate(row._id)}
        page={0}
        rowsPerPage={10}
        totalRows={customers?.length || 0}
        onPageChange={() => {}}
        onRowsPerPageChange={() => {}}
      />

      {/* Customer Form Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedCustomer ? 'Edit Customer' : 'Add Customer'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  autoFocus
                  margin="dense"
                  label="Full Name"
                  fullWidth
                  required
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData({ ...formData, fullName: e.target.value })
                  }
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  margin="dense"
                  label="Company Name"
                  fullWidth
                  required
                  value={formData.companyName}
                  onChange={(e) =>
                    setFormData({ ...formData, companyName: e.target.value })
                  }
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  margin="dense"
                  label="Email"
                  type="email"
                  fullWidth
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  margin="dense"
                  label="Phone"
                  fullWidth
                  required
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  margin="dense"
                  label="Street"
                  fullWidth
                  required
                  value={formData.address.street}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      address: { ...formData.address, street: e.target.value },
                    })
                  }
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  margin="dense"
                  label="City"
                  fullWidth
                  required
                  value={formData.address.city}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      address: { ...formData.address, city: e.target.value },
                    })
                  }
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  margin="dense"
                  label="State"
                  fullWidth
                  required
                  value={formData.address.state}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      address: { ...formData.address, state: e.target.value },
                    })
                  }
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  margin="dense"
                  label="Country"
                  fullWidth
                  required
                  value={formData.address.country}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      address: { ...formData.address, country: e.target.value },
                    })
                  }
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  margin="dense"
                  label="Postal Code"
                  fullWidth
                  required
                  value={formData.address.postalCode}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      address: {
                        ...formData.address,
                        postalCode: e.target.value,
                      },
                    })
                  }
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="submit" variant="contained">
              {selectedCustomer ? 'Update' : 'Create'}
            </Button>
            {selectedCustomer && (
              <Tooltip title="Add Note">
                <IconButton
                  onClick={() => handleNoteOpen(selectedCustomer)}
                  color="primary"
                >
                  <NoteIcon />
                </IconButton>
              </Tooltip>
            )}
          </DialogActions>
        </form>
      </Dialog>

      {/* Notes Dialog */}
      <Dialog open={noteOpen} onClose={handleNoteClose} maxWidth="sm" fullWidth>
        <DialogTitle>Customer Notes</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <form onSubmit={handleAddNote}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="New Note"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                margin="normal"
              />
              <Button
                type="submit"
                variant="contained"
                disabled={!newNote.trim()}
                sx={{ mt: 1 }}
              >
                Add Note
              </Button>
            </form>
          </Box>
          {selectedCustomer?.notes.map((note, index) => (
            <Card key={index} sx={{ mb: 1 }}>
              <CardContent>
                <Typography variant="body2">{note.content}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {new Date(note.createdAt).toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleNoteClose}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
