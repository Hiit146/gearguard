import React, { useState, useEffect } from 'react';
import { teamsService, usersService } from '../../services/teams';
import { 
    Plus, 
    Search, 
    Users, 
    Edit2, 
    Trash2,
    User,
    Shield
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
import { Textarea } from '../ui/textarea';
import { Checkbox } from '../ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { toast } from 'sonner';

export const TeamsList = () => {
    const [teams, setTeams] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [deleteItem, setDeleteItem] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [teamData, userData] = await Promise.all([
                teamsService.getAll(),
                usersService.getTechnicians()
            ]);
            setTeams(teamData);
            setUsers(userData);
        } catch (error) {
            toast.error('Failed to load teams');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteItem) return;
        try {
            await teamsService.delete(deleteItem.id);
            setTeams(teams.filter(t => t.id !== deleteItem.id));
            toast.success('Team deleted');
            setDeleteItem(null);
        } catch (error) {
            toast.error('Failed to delete team');
        }
    };

    const filteredTeams = teams.filter(team =>
        team.name.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6" data-testid="teams-list">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Maintenance Teams</h1>
                    <p className="text-zinc-400 mt-1">Manage your maintenance team assignments</p>
                </div>
                <Button 
                    onClick={() => { setEditItem(null); setShowForm(true); }}
                    className="bg-orange-500 hover:bg-orange-600 text-white rounded-sm uppercase tracking-wider font-bold"
                    data-testid="add-team-btn"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Team
                </Button>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <Input
                    placeholder="Search teams..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 bg-zinc-900 border-zinc-800"
                    data-testid="team-search"
                />
            </div>

            {/* Teams Grid */}
            {filteredTeams.length === 0 ? (
                <div className="text-center py-12 text-zinc-400">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No teams found</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredTeams.map((team) => (
                        <TeamCard
                            key={team.id}
                            team={team}
                            onEdit={() => { setEditItem(team); setShowForm(true); }}
                            onDelete={() => setDeleteItem(team)}
                        />
                    ))}
                </div>
            )}

            {/* Form Dialog */}
            <TeamFormDialog
                open={showForm}
                onClose={() => { setShowForm(false); setEditItem(null); }}
                team={editItem}
                users={users}
                onSave={() => { loadData(); setShowForm(false); setEditItem(null); }}
            />

            {/* Delete Confirmation */}
            <AlertDialog open={!!deleteItem} onOpenChange={() => setDeleteItem(null)}>
                <AlertDialogContent className="bg-zinc-900 border-zinc-800">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-white">Delete Team</AlertDialogTitle>
                        <AlertDialogDescription className="text-zinc-400">
                            Are you sure you want to delete "{deleteItem?.name}"? Team members will be unassigned.
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

const TeamCard = ({ team, onEdit, onDelete }) => {
    return (
        <Card 
            className="bg-zinc-900/50 border-zinc-800 hover:border-orange-500/50 transition-colors"
            data-testid={`team-card-${team.id}`}
        >
            <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded bg-orange-500/20">
                            <Shield className="w-6 h-6 text-orange-500" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-white">{team.name}</h3>
                            {team.description && (
                                <p className="text-sm text-zinc-500 line-clamp-1">{team.description}</p>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <Button
                            size="icon"
                            variant="ghost"
                            onClick={onEdit}
                            className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-800"
                            data-testid={`edit-team-${team.id}`}
                        >
                            <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                            size="icon"
                            variant="ghost"
                            onClick={onDelete}
                            className="h-8 w-8 text-zinc-400 hover:text-red-400 hover:bg-red-500/10"
                            data-testid={`delete-team-${team.id}`}
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                {/* Members */}
                <div className="border-t border-zinc-800 pt-4 mt-4">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-zinc-400">Team Members</span>
                        <Badge variant="outline" className="border-zinc-700 text-zinc-300">
                            {team.members?.length || 0} members
                        </Badge>
                    </div>
                    
                    {team.members?.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {team.members.slice(0, 5).map((member) => (
                                <div 
                                    key={member.id}
                                    className="flex items-center gap-2 px-2 py-1 bg-zinc-800 rounded"
                                >
                                    <Avatar className="w-5 h-5">
                                        <AvatarImage src={member.avatar} />
                                        <AvatarFallback className="bg-orange-500/20 text-orange-500 text-xs">
                                            {member.name?.charAt(0)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <span className="text-sm text-zinc-300">{member.name}</span>
                                </div>
                            ))}
                            {team.members.length > 5 && (
                                <span className="text-sm text-zinc-500 self-center">
                                    +{team.members.length - 5} more
                                </span>
                            )}
                        </div>
                    ) : (
                        <p className="text-sm text-zinc-500">No members assigned</p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

const TeamFormDialog = ({ open, onClose, team, users, onSave }) => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        member_ids: []
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (team) {
            setFormData({
                name: team.name || '',
                description: team.description || '',
                member_ids: team.member_ids || []
            });
        } else {
            setFormData({
                name: '',
                description: '',
                member_ids: []
            });
        }
    }, [team, open]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (team) {
                await teamsService.update(team.id, formData);
                toast.success('Team updated');
            } else {
                await teamsService.create(formData);
                toast.success('Team created');
            }
            onSave();
        } catch (error) {
            toast.error('Failed to save team');
        } finally {
            setLoading(false);
        }
    };

    const toggleMember = (userId) => {
        setFormData(prev => ({
            ...prev,
            member_ids: prev.member_ids.includes(userId)
                ? prev.member_ids.filter(id => id !== userId)
                : [...prev.member_ids, userId]
        }));
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="bg-zinc-900 border-zinc-800 max-w-lg">
                <DialogHeader>
                    <DialogTitle className="text-white text-xl">
                        {team ? 'Edit Team' : 'Create Team'}
                    </DialogTitle>
                </DialogHeader>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <Label className="text-zinc-300">Team Name *</Label>
                        <Input
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g., Electricians"
                            className="bg-zinc-950 border-zinc-800"
                            required
                            data-testid="team-name-input"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-zinc-300">Description</Label>
                        <Textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Team description..."
                            className="bg-zinc-950 border-zinc-800"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-zinc-300">Team Members</Label>
                        <div className="border border-zinc-800 rounded-sm max-h-48 overflow-y-auto">
                            {users.length === 0 ? (
                                <p className="p-4 text-zinc-500 text-sm">No technicians available</p>
                            ) : (
                                users.map((user) => (
                                    <div
                                        key={user.id}
                                        className="flex items-center gap-3 p-3 hover:bg-zinc-800 cursor-pointer border-b border-zinc-800 last:border-0"
                                        onClick={() => toggleMember(user.id)}
                                    >
                                        <Checkbox
                                            checked={formData.member_ids.includes(user.id)}
                                            onCheckedChange={() => toggleMember(user.id)}
                                        />
                                        <Avatar className="w-8 h-8">
                                            <AvatarImage src={user.avatar} />
                                            <AvatarFallback className="bg-orange-500/20 text-orange-500 text-xs">
                                                {user.name?.charAt(0)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1">
                                            <p className="text-sm text-white">{user.name}</p>
                                            <p className="text-xs text-zinc-500 capitalize">{user.role}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
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
                            data-testid="save-team-btn"
                        >
                            {loading ? 'Saving...' : team ? 'Update' : 'Create'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
