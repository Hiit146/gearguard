import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { equipmentService } from '../../services/equipment';
import { teamsService, usersService } from '../../services/teams';
import { formatDate } from '../../lib/utils';
import { 
    Plus, 
    Search, 
    Wrench, 
    Edit2, 
    Trash2, 
    MapPin, 
    Building2,
    AlertCircle,
    CheckCircle2
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Card, CardContent } from '../ui/card';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '../ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '../ui/alert-dialog';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { toast } from 'sonner';

const CATEGORIES = [
    'Machinery',
    'Electrical',
    'HVAC',
    'Plumbing',
    'IT Equipment',
    'Vehicles',
    'Safety Equipment',
    'Other'
];

const DEPARTMENTS = [
    'Production',
    'Maintenance',
    'IT',
    'Administration',
    'Warehouse',
    'Quality Control'
];

export const EquipmentList = () => {
    const [equipment, setEquipment] = useState([]);
    const [teams, setTeams] = useState([]);
    const [technicians, setTechnicians] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [deleteItem, setDeleteItem] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [eqData, teamData, techData] = await Promise.all([
                equipmentService.getAll(),
                teamsService.getAll(),
                usersService.getTechnicians()
            ]);
            setEquipment(eqData);
            setTeams(teamData);
            setTechnicians(techData);
        } catch (error) {
            toast.error('Failed to load equipment');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteItem) return;
        try {
            await equipmentService.delete(deleteItem.id);
            setEquipment(equipment.filter(e => e.id !== deleteItem.id));
            toast.success('Equipment deleted');
            setDeleteItem(null);
        } catch (error) {
            toast.error('Failed to delete equipment');
        }
    };

    const filteredEquipment = equipment.filter(eq =>
        eq.name.toLowerCase().includes(search.toLowerCase()) ||
        eq.serial_number.toLowerCase().includes(search.toLowerCase()) ||
        eq.category.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6" data-testid="equipment-list">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Equipment</h1>
                    <p className="text-zinc-400 mt-1">Manage your company assets</p>
                </div>
                <Button 
                    onClick={() => { setEditItem(null); setShowForm(true); }}
                    className="bg-orange-500 hover:bg-orange-600 text-white rounded-sm uppercase tracking-wider font-bold"
                    data-testid="add-equipment-btn"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Equipment
                </Button>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <Input
                    placeholder="Search equipment..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 bg-zinc-900 border-zinc-800"
                    data-testid="equipment-search"
                />
            </div>

            {/* Equipment Grid */}
            {filteredEquipment.length === 0 ? (
                <div className="text-center py-12 text-zinc-400">
                    <Wrench className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No equipment found</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredEquipment.map((eq) => (
                        <EquipmentCard
                            key={eq.id}
                            equipment={eq}
                            onEdit={() => { setEditItem(eq); setShowForm(true); }}
                            onDelete={() => setDeleteItem(eq)}
                            onViewRequests={() => navigate(`/equipment/${eq.id}`)}
                        />
                    ))}
                </div>
            )}

            {/* Form Dialog */}
            <EquipmentFormDialog
                open={showForm}
                onClose={() => { setShowForm(false); setEditItem(null); }}
                equipment={editItem}
                teams={teams}
                technicians={technicians}
                onSave={() => { loadData(); setShowForm(false); setEditItem(null); }}
            />

            {/* Delete Confirmation */}
            <AlertDialog open={!!deleteItem} onOpenChange={() => setDeleteItem(null)}>
                <AlertDialogContent className="bg-zinc-900 border-zinc-800">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-white">Delete Equipment</AlertDialogTitle>
                        <AlertDialogDescription className="text-zinc-400">
                            Are you sure you want to delete "{deleteItem?.name}"? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700">
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-red-500 hover:bg-red-600 text-white"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

const EquipmentCard = ({ equipment, onEdit, onDelete, onViewRequests }) => {
    return (
        <Card 
            className={`bg-zinc-900/50 border-zinc-800 hover:border-orange-500/50 transition-colors cursor-pointer ${
                !equipment.is_usable ? 'border-l-4 border-l-red-500 opacity-60' : ''
            }`}
            onClick={onViewRequests}
            data-testid={`equipment-card-${equipment.id}`}
        >
            <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white mb-1">{equipment.name}</h3>
                        <p className="text-sm text-zinc-500 font-mono">{equipment.serial_number}</p>
                    </div>
                    <div className="flex items-center gap-1">
                        <Button
                            size="icon"
                            variant="ghost"
                            onClick={(e) => { e.stopPropagation(); onEdit(); }}
                            className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-800"
                            data-testid={`edit-equipment-${equipment.id}`}
                        >
                            <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                            size="icon"
                            variant="ghost"
                            onClick={(e) => { e.stopPropagation(); onDelete(); }}
                            className="h-8 w-8 text-zinc-400 hover:text-red-400 hover:bg-red-500/10"
                            data-testid={`delete-equipment-${equipment.id}`}
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-zinc-400">
                        <Building2 className="w-4 h-4" />
                        <span>{equipment.department}</span>
                    </div>
                    <div className="flex items-center gap-2 text-zinc-400">
                        <MapPin className="w-4 h-4" />
                        <span>{equipment.location}</span>
                    </div>
                </div>

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-zinc-800">
                    <Badge variant="outline" className="border-zinc-700 text-zinc-300">
                        {equipment.category}
                    </Badge>
                    
                    {/* Smart Maintenance Button */}
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => { e.stopPropagation(); onViewRequests(); }}
                        className={`gap-2 ${
                            equipment.open_request_count > 0
                                ? 'border-orange-500 text-orange-400 hover:bg-orange-500/10'
                                : 'border-zinc-700 text-zinc-400 hover:bg-zinc-800'
                        }`}
                        data-testid={`maintenance-btn-${equipment.id}`}
                    >
                        <Wrench className="w-4 h-4" />
                        Maintenance
                        {equipment.open_request_count > 0 && (
                            <span className="ml-1 px-1.5 py-0.5 text-xs font-bold bg-orange-500 text-white rounded">
                                {equipment.open_request_count}
                            </span>
                        )}
                    </Button>
                </div>

                {!equipment.is_usable && (
                    <div className="mt-3 flex items-center gap-2 text-red-400 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        <span>Marked as unusable (scrapped)</span>
                    </div>
                )}

                {equipment.technician && (
                    <div className="mt-3 flex items-center gap-2">
                        <Avatar className="w-6 h-6">
                            <AvatarImage src={equipment.technician.avatar} />
                            <AvatarFallback className="bg-orange-500/20 text-orange-500 text-xs">
                                {equipment.technician.name?.charAt(0)}
                            </AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-zinc-400">{equipment.technician.name}</span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

const EquipmentFormDialog = ({ open, onClose, equipment, teams, technicians, onSave }) => {
    const [formData, setFormData] = useState({
        name: '',
        serial_number: '',
        location: '',
        department: '',
        category: '',
        employee_owner: '',
        purchase_date: '',
        warranty_expiry: '',
        notes: '',
        assigned_team_id: '',
        default_technician_id: ''
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (equipment) {
            setFormData({
                name: equipment.name || '',
                serial_number: equipment.serial_number || '',
                location: equipment.location || '',
                department: equipment.department || '',
                category: equipment.category || '',
                employee_owner: equipment.employee_owner || '',
                purchase_date: equipment.purchase_date || '',
                warranty_expiry: equipment.warranty_expiry || '',
                notes: equipment.notes || '',
                assigned_team_id: equipment.assigned_team_id || '',
                default_technician_id: equipment.default_technician_id || ''
            });
        } else {
            setFormData({
                name: '',
                serial_number: '',
                location: '',
                department: '',
                category: '',
                employee_owner: '',
                purchase_date: '',
                warranty_expiry: '',
                notes: '',
                assigned_team_id: '',
                default_technician_id: ''
            });
        }
    }, [equipment, open]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (equipment) {
                await equipmentService.update(equipment.id, formData);
                toast.success('Equipment updated');
            } else {
                await equipmentService.create(formData);
                toast.success('Equipment created');
            }
            onSave();
        } catch (error) {
            toast.error('Failed to save equipment');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="bg-zinc-900 border-zinc-800 max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-white text-xl">
                        {equipment ? 'Edit Equipment' : 'Add Equipment'}
                    </DialogTitle>
                </DialogHeader>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Info */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Basic Information</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-zinc-300">Name *</Label>
                                <Input
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="bg-zinc-950 border-zinc-800"
                                    required
                                    data-testid="equipment-name-input"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-zinc-300">Serial Number *</Label>
                                <Input
                                    value={formData.serial_number}
                                    onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                                    className="bg-zinc-950 border-zinc-800 font-mono"
                                    required
                                    data-testid="equipment-serial-input"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-zinc-300">Category *</Label>
                                <Select 
                                    value={formData.category} 
                                    onValueChange={(v) => setFormData({ ...formData, category: v })}
                                >
                                    <SelectTrigger className="bg-zinc-950 border-zinc-800" data-testid="equipment-category-select">
                                        <SelectValue placeholder="Select category" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-zinc-900 border-zinc-800">
                                        {CATEGORIES.map(cat => (
                                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-zinc-300">Department *</Label>
                                <Select 
                                    value={formData.department} 
                                    onValueChange={(v) => setFormData({ ...formData, department: v })}
                                >
                                    <SelectTrigger className="bg-zinc-950 border-zinc-800" data-testid="equipment-department-select">
                                        <SelectValue placeholder="Select department" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-zinc-900 border-zinc-800">
                                        {DEPARTMENTS.map(dept => (
                                            <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    {/* Location */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Location</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-zinc-300">Location *</Label>
                                <Input
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    placeholder="Building A, Floor 2"
                                    className="bg-zinc-950 border-zinc-800"
                                    required
                                    data-testid="equipment-location-input"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-zinc-300">Employee Owner</Label>
                                <Input
                                    value={formData.employee_owner}
                                    onChange={(e) => setFormData({ ...formData, employee_owner: e.target.value })}
                                    className="bg-zinc-950 border-zinc-800"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Warranty */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Warranty Information</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-zinc-300">Purchase Date</Label>
                                <Input
                                    type="date"
                                    value={formData.purchase_date}
                                    onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                                    className="bg-zinc-950 border-zinc-800"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-zinc-300">Warranty Expiry</Label>
                                <Input
                                    type="date"
                                    value={formData.warranty_expiry}
                                    onChange={(e) => setFormData({ ...formData, warranty_expiry: e.target.value })}
                                    className="bg-zinc-950 border-zinc-800"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Assignment */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Assignment</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-zinc-300">Assigned Team</Label>
                                <Select 
                                    value={formData.assigned_team_id} 
                                    onValueChange={(v) => setFormData({ ...formData, assigned_team_id: v })}
                                >
                                    <SelectTrigger className="bg-zinc-950 border-zinc-800">
                                        <SelectValue placeholder="Select team" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-zinc-900 border-zinc-800">
                                        {teams.map(team => (
                                            <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-zinc-300">Default Technician</Label>
                                <Select 
                                    value={formData.default_technician_id} 
                                    onValueChange={(v) => setFormData({ ...formData, default_technician_id: v })}
                                >
                                    <SelectTrigger className="bg-zinc-950 border-zinc-800">
                                        <SelectValue placeholder="Select technician" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-zinc-900 border-zinc-800">
                                        {technicians.map(tech => (
                                            <SelectItem key={tech.id} value={tech.id}>{tech.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                        <Label className="text-zinc-300">Notes</Label>
                        <Textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            className="bg-zinc-950 border-zinc-800 min-h-[80px]"
                            placeholder="Additional notes..."
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
                            disabled={loading}
                            className="bg-orange-500 hover:bg-orange-600 text-white"
                            data-testid="save-equipment-btn"
                        >
                            {loading ? 'Saving...' : equipment ? 'Update' : 'Create'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
