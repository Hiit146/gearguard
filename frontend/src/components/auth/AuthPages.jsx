import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Shield, Mail, Lock, User, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

export const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await login(email, password);
            toast.success('Welcome back!');
            navigate('/');
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex" data-testid="login-page">
            {/* Left Panel - Background */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
                <div 
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ 
                        backgroundImage: 'url(https://images.unsplash.com/photo-1671351966431-6890f7dedcd7?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Njd8MHwxfHNlYXJjaHwzfHxkYXJrJTIwaW5kdXN0cmlhbCUyMGZhY3RvcnklMjBpbnRlcmlvcnxlbnwwfHx8fDE3NjY4MTI5ODJ8MA&ixlib=rb-4.1.0&q=85)'
                    }}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/80 to-transparent" />
                <div className="relative z-10 flex flex-col justify-center p-12">
                    <div className="flex items-center gap-3 mb-8">
                        <Shield className="w-10 h-10 text-orange-500" />
                        <span className="text-3xl font-bold text-white tracking-tight">GearGuard</span>
                    </div>
                    <h1 className="text-4xl font-bold text-white mb-4 leading-tight">
                        Industrial-Grade<br />Maintenance Tracking
                    </h1>
                    <p className="text-zinc-400 text-lg max-w-md">
                        Streamline equipment maintenance, manage teams, and keep your operations running at peak efficiency.
                    </p>
                </div>
            </div>

            {/* Right Panel - Login Form */}
            <div className="flex-1 flex items-center justify-center p-8 bg-zinc-950">
                <div className="w-full max-w-md">
                    <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
                        <Shield className="w-8 h-8 text-orange-500" />
                        <span className="text-2xl font-bold text-white">GearGuard</span>
                    </div>
                    
                    <div className="glass-overlay rounded-sm p-8">
                        <h2 className="text-2xl font-bold text-white mb-2">Sign In</h2>
                        <p className="text-zinc-400 mb-8">Enter your credentials to access the system</p>
                        
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-zinc-300">Email</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                                    <Input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="operator@gearguard.com"
                                        className="pl-10 bg-zinc-900 border-zinc-800 focus:border-orange-500"
                                        required
                                        data-testid="login-email-input"
                                    />
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-zinc-300">Password</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                                    <Input
                                        id="password"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="pl-10 bg-zinc-900 border-zinc-800 focus:border-orange-500"
                                        required
                                        data-testid="login-password-input"
                                    />
                                </div>
                            </div>
                            
                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold uppercase tracking-wider rounded-sm h-12 btn-press"
                                data-testid="login-submit-btn"
                            >
                                {loading ? 'Signing In...' : 'Sign In'}
                                <ArrowRight className="ml-2 w-5 h-5" />
                            </Button>
                        </form>
                        
                        <div className="mt-6 text-center">
                            <p className="text-zinc-400">
                                Don't have an account?{' '}
                                <Link to="/register" className="text-orange-500 hover:text-orange-400 font-medium">
                                    Register
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const RegisterPage = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('user');
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await register(name, email, password, role);
            toast.success('Account created successfully!');
            navigate('/');
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex" data-testid="register-page">
            {/* Left Panel - Background */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
                <div 
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ 
                        backgroundImage: 'url(https://images.unsplash.com/photo-1671351966431-6890f7dedcd7?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Njd8MHwxfHNlYXJjaHwzfHxkYXJrJTIwaW5kdXN0cmlhbCUyMGZhY3RvcnklMjBpbnRlcmlvcnxlbnwwfHx8fDE3NjY4MTI5ODJ8MA&ixlib=rb-4.1.0&q=85)'
                    }}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/80 to-transparent" />
                <div className="relative z-10 flex flex-col justify-center p-12">
                    <div className="flex items-center gap-3 mb-8">
                        <Shield className="w-10 h-10 text-orange-500" />
                        <span className="text-3xl font-bold text-white tracking-tight">GearGuard</span>
                    </div>
                    <h1 className="text-4xl font-bold text-white mb-4 leading-tight">
                        Join Your<br />Maintenance Team
                    </h1>
                    <p className="text-zinc-400 text-lg max-w-md">
                        Create an account to start managing equipment and maintenance requests.
                    </p>
                </div>
            </div>

            {/* Right Panel - Register Form */}
            <div className="flex-1 flex items-center justify-center p-8 bg-zinc-950">
                <div className="w-full max-w-md">
                    <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
                        <Shield className="w-8 h-8 text-orange-500" />
                        <span className="text-2xl font-bold text-white">GearGuard</span>
                    </div>
                    
                    <div className="glass-overlay rounded-sm p-8">
                        <h2 className="text-2xl font-bold text-white mb-2">Create Account</h2>
                        <p className="text-zinc-400 mb-8">Fill in your details to get started</p>
                        
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-zinc-300">Full Name</Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                                    <Input
                                        id="name"
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="John Smith"
                                        className="pl-10 bg-zinc-900 border-zinc-800 focus:border-orange-500"
                                        required
                                        data-testid="register-name-input"
                                    />
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-zinc-300">Email</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                                    <Input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="operator@gearguard.com"
                                        className="pl-10 bg-zinc-900 border-zinc-800 focus:border-orange-500"
                                        required
                                        data-testid="register-email-input"
                                    />
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-zinc-300">Password</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                                    <Input
                                        id="password"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="pl-10 bg-zinc-900 border-zinc-800 focus:border-orange-500"
                                        required
                                        minLength={6}
                                        data-testid="register-password-input"
                                    />
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <Label htmlFor="role" className="text-zinc-300">Role</Label>
                                <Select value={role} onValueChange={setRole}>
                                    <SelectTrigger className="bg-zinc-900 border-zinc-800" data-testid="register-role-select">
                                        <SelectValue placeholder="Select your role" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-zinc-900 border-zinc-800">
                                        <SelectItem value="user">User</SelectItem>
                                        <SelectItem value="technician">Technician</SelectItem>
                                        <SelectItem value="manager">Manager</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            
                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold uppercase tracking-wider rounded-sm h-12 btn-press"
                                data-testid="register-submit-btn"
                            >
                                {loading ? 'Creating Account...' : 'Create Account'}
                                <ArrowRight className="ml-2 w-5 h-5" />
                            </Button>
                        </form>
                        
                        <div className="mt-6 text-center">
                            <p className="text-zinc-400">
                                Already have an account?{' '}
                                <Link to="/login" className="text-orange-500 hover:text-orange-400 font-medium">
                                    Sign In
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
