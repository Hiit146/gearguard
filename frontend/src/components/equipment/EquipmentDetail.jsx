import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { equipmentService } from '../../services/equipment';
import { formatDate, getStageColor, getStageLabel, isOverdue } from '../../lib/utils';
import { 
    ArrowLeft, 
    Wrench, 
    MapPin, 
    Building2, 
    Calendar,
    User,
    Shield,
    AlertCircle,
    Clock,
    CheckCircle
} from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';

export const EquipmentDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [equipment, setEquipment] = useState(null);
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = async () => {
        try {
            const [eqData, reqData] = await Promise.all([
                equipmentService.getById(id),
                equipmentService.getRequests(id)
            ]);
            setEquipment(eqData);
            setRequests(reqData);
        } catch (error) {
            console.error('Failed to load equipment:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
            </div>
        );
    }

    if (!equipment) {
        return (
            <div className="text-center py-12">
                <AlertCircle className="w-12 h-12 mx-auto mb-4 text-zinc-500" />
                <p className="text-zinc-400">Equipment not found</p>
                <Button 
                    onClick={() => navigate('/equipment')}
                    variant="outline"
                    className="mt-4 border-zinc-700"
                >
                    Back to Equipment
                </Button>
            </div>
        );
    }

    const openRequests = requests.filter(r => r.stage !== 'repaired' && r.stage !== 'scrap');

    return (
        <div className="space-y-6" data-testid="equipment-detail">
            {/* Back Button */}
            <Button
                variant="ghost"
                onClick={() => navigate('/equipment')}
                className="text-zinc-400 hover:text-white"
            >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Equipment
            </Button>

            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-3xl font-bold text-white tracking-tight">{equipment.name}</h1>
                        {!equipment.is_usable && (
                            <Badge variant="destructive" className="bg-red-500/20 text-red-400 border-red-500">
                                Unusable
                            </Badge>
                        )}
                    </div>
                    <p className="text-zinc-400 font-mono">{equipment.serial_number}</p>
                </div>
                <Button
                    onClick={() => navigate('/requests', { state: { equipmentId: equipment.id } })}
                    className="bg-orange-500 hover:bg-orange-600 text-white"
                    data-testid="create-request-btn"
                >
                    <Wrench className="w-4 h-4 mr-2" />
                    Create Request
                    {openRequests.length > 0 && (
                        <span className="ml-2 px-1.5 py-0.5 text-xs font-bold bg-white/20 rounded">
                            {openRequests.length}
                        </span>
                    )}
                </Button>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Basic Info */}
                <Card className="bg-zinc-900/50 border-zinc-800">
                    <CardHeader>
                        <CardTitle className="text-white text-lg">Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <InfoRow icon={Building2} label="Department" value={equipment.department} />
                        <InfoRow icon={MapPin} label="Location" value={equipment.location} />
                        <InfoRow 
                            icon={Wrench} 
                            label="Category" 
                            value={<Badge variant="outline" className="border-zinc-700">{equipment.category}</Badge>} 
                        />
                        {equipment.employee_owner && (
                            <InfoRow icon={User} label="Owner" value={equipment.employee_owner} />
                        )}
                    </CardContent>
                </Card>

                {/* Warranty Info */}
                <Card className="bg-zinc-900/50 border-zinc-800">
                    <CardHeader>
                        <CardTitle className="text-white text-lg">Warranty</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <InfoRow 
                            icon={Calendar} 
                            label="Purchase Date" 
                            value={formatDate(equipment.purchase_date)} 
                        />
                        <InfoRow 
                            icon={Shield} 
                            label="Warranty Expiry" 
                            value={formatDate(equipment.warranty_expiry)} 
                        />
                    </CardContent>
                </Card>

                {/* Assignment */}
                <Card className="bg-zinc-900/50 border-zinc-800">
                    <CardHeader>
                        <CardTitle className="text-white text-lg">Assignment</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {equipment.team ? (
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded bg-zinc-800">
                                    <Shield className="w-5 h-5 text-orange-500" />
                                </div>
                                <div>
                                    <p className="text-sm text-zinc-400">Team</p>
                                    <p className="text-white">{equipment.team.name}</p>
                                </div>
                            </div>
                        ) : (
                            <p className="text-zinc-500">No team assigned</p>
                        )}
                        
                        {equipment.technician ? (
                            <div className="flex items-center gap-3">
                                <Avatar className="w-10 h-10">
                                    <AvatarImage src={equipment.technician.avatar} />
                                    <AvatarFallback className="bg-orange-500/20 text-orange-500">
                                        {equipment.technician.name?.charAt(0)}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="text-sm text-zinc-400">Default Technician</p>
                                    <p className="text-white">{equipment.technician.name}</p>
                                </div>
                            </div>
                        ) : (
                            <p className="text-zinc-500">No technician assigned</p>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Notes */}
            {equipment.notes && (
                <Card className="bg-zinc-900/50 border-zinc-800">
                    <CardHeader>
                        <CardTitle className="text-white text-lg">Notes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-zinc-300">{equipment.notes}</p>
                    </CardContent>
                </Card>
            )}

            {/* Maintenance Requests */}
            <Card className="bg-zinc-900/50 border-zinc-800">
                <CardHeader>
                    <CardTitle className="text-white text-lg flex items-center gap-2">
                        <Wrench className="w-5 h-5 text-orange-500" />
                        Maintenance Requests
                        {openRequests.length > 0 && (
                            <span className="ml-2 px-2 py-0.5 text-xs font-bold bg-orange-500 text-white rounded">
                                {openRequests.length} open
                            </span>
                        )}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {requests.length === 0 ? (
                        <div className="text-center py-8 text-zinc-500">
                            <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>No maintenance requests for this equipment</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {requests.map((req) => (
                                <RequestRow 
                                    key={req.id} 
                                    request={req}
                                    onClick={() => navigate('/requests')}
                                />
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

const InfoRow = ({ icon: Icon, label, value }) => (
    <div className="flex items-center gap-3">
        <Icon className="w-5 h-5 text-zinc-500" />
        <div>
            <p className="text-xs text-zinc-500 uppercase tracking-wider">{label}</p>
            <div className="text-white">{value || '-'}</div>
        </div>
    </div>
);

const RequestRow = ({ request, onClick }) => {
    const overdue = isOverdue(request.scheduled_date, request.stage);

    return (
        <div 
            className={`p-4 rounded-sm border cursor-pointer transition-colors ${
                overdue 
                    ? 'border-red-500/50 bg-red-500/5 hover:bg-red-500/10' 
                    : 'border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800'
            }`}
            onClick={onClick}
        >
            <div className="flex items-center justify-between">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-white font-medium">{request.subject}</span>
                        {overdue && (
                            <Badge variant="destructive" className="bg-red-500/20 text-red-400 border-red-500 text-xs">
                                OVERDUE
                            </Badge>
                        )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-zinc-400">
                        <span className="capitalize">{request.request_type}</span>
                        {request.scheduled_date && (
                            <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatDate(request.scheduled_date)}
                            </span>
                        )}
                    </div>
                </div>
                <Badge className={`${getStageColor(request.stage)} border`}>
                    {getStageLabel(request.stage)}
                </Badge>
            </div>
        </div>
    );
};
