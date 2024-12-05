import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Fab,
  Tooltip,
  DialogContentText,
  InputAdornment,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Note as NoteIcon,
  Save as SaveIcon,
  Search as SearchIcon,
  Sort as SortIcon,
} from '@mui/icons-material';
import axios from 'axios';

interface Address {
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
}

interface Note {
  content: string;
  createdAt: Date;
  createdBy?: string;
}

type CustomerStatus = 'Active' | 'Inactive' | 'New';

interface CustomerActivity {
  type: 'note_added' | 'status_changed' | 'details_updated' | 'contact';
  description: string;
  timestamp: Date;
  performedBy?: string;
}

interface Customer {
  _id: string;
  fullName: string;
  companyName: string;
  email: string;
  phone: string;
  address: Address;
  notes: Note[];
  registrationDate: Date;
  status: CustomerStatus;
  lastActivityDate?: Date;
  activities: CustomerActivity[];
}

interface CustomerFormData {
  fullName: string;
  companyName: string;
  email: string;
  phone: string;
  address: Address;
}

const initialFormData: CustomerFormData = {
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
};

type SortField = 'fullName' | 'companyName' | 'registrationDate';
type SortOrder = 'asc' | 'desc';

interface SortConfig {
  field: SortField;
  order: SortOrder;
}

export default function Customers() {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openNoteDialog, setOpenNoteDialog] = useState(false);
  const [formData, setFormData] = useState<CustomerFormData>(initialFormData);
  const [newNote, setNewNote] = useState('');
  const [openNotesDialog, setOpenNotesDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: 'registrationDate',
    order: 'desc',
  });
  const [countryFilter, setCountryFilter] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<{start: string; end: string}>({
    start: '',
    end: '',
  });
  const [statusFilter, setStatusFilter] = useState<CustomerStatus | ''>('');
  const [activityDialogOpen, setActivityDialogOpen] = useState(false);
  const [newActivity, setNewActivity] = useState<{
    type: CustomerActivity['type'];
    description: string;
  }>({
    type: 'contact',
    description: '',
  });

  const queryClient = useQueryClient();

  const { data: customers, isLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/customers', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: CustomerFormData) => {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:5000/api/customers', data, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      handleCloseDialog();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: CustomerFormData }) => {
      const token = localStorage.getItem('token');
      const response = await axios.put(`http://localhost:5000/api/customers/${id}`, data, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      handleCloseDialog();
    },
  });

  const addNoteMutation = useMutation({
    mutationFn: async ({ customerId, note }: { customerId: string; note: string }) => {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `http://localhost:5000/api/customers/${customerId}/notes`,
        { content: note },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      handleCloseNoteDialog();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/customers/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      handleCloseDeleteDialog();
    },
  });

  const addActivityMutation = useMutation({
    mutationFn: async ({ customerId, activity }: { 
      customerId: string; 
      activity: Omit<CustomerActivity, 'timestamp'>;
    }) => {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `http://localhost:5000/api/customers/${customerId}/activities`,
        activity,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      handleCloseActivityDialog();
    },
  });

  const handleOpenDialog = (customer?: Customer) => {
    if (customer) {
      setFormData({
        fullName: customer.fullName,
        companyName: customer.companyName,
        email: customer.email,
        phone: customer.phone,
        address: { ...customer.address },
      });
      setSelectedCustomer(customer);
    } else {
      setFormData(initialFormData);
      setSelectedCustomer(null);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormData(initialFormData);
    setSelectedCustomer(null);
  };

  const handleOpenNoteDialog = (customer: Customer) => {
    setSelectedCustomer(customer);
    setOpenNoteDialog(true);
  };

  const handleCloseNoteDialog = () => {
    setOpenNoteDialog(false);
    setNewNote('');
    setSelectedCustomer(null);
  };

  const handleOpenNotesDialog = (customer: Customer) => {
    setSelectedCustomer(customer);
    setOpenNotesDialog(true);
  };

  const handleCloseNotesDialog = () => {
    setOpenNotesDialog(false);
    setSelectedCustomer(null);
  };

  const handleOpenDeleteDialog = (customer: Customer) => {
    setSelectedCustomer(customer);
    setOpenDeleteDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
    setSelectedCustomer(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCustomer) {
      updateMutation.mutate({ id: selectedCustomer._id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleAddNote = () => {
    if (selectedCustomer && newNote.trim()) {
      addNoteMutation.mutate({
        customerId: selectedCustomer._id,
        note: newNote.trim(),
      });
    }
  };

  const handleDelete = () => {
    if (selectedCustomer) {
      deleteMutation.mutate(selectedCustomer._id);
    }
  };

  const handleSort = (field: SortField) => {
    setSortConfig(prev => ({
      field,
      order: prev.field === field && prev.order === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleDateFilterChange = (field: 'start' | 'end', value: string) => {
    setDateFilter(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const clearFilters = () => {
    setSearchQuery('');
    setCountryFilter('');
    setStatusFilter('');
    setDateFilter({ start: '', end: '' });
    setSortConfig({
      field: 'registrationDate',
      order: 'desc',
    });
  };

  const uniqueCountries: string[] = useMemo(() => {
    if (!customers) return [];
    const countries = (customers as Customer[]).map(customer => customer.address.country);
    return Array.from(new Set(countries)).sort();
  }, [customers]);

  const filteredCustomers = useMemo(() => {
    if (!customers) return [];
    
    return customers
      .filter((customer: Customer) => {
        const matchesSearch = searchQuery === '' || 
          customer.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          customer.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          customer.email.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesCountry = countryFilter === '' || 
          customer.address.country === countryFilter;

        const matchesStatus = statusFilter === '' ||
          customer.status === statusFilter;

        const matchesDate = () => {
          if (!dateFilter.start && !dateFilter.end) return true;
          
          const customerDate = new Date(customer.registrationDate);
          const startDate = dateFilter.start ? new Date(dateFilter.start) : null;
          const endDate = dateFilter.end ? new Date(dateFilter.end) : null;

          if (startDate && endDate) {
            return customerDate >= startDate && customerDate <= endDate;
          } else if (startDate) {
            return customerDate >= startDate;
          } else if (endDate) {
            return customerDate <= endDate;
          }
          return true;
        };

        return matchesSearch && matchesCountry && matchesStatus && matchesDate();
      })
      .sort((a: Customer, b: Customer) => {
        const aValue = a[sortConfig.field];
        const bValue = b[sortConfig.field];
        
        if (sortConfig.field === 'registrationDate') {
          const dateA = new Date(aValue).getTime();
          const dateB = new Date(bValue).getTime();
          return sortConfig.order === 'asc' ? dateA - dateB : dateB - dateA;
        }
        
        if (aValue < bValue) return sortConfig.order === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.order === 'asc' ? 1 : -1;
        return 0;
      });
  }, [customers, searchQuery, sortConfig, countryFilter, statusFilter, dateFilter]);

  const handleOpenActivityDialog = (customer: Customer) => {
    setSelectedCustomer(customer);
    setActivityDialogOpen(true);
  };

  const handleCloseActivityDialog = () => {
    setActivityDialogOpen(false);
    setNewActivity({ type: 'contact', description: '' });
    setSelectedCustomer(null);
  };

  const handleAddActivity = () => {
    if (selectedCustomer && newActivity.description.trim()) {
      addActivityMutation.mutate({
        customerId: selectedCustomer._id,
        activity: newActivity,
      });
    }
  };

  if (isLoading) {
    return <Typography>Loading...</Typography>;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Customers</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Customer
        </Button>
      </Box>

      {/* Search and Filter Bar */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              placeholder="Search customers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Filter by Country</InputLabel>
              <Select
                value={countryFilter}
                label="Filter by Country"
                onChange={(e) => setCountryFilter(e.target.value)}
              >
                <MenuItem value="">All Countries</MenuItem>
                {uniqueCountries.map((country: string) => (
                  <MenuItem key={country} value={country}>
                    {country}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Customer Status</InputLabel>
              <Select
                value={statusFilter}
                label="Customer Status"
                onChange={(e) => setStatusFilter(e.target.value as CustomerStatus | '')}
              >
                <MenuItem value="">All Statuses</MenuItem>
                <MenuItem value="Active">Active</MenuItem>
                <MenuItem value="Inactive">Inactive</MenuItem>
                <MenuItem value="New">New</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                onClick={clearFilters}
                size="small"
                color="secondary"
              >
                Clear Filters
              </Button>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              type="date"
              label="From Date"
              value={dateFilter.start}
              onChange={(e) => handleDateFilterChange('start', e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              type="date"
              label="To Date"
              value={dateFilter.end}
              onChange={(e) => handleDateFilterChange('end', e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
              <Button
                variant={sortConfig.field === 'fullName' ? 'contained' : 'outlined'}
                onClick={() => handleSort('fullName')}
                startIcon={<SortIcon />}
                size="small"
              >
                Name {sortConfig.field === 'fullName' && (sortConfig.order === 'asc' ? '↑' : '↓')}
              </Button>
              <Button
                variant={sortConfig.field === 'companyName' ? 'contained' : 'outlined'}
                onClick={() => handleSort('companyName')}
                startIcon={<SortIcon />}
                size="small"
              >
                Company {sortConfig.field === 'companyName' && (sortConfig.order === 'asc' ? '↑' : '↓')}
              </Button>
              <Button
                variant={sortConfig.field === 'registrationDate' ? 'contained' : 'outlined'}
                onClick={() => handleSort('registrationDate')}
                startIcon={<SortIcon />}
                size="small"
              >
                Date {sortConfig.field === 'registrationDate' && (sortConfig.order === 'asc' ? '↑' : '↓')}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Results Summary */}
      <Box sx={{ mb: 2 }}>
        <Typography color="textSecondary">
          Showing {filteredCustomers.length} of {customers?.length || 0} customers
          {searchQuery && ` matching "${searchQuery}"`}
          {countryFilter && ` in ${countryFilter}`}
          {statusFilter && ` with status "${statusFilter}"`}
          {(dateFilter.start || dateFilter.end) && ` within selected date range`}
        </Typography>
      </Box>

      {/* Customer Grid */}
      <Grid container spacing={3}>
        {filteredCustomers.map((customer: Customer) => (
          <Grid item xs={12} md={6} lg={4} key={customer._id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6">{customer.fullName}</Typography>
                  <Box>
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog(customer)}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDeleteDialog(customer)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Box>
                <Typography color="textSecondary" gutterBottom>
                  {customer.companyName}
                </Typography>
                <Typography variant="body2" component="p">
                  {customer.email}
                </Typography>
                <Typography variant="body2" component="p">
                  {customer.phone}
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" gutterBottom>
                  Address
                </Typography>
                <Typography variant="body2">
                  {customer.address.street}
                  <br />
                  {customer.address.city}, {customer.address.state}
                  <br />
                  {customer.address.country}, {customer.address.postalCode}
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="subtitle2">
                    Notes ({customer.notes.length})
                  </Typography>
                  <Box>
                    <Tooltip title="View All Notes">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenNotesDialog(customer)}
                        sx={{ mr: 1 }}
                      >
                        <NoteIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Add Note">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenNoteDialog(customer)}
                      >
                        <AddIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
                {customer.notes.slice(0, 2).map((note, index) => (
                  <Typography
                    key={index}
                    variant="body2"
                    color="textSecondary"
                    sx={{ mt: 1 }}
                  >
                    {note.content}
                  </Typography>
                ))}
                {customer.notes.length > 2 && (
                  <Typography variant="body2" color="primary" sx={{ mt: 1, cursor: 'pointer' }}>
                    View all notes...
                  </Typography>
                )}
                
                {/* Activity Section */}
                <Divider sx={{ my: 2 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="subtitle2">
                    Recent Activity
                  </Typography>
                  <Tooltip title="Add Activity">
                    <IconButton
                      size="small"
                      onClick={() => handleOpenActivityDialog(customer)}
                    >
                      <AddIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
                {customer.activities?.slice(0, 2).map((activity, index) => (
                  <Typography
                    key={index}
                    variant="body2"
                    color="textSecondary"
                    sx={{ mt: 1 }}
                  >
                    {activity.description} ({new Date(activity.timestamp).toLocaleDateString()})
                  </Typography>
                ))}
                {customer.activities?.length > 2 && (
                  <Typography variant="body2" color="primary" sx={{ mt: 1, cursor: 'pointer' }}>
                    View all activities...
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {filteredCustomers.length === 0 && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="textSecondary">
            No customers found
          </Typography>
          <Typography color="textSecondary">
            Try adjusting your search or filters
          </Typography>
        </Paper>
      )}

      {/* Customer Form Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>
            {selectedCustomer ? 'Edit Customer' : 'Add Customer'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Full Name"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Company Name"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle1" sx={{ mb: 2 }}>
                  Address
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Street"
                  value={formData.address.street}
                  onChange={(e) => setFormData({
                    ...formData,
                    address: { ...formData.address, street: e.target.value }
                  })}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="City"
                  value={formData.address.city}
                  onChange={(e) => setFormData({
                    ...formData,
                    address: { ...formData.address, city: e.target.value }
                  })}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="State"
                  value={formData.address.state}
                  onChange={(e) => setFormData({
                    ...formData,
                    address: { ...formData.address, state: e.target.value }
                  })}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Country"
                  value={formData.address.country}
                  onChange={(e) => setFormData({
                    ...formData,
                    address: { ...formData.address, country: e.target.value }
                  })}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Postal Code"
                  value={formData.address.postalCode}
                  onChange={(e) => setFormData({
                    ...formData,
                    address: { ...formData.address, postalCode: e.target.value }
                  })}
                  required
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button type="submit" variant="contained">
              {selectedCustomer ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Add Note Dialog */}
      <Dialog open={openNoteDialog} onClose={handleCloseNoteDialog}>
        <DialogTitle>Add Note</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Note"
            fullWidth
            multiline
            rows={4}
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseNoteDialog}>Cancel</Button>
          <Button onClick={handleAddNote} variant="contained">
            Add Note
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notes View Dialog */}
      <Dialog
        open={openNotesDialog}
        onClose={handleCloseNotesDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Notes for {selectedCustomer?.fullName}
        </DialogTitle>
        <DialogContent>
          <List>
            {selectedCustomer?.notes.map((note, index) => (
              <React.Fragment key={index}>
                <ListItem>
                  <ListItemText
                    primary={note.content}
                    secondary={`Added on ${new Date(note.createdAt).toLocaleString()} ${
                      note.createdBy ? `by ${note.createdBy}` : ''
                    }`}
                  />
                </ListItem>
                {index < selectedCustomer.notes.length - 1 && <Divider />}
              </React.Fragment>
            ))}
            {selectedCustomer?.notes.length === 0 && (
              <Typography color="textSecondary" align="center" sx={{ py: 2 }}>
                No notes available
              </Typography>
            )}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseNotesDialog}>Close</Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              handleCloseNotesDialog();
              if (selectedCustomer) handleOpenNoteDialog(selectedCustomer);
            }}
          >
            Add Note
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={openDeleteDialog}
        onClose={handleCloseDeleteDialog}
      >
        <DialogTitle>Delete Customer</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete {selectedCustomer?.fullName}? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
          <Button
            onClick={handleDelete}
            color="error"
            variant="contained"
            startIcon={<DeleteIcon />}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Activity Dialog */}
      <Dialog
        open={activityDialogOpen}
        onClose={handleCloseActivityDialog}
      >
        <DialogTitle>Add Activity for {selectedCustomer?.fullName}</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Activity Type</InputLabel>
              <Select
                value={newActivity.type}
                label="Activity Type"
                onChange={(e) => setNewActivity(prev => ({
                  ...prev,
                  type: e.target.value as CustomerActivity['type'],
                }))}
              >
                <MenuItem value="contact">Contact Made</MenuItem>
                <MenuItem value="note_added">Note Added</MenuItem>
                <MenuItem value="status_changed">Status Changed</MenuItem>
                <MenuItem value="details_updated">Details Updated</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Activity Description"
              value={newActivity.description}
              onChange={(e) => setNewActivity(prev => ({
                ...prev,
                description: e.target.value,
              }))}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseActivityDialog}>Cancel</Button>
          <Button
            onClick={handleAddActivity}
            variant="contained"
            disabled={!newActivity.description.trim()}
          >
            Add Activity
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 