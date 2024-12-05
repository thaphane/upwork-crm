import React, { useState } from 'react';
import type {
  DragDropContext,
  Droppable,
  Draggable,
  DroppableProvided,
  DroppableStateSnapshot,
  DraggableProvided,
  DraggableStateSnapshot,
  DropResult,
} from 'react-beautiful-dnd';
import { DragDropContext as DragDropContextComponent, Droppable as DroppableComponent, Draggable as DraggableComponent } from 'react-beautiful-dnd';
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  IconButton,
  Chip,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
} from '@mui/icons-material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

interface Lead {
  _id: string;
  name: string;
  email: string;
  phone: string;
  status: 'New' | 'InProgress' | 'Converted';
  source: string;
  createdAt: string;
}

interface KanbanColumn {
  id: string;
  title: string;
  leads: Lead[];
}

interface LeadKanbanProps {
  leads: Lead[];
  onEditLead: (lead: Lead) => void;
  onDeleteLead: (lead: Lead) => void;
}

const getColumnStyle = (isDraggingOver: boolean) => ({
  background: isDraggingOver ? 'rgba(25, 118, 210, 0.08)' : '#f5f5f5',
  padding: 2,
  width: 300,
  minHeight: 500,
  borderRadius: 2,
});

const LeadKanban: React.FC<LeadKanbanProps> = ({ leads, onEditLead, onDeleteLead }) => {
  const [columns, setColumns] = useState<KanbanColumn[]>([
    { id: 'New', title: 'New Leads', leads: [] },
    { id: 'InProgress', title: 'In Progress', leads: [] },
    { id: 'Converted', title: 'Converted', leads: [] },
  ]);

  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const queryClient = useQueryClient();

  // Update lead status mutation
  const updateLeadStatus = useMutation({
    mutationFn: async ({ leadId, newStatus }: { leadId: string; newStatus: string }) => {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `http://localhost:5000/api/leads/${leadId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });

  // Initialize columns with leads
  React.useEffect(() => {
    const newColumns = columns.map(column => ({
      ...column,
      leads: leads.filter(lead => lead.status === column.id),
    }));
    setColumns(newColumns);
  }, [leads]);

  const handleDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;

    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    // Find the lead being dragged
    const lead = leads.find(l => l._id === draggableId);
    if (!lead) return;

    // Update lead status in the backend
    await updateLeadStatus.mutateAsync({
      leadId: draggableId,
      newStatus: destination.droppableId,
    });

    // Update local state
    const newColumns = columns.map(column => {
      if (column.id === source.droppableId) {
        const newLeads = [...column.leads];
        newLeads.splice(source.index, 1);
        return { ...column, leads: newLeads };
      }
      if (column.id === destination.droppableId) {
        const newLeads = [...column.leads];
        const draggedLead = { ...lead, status: destination.droppableId as 'New' | 'InProgress' | 'Converted' };
        newLeads.splice(destination.index, 0, draggedLead);
        return { ...column, leads: newLeads };
      }
      return column;
    });

    setColumns(newColumns);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, lead: Lead) => {
    setMenuAnchor(event.currentTarget);
    setSelectedLead(lead);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedLead(null);
  };

  const getSourceColor = (source: string) => {
    const colors: { [key: string]: string } = {
      Website: 'primary',
      Referral: 'success',
      'Social Media': 'info',
      Other: 'default',
    };
    return colors[source] || 'default';
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 2 }}>
        <DragDropContextComponent onDragEnd={handleDragEnd}>
          {columns.map(column => (
            <Paper key={column.id} sx={{ p: 2 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                {column.title} ({column.leads.length})
              </Typography>
              <DroppableComponent droppableId={column.id}>
                {(provided: DroppableProvided, snapshot: DroppableStateSnapshot) => (
                  <Box
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    sx={getColumnStyle(snapshot.isDraggingOver)}
                  >
                    {column.leads.map((lead, index) => (
                      <DraggableComponent key={lead._id} draggableId={lead._id} index={index}>
                        {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
                          <Card
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            sx={{
                              mb: 1,
                              backgroundColor: snapshot.isDragging
                                ? 'rgba(25, 118, 210, 0.08)'
                                : 'white',
                            }}
                          >
                            <CardContent>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                                  {lead.name}
                                </Typography>
                                <IconButton
                                  size="small"
                                  onClick={(e) => handleMenuOpen(e, lead)}
                                >
                                  <MoreVertIcon />
                                </IconButton>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <EmailIcon fontSize="small" color="action" />
                                <Typography variant="body2">{lead.email}</Typography>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <PhoneIcon fontSize="small" color="action" />
                                <Typography variant="body2">{lead.phone}</Typography>
                              </Box>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                                <Chip
                                  label={lead.source}
                                  size="small"
                                  color={getSourceColor(lead.source) as any}
                                />
                                <Typography variant="caption" color="text.secondary">
                                  {new Date(lead.createdAt).toLocaleDateString()}
                                </Typography>
                              </Box>
                            </CardContent>
                          </Card>
                        )}
                      </DraggableComponent>
                    ))}
                    {provided.placeholder}
                  </Box>
                )}
              </DroppableComponent>
            </Paper>
          ))}
        </DragDropContextComponent>
      </Box>

      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem
          onClick={() => {
            if (selectedLead) onEditLead(selectedLead);
            handleMenuClose();
          }}
        >
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          Edit Lead
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (selectedLead) onDeleteLead(selectedLead);
            handleMenuClose();
          }}
          sx={{ color: 'error.main' }}
        >
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Delete Lead
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default LeadKanban; 