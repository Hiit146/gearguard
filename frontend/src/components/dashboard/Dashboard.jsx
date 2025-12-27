import React, { useState, useEffect } from 'react';
import { analyticsService } from '../../services/requests';
import { equipmentService } from '../../services/equipment';
import { 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    Tooltip, 
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend
} from 'recharts';
import { 
    Wrench, 
    AlertTriangle, 
    CheckCircle, 
    Clock, 
    Trash2,
    Users,
    Package
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';

const STAGE_COLORS = {
    new: '#3b82f6',
    in_progress: '#eab308',
    repaired: '#10b981',
    scrap: '#ef4444'
};

const PIE_COLORS = ['#f97316', '#3b82f6', '#10b981', '#eab308', '#ef4444'];

export const Dashboard = () => {
    const [analytics, setAnalytics] = useState(null);
    const [categoryData, setCategoryData] = useState([]);
    const [teamData, setTeamData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [dashboardData, categoryRes, teamRes] = await Promise.all([
                analyticsService.getDashboard(),
                analyticsService.getRequestsByCategory(),
                analyticsService.getRequestsByTeam()
            ]);
            setAnalytics(dashboardData);
            setCategoryData(categoryRes.filter(c => c.category));
            setTeamData(teamRes.filter(t => t.team));
        } catch (error) {
            console.error('Failed to load analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64" data-testid="dashboard-loading">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
            </div>
        );
    }

    const stageData = analytics?.stage_counts ? [
        { name: 'New', value: analytics.stage_counts.new, color: STAGE_COLORS.new },
        { name: 'In Progress', value: analytics.stage_counts.in_progress, color: STAGE_COLORS.in_progress },
        { name: 'Repaired', value: analytics.stage_counts.repaired, color: STAGE_COLORS.repaired },
        { name: 'Scrap', value: analytics.stage_counts.scrap, color: STAGE_COLORS.scrap },
    ] : [];

    return (
        <div className="space-y-8" data-testid="dashboard">
            {/* Page Header */}
            <div>
                <h1 className="text-3xl font-bold text-white tracking-tight">Dashboard</h1>
                <p className="text-zinc-400 mt-1">Overview of your maintenance operations</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard
                    title="Total Requests"
                    value={analytics?.total_requests || 0}
                    icon={Wrench}
                    color="orange"
                    testId="stat-total-requests"
                />
                <StatsCard
                    title="Overdue"
                    value={analytics?.overdue_count || 0}
                    icon={AlertTriangle}
                    color="red"
                    testId="stat-overdue"
                />
                <StatsCard
                    title="Total Equipment"
                    value={analytics?.total_equipment || 0}
                    icon={Package}
                    color="blue"
                    testId="stat-equipment"
                />
                <StatsCard
                    title="Unusable Equipment"
                    value={analytics?.unusable_equipment || 0}
                    icon={Trash2}
                    color="zinc"
                    testId="stat-unusable"
                />
            </div>

            {/* Stage Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StageCard 
                    stage="new" 
                    count={analytics?.stage_counts?.new || 0} 
                    icon={Clock}
                    label="New"
                />
                <StageCard 
                    stage="in_progress" 
                    count={analytics?.stage_counts?.in_progress || 0} 
                    icon={Wrench}
                    label="In Progress"
                />
                <StageCard 
                    stage="repaired" 
                    count={analytics?.stage_counts?.repaired || 0} 
                    icon={CheckCircle}
                    label="Repaired"
                />
                <StageCard 
                    stage="scrap" 
                    count={analytics?.stage_counts?.scrap || 0} 
                    icon={Trash2}
                    label="Scrap"
                />
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Requests by Team */}
                <Card className="bg-zinc-900/50 border-zinc-800">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                            <Users className="w-5 h-5 text-orange-500" />
                            Requests by Team
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {teamData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={teamData} layout="vertical">
                                    <XAxis type="number" stroke="#71717a" />
                                    <YAxis 
                                        type="category" 
                                        dataKey="team" 
                                        stroke="#71717a"
                                        width={100}
                                        tick={{ fill: '#a1a1aa', fontSize: 12 }}
                                    />
                                    <Tooltip 
                                        contentStyle={{ 
                                            backgroundColor: '#18181b', 
                                            border: '1px solid #27272a',
                                            borderRadius: '4px'
                                        }}
                                        labelStyle={{ color: '#fafafa' }}
                                    />
                                    <Bar dataKey="count" fill="#f97316" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-[300px] flex items-center justify-center text-zinc-500">
                                No team data available
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Requests by Status */}
                <Card className="bg-zinc-900/50 border-zinc-800">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                            <Wrench className="w-5 h-5 text-orange-500" />
                            Requests by Status
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {stageData.some(d => d.value > 0) ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={stageData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={2}
                                        dataKey="value"
                                    >
                                        {stageData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip 
                                        contentStyle={{ 
                                            backgroundColor: '#18181b', 
                                            border: '1px solid #27272a',
                                            borderRadius: '4px'
                                        }}
                                    />
                                    <Legend 
                                        formatter={(value) => <span style={{ color: '#a1a1aa' }}>{value}</span>}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-[300px] flex items-center justify-center text-zinc-500">
                                No request data available
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Requests by Category */}
                <Card className="bg-zinc-900/50 border-zinc-800 lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                            <Package className="w-5 h-5 text-orange-500" />
                            Requests by Equipment Category
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {categoryData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={categoryData}>
                                    <XAxis 
                                        dataKey="category" 
                                        stroke="#71717a"
                                        tick={{ fill: '#a1a1aa', fontSize: 12 }}
                                    />
                                    <YAxis stroke="#71717a" />
                                    <Tooltip 
                                        contentStyle={{ 
                                            backgroundColor: '#18181b', 
                                            border: '1px solid #27272a',
                                            borderRadius: '4px'
                                        }}
                                        labelStyle={{ color: '#fafafa' }}
                                    />
                                    <Bar dataKey="count" fill="#f97316" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-[250px] flex items-center justify-center text-zinc-500">
                                No category data available
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Request Type Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-zinc-900/50 border-zinc-800">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-3 rounded-sm bg-red-500/20">
                            <AlertTriangle className="w-6 h-6 text-red-400" />
                        </div>
                        <div>
                            <p className="text-sm text-zinc-400 uppercase tracking-wider">Corrective (Breakdown)</p>
                            <p className="text-3xl font-bold text-white">{analytics?.request_types?.corrective || 0}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-zinc-900/50 border-zinc-800">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-3 rounded-sm bg-blue-500/20">
                            <Calendar className="w-6 h-6 text-blue-400" />
                        </div>
                        <div>
                            <p className="text-sm text-zinc-400 uppercase tracking-wider">Preventive (Routine)</p>
                            <p className="text-3xl font-bold text-white">{analytics?.request_types?.preventive || 0}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

const StatsCard = ({ title, value, icon: Icon, color, testId }) => {
    const colorClasses = {
        orange: 'bg-orange-500/20 text-orange-500',
        red: 'bg-red-500/20 text-red-500',
        blue: 'bg-blue-500/20 text-blue-500',
        green: 'bg-emerald-500/20 text-emerald-500',
        zinc: 'bg-zinc-500/20 text-zinc-400'
    };

    return (
        <Card className="bg-zinc-900/50 border-zinc-800 hover:border-orange-500/50 transition-colors" data-testid={testId}>
            <CardContent className="p-6 flex items-center gap-4">
                <div className={`p-3 rounded-sm ${colorClasses[color]}`}>
                    <Icon className="w-6 h-6" />
                </div>
                <div>
                    <p className="text-sm text-zinc-400 uppercase tracking-wider">{title}</p>
                    <p className="text-3xl font-bold text-white font-mono">{value}</p>
                </div>
            </CardContent>
        </Card>
    );
};

const StageCard = ({ stage, count, icon: Icon, label }) => {
    const stageStyles = {
        new: 'border-l-blue-500 bg-blue-500/5',
        in_progress: 'border-l-yellow-500 bg-yellow-500/5',
        repaired: 'border-l-emerald-500 bg-emerald-500/5',
        scrap: 'border-l-red-500 bg-red-500/5'
    };

    const iconColors = {
        new: 'text-blue-400',
        in_progress: 'text-yellow-400',
        repaired: 'text-emerald-400',
        scrap: 'text-red-400'
    };

    return (
        <Card className={`bg-zinc-900/50 border-zinc-800 border-l-4 ${stageStyles[stage]}`} data-testid={`stage-${stage}`}>
            <CardContent className="p-4 flex items-center justify-between">
                <div>
                    <p className="text-sm text-zinc-400">{label}</p>
                    <p className="text-2xl font-bold text-white font-mono">{count}</p>
                </div>
                <Icon className={`w-8 h-8 ${iconColors[stage]}`} />
            </CardContent>
        </Card>
    );
};

import { Calendar } from 'lucide-react';
