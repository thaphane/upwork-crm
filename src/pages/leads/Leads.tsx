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
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import {
  Add as AddIcon,
  ViewList as ViewListIcon,
  ViewKanban as ViewKanbanIcon,
} from '@mui/icons-material';
import axios from 'axios';
import DataTable from '../../components/DataTable';
import LeadKanban from './LeadKanban';

interface Lead {
  _id: string;
  name: string;
  email: string;
  phone: string;
  status: 'New' | 'InProgress' | 'Converted';
  source: string;
  createdAt: string;
}

interface LeadFormData {
  name: string;
  email: string;
  phone: string;
  source: string;
}

const initialFormData: LeadFormData = {
  name: '',
  email: '',
  phone: '',
  source: '',
};

const columns = [
  { id: 'name', label: 'Name', minWidth: 170 },
  { id: 'email', label: 'Email', minWidth: 170 },
  { id: 'phone', label: 'Phone', minWidth: 100 },
  { id: 'status', label: 'Status', minWidth: 100 },
  { id: 'source', label: 'Source', minWidth: 100 },
  {
    id: 'createdAt',
    label: 'Created At',
    minWidth: 170,
    format: (value: string) => new Date(value).toLocaleDateString(),
  },
];

export default function Leads() {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState<LeadFormData>(initialFormData);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [view, setView] = useState<'list' | 'kanban'>('list');
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  const queryClient = useQueryClient();

  const { data: leadsData, isLoading } = useQuery({
    queryKey: ['leads', page, rowsPerPage, searchQuery],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:5000/api/leads?page=${page + 1}&limit=${rowsPerPage}&search=${searchQuery}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      return response.data;
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: LeadFormData) => {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:5000/api/leads', data, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      handleCloseDialog();
      showSnackbar('Lead created successfully', 'success');
    },
    onError: (error: any) => {
      showSnackbar(error.response?.data?.error || 'Error creating lead', 'error');
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: LeadFormData }) => {
      const token = localStorage.getItem('token');
      const response = await axios.put(`http://localhost:5000/api/leads/${id}`, data, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      handleCloseDialog();
      showSnackbar('Lead updated successfully', 'success');
    },
    onError: (error: any) => {
      showSnackbar(error.response?.data?.error || 'Error updating lead', 'error');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/leads/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      showSnackbar('Lead deleted successfully', 'success');
    },
    onError: (error: any) => {
      showSnackbar(error.response?.data?.error || 'Error deleting lead', 'error');
    }
  });

  const handleOpenDialog = (lead?: Lead) => {
    if (lead) {
      setFormData({
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        source: lead.source,
      });
      setEditingId(lead._id);
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

  const handleDelete = (lead: Lead) => {
    if (window.confirm('Are you sure you want to delete this lead?')) {
      deleteMutation.mutate(lead._id);
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleViewChange = (
    event: React.MouseEvent<HTMLElement>,
    newView: 'list' | 'kanban'
  ) => {
    if (newView !== null) {
      setView(newView);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <ToggleButtonGroup
          value={view}
          exclusive
          onChange={handleViewChange}
          aria-label="view mode"
        >
          <ToggleButton value="list" aria-label="list view">
            <ViewListIcon />
          </ToggleButton>
          <ToggleButton value="kanban" aria-label="kanban view">
            <ViewKanbanIcon />
          </ToggleButton>
        </ToggleButtonGroup>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Lead
        </Button>
      </Box>

      {view === 'list' ? (
        <DataTable
          columns={columns}
          rows={leadsData?.data || []}
          title="Leads"
          onEdit={handleOpenDialog}
          onDelete={handleDelete}
          totalCount={leadsData?.pagination?.total || 0}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={setPage}
          onRowsPerPageChange={setRowsPerPage}
          onSearch={setSearchQuery}
        />
      ) : (
        <LeadKanban
          leads={leadsData?.data || []}
          onEditLead={handleOpenDialog}
          onDeleteLead={handleDelete}
        />
      )}

      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <form onSubmit={handleSubmit}>
          <DialogTitle>{editingId ? 'Edit Lead' : 'Add Lead'}</DialogTitle>
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
              label="Email"
              type="email"
              fullWidth
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <TextField
              margin="dense"
              label="Phone"
              type="tel"
              fullWidth
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
            <TextField
              margin="dense"
              label="Source"
              select
              fullWidth
              required
              value={formData.source}
              onChange={(e) => setFormData({ ...formData, source: e.target.value })}
            >
              <MenuItem value="Website">Website</MenuItem>
              <MenuItem value="Referral">Referral</MenuItem>
              <MenuItem value="Social Media">Social Media</MenuItem>
              <MenuItem value="Other">Other</MenuItem>
            </TextField>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button type="submit" variant="contained">
              {editingId ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

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