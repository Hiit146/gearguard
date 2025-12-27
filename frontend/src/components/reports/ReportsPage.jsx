import React, { useState, useEffect } from 'react';
import { analyticsService } from '../../services/requests';
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
    Legend,
    LineChart,
    Line,
    CartesianGrid
} from 'recharts';
import { 
    BarChart3, 
    PieChartIcon, 
    TrendingUp,
    Download,
    RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { toast } from 'sonner';

const COLORS = ['#f97316', '#3b82f6', '#10b981', '#eab308', '#ef4444', '#8b5cf6', '#ec4899'];

export const ReportsPage = () => {
    const [analytics, setAnalytics] = useState(null);
    const [categoryData, setCategoryData] = useState([]);
    const [teamData, setTeamData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
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
            toast.error('Failed to load reports');
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

    const stageData = analytics?.stage_counts ? [
        { name: 'New', value: analytics.stage_counts.new, fill: '#3b82f6' },
        { name: 'In Progress', value: analytics.stage_counts.in_progress, fill: '#eab308' },
        { name: 'Repaired', value: analytics.stage_counts.repaired, fill: '#10b981' },
        { name: 'Scrap', value: analytics.stage_counts.scrap, fill: '#ef4444' },
    ] : [];

    const requestTypeData = [
        { name: 'Corrective', value: analytics?.request_types?.corrective || 0, fill: '#ef4444' },
        { name: 'Preventive', value: analytics?.request_types?.preventive || 0, fill: '#3b82f6' },
    ];

    return (
        <div className="space-y-6" data-testid="reports-page">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Reports & Analytics</h1>
                    <p className="text-zinc-400 mt-1">Maintenance insights and performance metrics</p>
                </div>
                <Button 
                    onClick={loadData}
                    variant="outline"
                    className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                    data-testid="refresh-reports-btn"
                >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <SummaryCard 
                    title="Total Requests"
                    value={analytics?.total_requests || 0}
                    color="orange"
                />
                <SummaryCard 
                    title="Active (New + In Progress)"
                    value={(analytics?.stage_counts?.new || 0) + (analytics?.stage_counts?.in_progress || 0)}
                    color="yellow"
                />
                <SummaryCard 
                    title="Completed"
                    value={analytics?.stage_counts?.repaired || 0}
                    color="green"
                />
                <SummaryCard 
                    title="Overdue"
                    value={analytics?.overdue_count || 0}
                    color="red"
                />
            </div>

            {/* Tabs */}
            <Tabs defaultValue="overview" className="space-y-6">
                <TabsList className="bg-zinc-900 border border-zinc-800">
                    <TabsTrigger value="overview" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white">
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Overview
                    </TabsTrigger>
                    <TabsTrigger value="teams" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white">
                        <PieChartIcon className="w-4 h-4 mr-2" />
                        By Team
                    </TabsTrigger>
                    <TabsTrigger value="categories" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white">
                        <TrendingUp className="w-4 h-4 mr-2" />
                        By Category
                    </TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Request Status Distribution */}
                        <Card className="bg-zinc-900/50 border-zinc-800">
                            <CardHeader>
                                <CardTitle className="text-white">Request Status Distribution</CardTitle>
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
                                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                                labelLine={false}
                                            >
                                                {stageData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.fill} />
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
                                    <EmptyState message="No request data available" />
                                )}
                            </CardContent>
                        </Card>

                        {/* Request Type Breakdown */}
                        <Card className="bg-zinc-900/50 border-zinc-800">
                            <CardHeader>
                                <CardTitle className="text-white">Request Type Breakdown</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {requestTypeData.some(d => d.value > 0) ? (
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={requestTypeData}>
                                            <XAxis 
                                                dataKey="name" 
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
                                            />
                                            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                                {requestTypeData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <EmptyState message="No request data available" />
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Equipment Summary */}
                    <Card className="bg-zinc-900/50 border-zinc-800">
                        <CardHeader>
                            <CardTitle className="text-white">Equipment Summary</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="p-4 bg-zinc-800/50 rounded-sm">
                                    <p className="text-sm text-zinc-400">Total Equipment</p>
                                    <p className="text-3xl font-bold text-white font-mono">{analytics?.total_equipment || 0}</p>
                                </div>
                                <div className="p-4 bg-zinc-800/50 rounded-sm">
                                    <p className="text-sm text-zinc-400">Operational</p>
                                    <p className="text-3xl font-bold text-emerald-400 font-mono">
                                        {(analytics?.total_equipment || 0) - (analytics?.unusable_equipment || 0)}
                                    </p>
                                </div>
                                <div className="p-4 bg-zinc-800/50 rounded-sm">
                                    <p className="text-sm text-zinc-400">Unusable (Scrapped)</p>
                                    <p className="text-3xl font-bold text-red-400 font-mono">{analytics?.unusable_equipment || 0}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* By Team Tab */}
                <TabsContent value="teams" className="space-y-6">
                    <Card className="bg-zinc-900/50 border-zinc-800">
                        <CardHeader>
                            <CardTitle className="text-white">Requests by Team</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {teamData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={400}>
                                    <BarChart data={teamData} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                                        <XAxis type="number" stroke="#71717a" />
                                        <YAxis 
                                            type="category" 
                                            dataKey="team" 
                                            stroke="#71717a"
                                            width={150}
                                            tick={{ fill: '#a1a1aa', fontSize: 12 }}
                                        />
                                        <Tooltip 
                                            contentStyle={{ 
                                                backgroundColor: '#18181b', 
                                                border: '1px solid #27272a',
                                                borderRadius: '4px'
                                            }}
                                        />
                                        <Bar dataKey="count" fill="#f97316" radius={[0, 4, 4, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <EmptyState message="No team data available" />
                            )}
                        </CardContent>
                    </Card>

                    {/* Team Performance Table */}
                    <Card className="bg-zinc-900/50 border-zinc-800">
                        <CardHeader>
                            <CardTitle className="text-white">Team Performance</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {analytics?.team_counts?.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="data-table">
                                        <thead>
                                            <tr>
                                                <th>Team</th>
                                                <th>Total Requests</th>
                                                <th>Share</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {analytics.team_counts.map((team, index) => (
                                                <tr key={team.id || index}>
                                                    <td className="text-white">{team.name}</td>
                                                    <td className="font-mono text-orange-400">{team.count}</td>
                                                    <td className="text-zinc-400">
                                                        {analytics.total_requests > 0 
                                                            ? `${((team.count / analytics.total_requests) * 100).toFixed(1)}%`
                                                            : '0%'
                                                        }
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <EmptyState message="No team performance data available" />
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* By Category Tab */}
                <TabsContent value="categories" className="space-y-6">
                    <Card className="bg-zinc-900/50 border-zinc-800">
                        <CardHeader>
                            <CardTitle className="text-white">Requests by Equipment Category</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {categoryData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={400}>
                                    <BarChart data={categoryData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                                        <XAxis 
                                            dataKey="category" 
                                            stroke="#71717a"
                                            tick={{ fill: '#a1a1aa', fontSize: 12 }}
                                            angle={-45}
                                            textAnchor="end"
                                            height={80}
                                        />
                                        <YAxis stroke="#71717a" />
                                        <Tooltip 
                                            contentStyle={{ 
                                                backgroundColor: '#18181b', 
                                                border: '1px solid #27272a',
                                                borderRadius: '4px'
                                            }}
                                        />
                                        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                                            {categoryData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <EmptyState message="No category data available" />
                            )}
                        </CardContent>
                    </Card>

                    {/* Category Pie Chart */}
                    <Card className="bg-zinc-900/50 border-zinc-800">
                        <CardHeader>
                            <CardTitle className="text-white">Category Distribution</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {categoryData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={categoryData}
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={100}
                                            dataKey="count"
                                            nameKey="category"
                                            label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                                        >
                                            {categoryData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
                                <EmptyState message="No category data available" />
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

const SummaryCard = ({ title, value, color }) => {
    const colorClasses = {
        orange: 'text-orange-400',
        yellow: 'text-yellow-400',
        green: 'text-emerald-400',
        red: 'text-red-400'
    };

    return (
        <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="p-6">
                <p className="text-sm text-zinc-400 uppercase tracking-wider mb-2">{title}</p>
                <p className={`text-4xl font-bold font-mono ${colorClasses[color]}`}>{value}</p>
            </CardContent>
        </Card>
    );
};

const EmptyState = ({ message }) => (
    <div className="h-[300px] flex items-center justify-center text-zinc-500">
        <p>{message}</p>
    </div>
);
