import React, { useState, useEffect, useCallback } from 'react';
import { requestsService } from '../../services/requests';
import { equipmentService } from '../../services/equipment';
import { usersService } from '../../services/teams';
import { formatDate, getStageLabel, isOverdue, cn } from '../../lib/utils';
import {
    DndContext,
    DragOverlay,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    SortableContext,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
    Plus, 
    Clock, 
    Wrench, 
    CheckCircle, 
    Trash2,
    AlertTriangle,
    Calendar,
    User,
    GripVertical
} from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '../ui/dialog';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { toast } from 'sonner';

const STAGES = [
    { id: 'new', label: 'New', icon: Clock, color: 'border-blue-500', bgColor: 'bg-blue-500/10' },
    { id: 'in_progress', label: 'In Progress', icon: Wrench, color: 'border-yellow-500', bgColor: 'bg-yellow-500/10' },
    { id: 'repaired', label: 'Repaired', icon: CheckCircle, color: 'border-emerald-500', bgColor: 'bg-emerald-500/10' },
    { id: 'scrap', label: 'Scrap', icon: Trash2, color: 'border-red-500', bgColor: 'bg-red-500/10' },
];

export const RequestKanban = () => {
    const [requests, setRequests] = useState([]);
    const [equipment, setEquipment] = useState([]);
    const [technicians, setTechnicians] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeId, setActiveId] = useState(null);
    const [showForm, setShowForm] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor)
    );

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [reqData, eqData, techData] = await Promise.all([
                requestsService.getAll(),
                equipmentService.getAll(),
                usersService.getTechnicians()
            ]);
            setRequests(reqData);
            setEquipment(eqData);
            setTechnicians(techData);
        } catch (error) {
            toast.error('Failed to load requests');
        } finally {
            setLoading(false);
        }
    };

    const handleDragStart = (event) => {
        setActiveId(event.active.id);
    };

    const handleDragEnd = async (event) => {
        const { active, over } = event;
        setActiveId(null);

        if (!over) return;

        const requestId = active.id;
        const newStage = over.id;

        const request = requests.find(r => r.id === requestId);
        if (!request || request.stage === newStage) return;

        // Optimistic update
        setRequests(prev => prev.map(r => 
            r.id === requestId ? { ...r, stage: newStage } : r
        ));

        try {
            await requestsService.updateStage(requestId, newStage);
            if (newStage === 'scrap') {
                toast.info('Equipment marked as unusable');
            }
        } catch (error) {
            // Rollback on error
            setRequests(prev => prev.map(r => 
                r.id === requestId ? { ...r, stage: request.stage } : r
            ));
            toast.error('Failed to update request');
        }
    };

    const handleDragOver = (event) => {
        // Allow drag over columns
    };

    const getRequestsByStage = (stageId) => {
        return requests.filter(r => r.stage === stageId);
    };

    const activeRequest = activeId ? requests.find(r => r.id === activeId) : null;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6" data-testid="request-kanban">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Maintenance Requests</h1>
                    <p className="text-zinc-400 mt-1">Drag and drop to change request status</p>
                </div>
                <Button 
                    onClick={() => setShowForm(true)}
                    className="bg-orange-500 hover:bg-orange-600 text-white rounded-sm uppercase tracking-wider font-bold"
                    data-testid="add-request-btn"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    New Request
                </Button>
            </div>

            {/* Kanban Board */}
            <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDragOver={handleDragOver}
            >
                <div className="flex gap-4 overflow-x-auto pb-4" data-testid="kanban-board">
                    {STAGES.map((stage) => (
                        <KanbanColumn
                            key={stage.id}
                            stage={stage}
                            requests={getRequestsByStage(stage.id)}
                        />
                    ))}
                </div>

                <DragOverlay>
                    {activeRequest ? (
                        <RequestCard request={activeRequest} isDragging />
                    ) : null}
                </DragOverlay>
            </DndContext>

            {/* Create Request Dialog */}
            <RequestFormDialog
                open={showForm}
                onClose={() => setShowForm(false)}
                equipment={equipment}
                technicians={technicians}
                onSave={() => { loadData(); setShowForm(false); }}
            />
        </div>
    );
};

const KanbanColumn = ({ stage, requests }) => {
    const { setNodeRef, isOver } = useSortable({
        id: stage.id,
        data: { type: 'column' }
    });

    const Icon = stage.icon;

    return (
        <div
            ref={setNodeRef}
            className={cn(
                "kanban-column flex-shrink-0 w-80 bg-zinc-900/30 rounded-sm border border-zinc-800",
                isOver && "border-orange-500/50 bg-orange-500/5"
            )}
            data-testid={`kanban-column-${stage.id}`}
        >
            {/* Column Header */}
            <div className={cn("p-4 border-b border-zinc-800", stage.bgColor)}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Icon className={cn("w-5 h-5", 
                            stage.id === 'new' && 'text-blue-400',
                            stage.id === 'in_progress' && 'text-yellow-400',
                            stage.id === 'repaired' && 'text-emerald-400',
                            stage.id === 'scrap' && 'text-red-400'
                        )} />
                        <span className="font-semibold text-white">{stage.label}</span>
                    </div>
                    <span className="px-2 py-0.5 text-xs font-mono bg-zinc-800 text-zinc-400 rounded">
                        {requests.length}
                    </span>
                </div>
            </div>

            {/* Column Content */}
            <SortableContext
                id={stage.id}
                items={requests.map(r => r.id)}
                strategy={verticalListSortingStrategy}
            >
                <div className="p-3 space-y-3 min-h-[200px] max-h-[calc(100vh-300px)] overflow-y-auto">
                    {requests.length === 0 ? (
                        <div className="text-center py-8 text-zinc-600 text-sm">
                            Drop requests here
                        </div>
                    ) : (
                        requests.map((request) => (
                            <SortableRequestCard key={request.id} request={request} />
                        ))
                    )}
                </div>
            </SortableContext>
        </div>
    );
};

const SortableRequestCard = ({ request }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: request.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes}>
            <RequestCard request={request} listeners={listeners} />
        </div>
    );
};

const RequestCard = ({ request, isDragging, listeners }) => {
    const overdue = isOverdue(request.scheduled_date, request.stage);

    return (
        <div
            className={cn(
                "p-4 bg-zinc-900 border rounded-sm cursor-grab active:cursor-grabbing transition-all",
                isDragging && "shadow-lg rotate-2",
                overdue ? "border-red-500/50 bg-red-500/5" : "border-zinc-800 hover:border-zinc-700"
            )}
            data-testid={`request-card-${request.id}`}
        >
            {/* Drag Handle */}
            <div className="flex items-start gap-2" {...listeners}>
                <GripVertical className="w-4 h-4 text-zinc-600 mt-1 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="font-medium text-white truncate">{request.subject}</h4>
                        {overdue && (
                            <Badge variant="destructive" className="bg-red-500/20 text-red-400 border-red-500 text-xs flex-shrink-0">
                                OVERDUE
                            </Badge>
                        )}
                    </div>

                    {/* Equipment & Type */}
                    <div className="flex items-center gap-2 mb-3">
                        <Badge 
                            variant="outline" 
                            className={cn(
                                "text-xs border",
                                request.request_type === 'corrective' 
                                    ? 'border-red-500/50 text-red-400' 
                                    : 'border-blue-500/50 text-blue-400'
                            )}
                        >
                            {request.request_type}
                        </Badge>
                        {request.equipment_name && (
                            <span className="text-xs text-zinc-500 truncate">{request.equipment_name}</span>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between">
                        {/* Scheduled Date */}
                        {request.scheduled_date && (
                            <div className="flex items-center gap-1 text-xs text-zinc-500">
                                <Calendar className="w-3 h-3" />
                                {formatDate(request.scheduled_date)}
                            </div>
                        )}

                        {/* Technician Avatar */}
                        {request.assigned_technician_avatar && (
                            <Avatar className="w-6 h-6 border-2 border-zinc-800">
                                <AvatarImage src={request.assigned_technician_avatar} />
                                <AvatarFallback className="bg-orange-500/20 text-orange-500 text-xs">
                                    {request.assigned_technician_name?.charAt(0)}
                                </AvatarFallback>
                            </Avatar>
                        )}
                    </div>

                    {/* Priority Indicator */}
                    <div className="mt-2 flex items-center gap-2">
                        <span className={cn(
                            "w-2 h-2 rounded-full",
                            request.priority === 'high' && "bg-red-500",
                            request.priority === 'medium' && "bg-yellow-500",
                            request.priority === 'low' && "bg-emerald-500"
                        )} />
                        <span className="text-xs text-zinc-500 capitalize">{request.priority} priority</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

const RequestFormDialog = ({ open, onClose, equipment, technicians, onSave }) => {
    const [formData, setFormData] = useState({
        subject: '',
        description: '',
        equipment_id: '',
        request_type: 'corrective',
        scheduled_date: '',
        priority: 'medium'
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open) {
            setFormData({
                subject: '',
                description: '',
                equipment_id: '',
                request_type: 'corrective',
                scheduled_date: '',
                priority: 'medium'
            });
        }
    }, [open]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await requestsService.create(formData);
            toast.success('Request created');
            onSave();
        } catch (error) {
            toast.error('Failed to create request');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="bg-zinc-900 border-zinc-800 max-w-lg">
                <DialogHeader>
                    <DialogTitle className="text-white text-xl">New Maintenance Request</DialogTitle>
                </DialogHeader>
                
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-2">
                        <Label className="text-zinc-300">Subject *</Label>
                        <Input
                            value={formData.subject}
                            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                            placeholder="Brief description of the issue"
                            className="bg-zinc-950 border-zinc-800"
                            required
                            data-testid="request-subject-input"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-zinc-300">Equipment *</Label>
                        <Select 
                            value={formData.equipment_id} 
                            onValueChange={(v) => setFormData({ ...formData, equipment_id: v })}
                        >
                            <SelectTrigger className="bg-zinc-950 border-zinc-800" data-testid="request-equipment-select">
                                <SelectValue placeholder="Select equipment" />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-900 border-zinc-800 max-h-60">
                                {equipment.map(eq => (
                                    <SelectItem key={eq.id} value={eq.id}>
                                        {eq.name} ({eq.serial_number})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-zinc-300">Type *</Label>
                            <Select 
                                value={formData.request_type} 
                                onValueChange={(v) => setFormData({ ...formData, request_type: v })}
                            >
                                <SelectTrigger className="bg-zinc-950 border-zinc-800" data-testid="request-type-select">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-900 border-zinc-800">
                                    <SelectItem value="corrective">Corrective (Breakdown)</SelectItem>
                                    <SelectItem value="preventive">Preventive (Routine)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-zinc-300">Priority *</Label>
                            <Select 
                                value={formData.priority} 
                                onValueChange={(v) => setFormData({ ...formData, priority: v })}
                            >
                                <SelectTrigger className="bg-zinc-950 border-zinc-800" data-testid="request-priority-select">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-900 border-zinc-800">
                                    <SelectItem value="low">Low</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="high">High</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {formData.request_type === 'preventive' && (
                        <div className="space-y-2">
                            <Label className="text-zinc-300">Scheduled Date</Label>
                            <Input
                                type="date"
                                value={formData.scheduled_date}
                                onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                                className="bg-zinc-950 border-zinc-800"
                                data-testid="request-date-input"
                            />
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label className="text-zinc-300">Description</Label>
                        <Textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Detailed description of the issue..."
                            className="bg-zinc-950 border-zinc-800 min-h-[80px]"
                        />
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading || !formData.equipment_id}
                            className="bg-orange-500 hover:bg-orange-600 text-white"
                            data-testid="save-request-btn"
                        >
                            {loading ? 'Creating...' : 'Create Request'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
