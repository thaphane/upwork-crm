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
  ToggleButton,
  ToggleButtonGroup,
  CircularProgress,
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
  lastUpdated: string;
}

interface LeadFormData {
  name: string;
  email: string;
  phone: string;
  source: string;
}

type ViewMode = 'table' | 'kanban';

export default function Leads() {
  const [open, setOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [formData, setFormData] = useState<LeadFormData>({
    name: '',
    email: '',
    phone: '',
    source: '',
  });

  const queryClient = useQueryClient();

  const { data: leads, isLoading } = useQuery<Lead[]>({
    queryKey: ['leads'],
    queryFn: async () => {
      const response = await axios.get('http://localhost:5000/api/leads', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: LeadFormData) => {
      const response = await axios.post(
        'http://localhost:5000/api/leads',
        data,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      handleClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: LeadFormData & { id: string; status?: string }) => {
      const { id, ...rest } = data;
      const response = await axios.put(
        `http://localhost:5000/api/leads/${id}`,
        rest,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      handleClose();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`http://localhost:5000/api/leads/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });

  const handleOpen = (lead?: Lead) => {
    if (lead) {
      setSelectedLead(lead);
      setFormData({
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        source: lead.source,
      });
    } else {
      setSelectedLead(null);
      setFormData({
        name: '',
        email: '',
        phone: '',
        source: '',
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedLead(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedLead) {
      updateMutation.mutate({ ...formData, id: selectedLead._id });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination || !result.draggableId) return;

    const newStatus = result.destination.droppableId;
    const leadId = result.draggableId;

    updateMutation.mutate({
      id: leadId,
      status: newStatus,
      ...formData,
    });
  };

  const columns = [
    { id: 'name', label: 'Name', minWidth: 170 },
    { id: 'email', label: 'Email', minWidth: 170 },
    { id: 'phone', label: 'Phone', minWidth: 130 },
    { id: 'source', label: 'Source', minWidth: 130 },
    { id: 'status', label: 'Status', minWidth: 130 },
    {
      id: 'createdAt',
      label: 'Created',
      minWidth: 130,
      format: (value: string) => new Date(value).toLocaleDateString(),
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
      <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
        <Grid item>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpen()}
          >
            Add Lead
          </Button>
        </Grid>
        <Grid item>
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(e, value) => value && setViewMode(value)}
            aria-label="view mode"
          >
            <ToggleButton value="table" aria-label="table view">
              <ViewListIcon />
            </ToggleButton>
            <ToggleButton value="kanban" aria-label="kanban view">
              <ViewKanbanIcon />
            </ToggleButton>
          </ToggleButtonGroup>
        </Grid>
      </Grid>

      {viewMode === 'table' ? (
        <DataTable
          columns={columns}
          rows={leads || []}
          onEdit={handleOpen}
          onDelete={(row) => deleteMutation.mutate(row._id)}
          page={0}
          rowsPerPage={10}
          totalRows={leads?.length || 0}
          onPageChange={() => {}}
          onRowsPerPageChange={() => {}}
        />
      ) : (
        <LeadKanban
          leads={leads || []}
          onDragEnd={handleDragEnd}
          onEdit={handleOpen}
          onDelete={(lead) => deleteMutation.mutate(lead._id)}
        />
      )}

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedLead ? 'Edit Lead' : 'Add Lead'}
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
              label="Email"
              type="email"
              fullWidth
              required
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
            />
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
            <TextField
              margin="dense"
              label="Source"
              fullWidth
              required
              value={formData.source}
              onChange={(e) =>
                setFormData({ ...formData, source: e.target.value })
              }
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="submit" variant="contained">
              {selectedLead ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
