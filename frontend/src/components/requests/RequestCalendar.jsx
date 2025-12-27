import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { requestsService } from '../../services/requests';
import { equipmentService } from '../../services/equipment';
import { formatDate, getStageColor, getStageLabel } from '../../lib/utils';
import { Calendar as CalendarIcon, Plus, X, Wrench } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
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

export const RequestCalendar = () => {
    const [requests, setRequests] = useState([]);
    const [equipment, setEquipment] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedEvent, setSelectedEvent] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [reqData, eqData] = await Promise.all([
                requestsService.getCalendarRequests(),
                equipmentService.getAll()
            ]);
            setRequests(reqData);
            setEquipment(eqData);
        } catch (error) {
            toast.error('Failed to load calendar data');
        } finally {
            setLoading(false);
        }
    };

    const handleDateClick = (arg) => {
        setSelectedDate(arg.dateStr);
        setShowForm(true);
    };

    const handleEventClick = (arg) => {
        const request = requests.find(r => r.id === arg.event.id);
        if (request) {
            setSelectedEvent(request);
        }
    };

    const calendarEvents = requests
        .filter(r => r.scheduled_date)
        .map(r => ({
            id: r.id,
            title: r.subject,
            date: r.scheduled_date,
            backgroundColor: getEventColor(r.stage),
            borderColor: getEventColor(r.stage),
            extendedProps: { request: r }
        }));

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6" data-testid="request-calendar">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Maintenance Calendar</h1>
                    <p className="text-zinc-400 mt-1">Schedule and view preventive maintenance</p>
                </div>
                <Button 
                    onClick={() => { setSelectedDate(new Date().toISOString().split('T')[0]); setShowForm(true); }}
                    className="bg-orange-500 hover:bg-orange-600 text-white rounded-sm uppercase tracking-wider font-bold"
                    data-testid="schedule-maintenance-btn"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Schedule Maintenance
                </Button>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-blue-500" />
                    <span className="text-zinc-400">New</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-yellow-500" />
                    <span className="text-zinc-400">In Progress</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-emerald-500" />
                    <span className="text-zinc-400">Repaired</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-red-500" />
                    <span className="text-zinc-400">Scrap</span>
                </div>
            </div>

            {/* Calendar */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-sm p-4">
                <FullCalendar
                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                    initialView="dayGridMonth"
                    headerToolbar={{
                        left: 'prev,next today',
                        center: 'title',
                        right: 'dayGridMonth,timeGridWeek'
                    }}
                    events={calendarEvents}
                    dateClick={handleDateClick}
                    eventClick={handleEventClick}
                    height="auto"
                    eventDisplay="block"
                    dayMaxEvents={3}
                    eventContent={(eventInfo) => (
                        <div className="p-1 text-xs truncate">
                            <span className="font-medium">{eventInfo.event.title}</span>
                        </div>
                    )}
                />
            </div>

            {/* Create Form Dialog */}
            <CreateMaintenanceDialog
                open={showForm}
                onClose={() => { setShowForm(false); setSelectedDate(null); }}
                equipment={equipment}
                selectedDate={selectedDate}
                onSave={() => { loadData(); setShowForm(false); setSelectedDate(null); }}
            />

            {/* Event Detail Dialog */}
            <EventDetailDialog
                request={selectedEvent}
                onClose={() => setSelectedEvent(null)}
            />
        </div>
    );
};

const getEventColor = (stage) => {
    const colors = {
        new: '#3b82f6',
        in_progress: '#eab308',
        repaired: '#10b981',
        scrap: '#ef4444'
    };
    return colors[stage] || colors.new;
};

const CreateMaintenanceDialog = ({ open, onClose, equipment, selectedDate, onSave }) => {
    const [formData, setFormData] = useState({
        subject: '',
        description: '',
        equipment_id: '',
        request_type: 'preventive',
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
                request_type: 'preventive',
                scheduled_date: selectedDate || '',
                priority: 'medium'
            });
        }
    }, [open, selectedDate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await requestsService.create(formData);
            toast.success('Preventive maintenance scheduled');
            onSave();
        } catch (error) {
            toast.error('Failed to schedule maintenance');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="bg-zinc-900 border-zinc-800 max-w-lg">
                <DialogHeader>
                    <DialogTitle className="text-white text-xl flex items-center gap-2">
                        <CalendarIcon className="w-5 h-5 text-orange-500" />
                        Schedule Preventive Maintenance
                    </DialogTitle>
                </DialogHeader>
                
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-2">
                        <Label className="text-zinc-300">Subject *</Label>
                        <Input
                            value={formData.subject}
                            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                            placeholder="e.g., Monthly inspection"
                            className="bg-zinc-950 border-zinc-800"
                            required
                            data-testid="calendar-subject-input"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-zinc-300">Equipment *</Label>
                        <Select 
                            value={formData.equipment_id} 
                            onValueChange={(v) => setFormData({ ...formData, equipment_id: v })}
                        >
                            <SelectTrigger className="bg-zinc-950 border-zinc-800" data-testid="calendar-equipment-select">
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
                            <Label className="text-zinc-300">Scheduled Date *</Label>
                            <Input
                                type="date"
                                value={formData.scheduled_date}
                                onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                                className="bg-zinc-950 border-zinc-800"
                                required
                                data-testid="calendar-date-input"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-zinc-300">Priority</Label>
                            <Select 
                                value={formData.priority} 
                                onValueChange={(v) => setFormData({ ...formData, priority: v })}
                            >
                                <SelectTrigger className="bg-zinc-950 border-zinc-800">
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

                    <div className="space-y-2">
                        <Label className="text-zinc-300">Description</Label>
                        <Textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Maintenance tasks to perform..."
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
                            disabled={loading || !formData.equipment_id || !formData.scheduled_date}
                            className="bg-orange-500 hover:bg-orange-600 text-white"
                            data-testid="save-calendar-request-btn"
                        >
                            {loading ? 'Scheduling...' : 'Schedule'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

const EventDetailDialog = ({ request, onClose }) => {
    if (!request) return null;

    return (
        <Dialog open={!!request} onOpenChange={onClose}>
            <DialogContent className="bg-zinc-900 border-zinc-800 max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-white text-xl flex items-center gap-2">
                        <Wrench className="w-5 h-5 text-orange-500" />
                        {request.subject}
                    </DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <Badge className={`${getStageColor(request.stage)} border`}>
                            {getStageLabel(request.stage)}
                        </Badge>
                        <Badge 
                            variant="outline" 
                            className={request.request_type === 'corrective' 
                                ? 'border-red-500/50 text-red-400' 
                                : 'border-blue-500/50 text-blue-400'
                            }
                        >
                            {request.request_type}
                        </Badge>
                    </div>

                    <div className="space-y-3 text-sm">
                        <div>
                            <span className="text-zinc-500">Equipment:</span>
                            <p className="text-white">{request.equipment_name}</p>
                        </div>
                        {request.team_name && (
                            <div>
                                <span className="text-zinc-500">Team:</span>
                                <p className="text-white">{request.team_name}</p>
                            </div>
                        )}
                        {request.assigned_technician_name && (
                            <div>
                                <span className="text-zinc-500">Technician:</span>
                                <p className="text-white">{request.assigned_technician_name}</p>
                            </div>
                        )}
                        <div>
                            <span className="text-zinc-500">Scheduled:</span>
                            <p className="text-white">{formatDate(request.scheduled_date)}</p>
                        </div>
                        {request.description && (
                            <div>
                                <span className="text-zinc-500">Description:</span>
                                <p className="text-zinc-300">{request.description}</p>
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={onClose}
                        className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                    >
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
