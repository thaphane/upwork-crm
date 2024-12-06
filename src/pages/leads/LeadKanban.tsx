import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
} from '@mui/icons-material';

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

interface LeadKanbanProps {
  leads: Lead[];
  onDragEnd: (result: any) => void;
  onEdit: (lead: Lead) => void;
  onDelete: (lead: Lead) => void;
}

interface ColumnType {
  New: Lead[];
  InProgress: Lead[];
  Converted: Lead[];
}

const statusColumns = [
  { id: 'New', title: 'New Leads' },
  { id: 'InProgress', title: 'In Progress' },
  { id: 'Converted', title: 'Converted' },
] as const;

export default function LeadKanban({
  leads,
  onDragEnd,
  onEdit,
  onDelete,
}: LeadKanbanProps) {
  const [columns, setColumns] = useState<ColumnType>({
    New: [],
    InProgress: [],
    Converted: [],
  });

  useEffect(() => {
    if (Array.isArray(leads)) {
      const newColumns: ColumnType = {
        New: leads.filter(lead => lead.status === 'New'),
        InProgress: leads.filter(lead => lead.status === 'InProgress'),
        Converted: leads.filter(lead => lead.status === 'Converted'),
      };
      setColumns(newColumns);
    } else {
      setColumns({
        New: [],
        InProgress: [],
        Converted: [],
      });
    }
  }, [leads]);

  const getLeadsByStatus = (status: keyof ColumnType): Lead[] => {
    return columns[status];
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Box
        sx={{
          display: 'flex',
          gap: 2,
          p: 2,
          minHeight: 'calc(100vh - 200px)',
          overflowX: 'auto',
        }}
      >
        {statusColumns.map((column) => (
          <Paper
            key={column.id}
            sx={{
              width: 300,
              minWidth: 300,
              bgcolor: 'background.default',
            }}
          >
            <Box
              sx={{
                p: 2,
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
              }}
            >
              <Typography variant="h6">{column.title}</Typography>
            </Box>
            <Droppable droppableId={column.id}>
              {(provided) => (
                <Box
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  sx={{ p: 1, minHeight: 100 }}
                >
                  {getLeadsByStatus(column.id as keyof ColumnType).map((lead: Lead, index: number) => (
                    <Draggable
                      key={lead._id}
                      draggableId={lead._id}
                      index={index}
                    >
                      {(provided) => (
                        <Card
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          sx={{ mb: 1 }}
                        >
                          <CardContent>
                            <Box
                              sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'flex-start',
                              }}
                            >
                              <Typography variant="h6" gutterBottom>
                                {lead.name}
                              </Typography>
                              <Box>
                                <Tooltip title="Edit">
                                  <IconButton
                                    size="small"
                                    onClick={() => onEdit(lead)}
                                  >
                                    <EditIcon />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Delete">
                                  <IconButton
                                    size="small"
                                    onClick={() => onDelete(lead)}
                                    color="error"
                                  >
                                    <DeleteIcon />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            </Box>
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                mb: 1,
                              }}
                            >
                              <PersonIcon fontSize="small" color="action" />
                              <Typography variant="body2" color="text.secondary">
                                {lead.source}
                              </Typography>
                            </Box>
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                mb: 1,
                              }}
                            >
                              <EmailIcon fontSize="small" color="action" />
                              <Typography variant="body2" color="text.secondary">
                                {lead.email}
                              </Typography>
                            </Box>
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                              }}
                            >
                              <PhoneIcon fontSize="small" color="action" />
                              <Typography variant="body2" color="text.secondary">
                                {lead.phone}
                              </Typography>
                            </Box>
                          </CardContent>
                        </Card>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </Box>
              )}
            </Droppable>
          </Paper>
        ))}
      </Box>
    </DragDropContext>
  );
}
