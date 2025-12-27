import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
    return twMerge(clsx(inputs));
}

export function formatDate(dateString) {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

export function isOverdue(scheduledDate, stage) {
    if (!scheduledDate || stage === 'repaired' || stage === 'scrap') return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const scheduled = new Date(scheduledDate);
    scheduled.setHours(0, 0, 0, 0);
    return scheduled < today;
}

export function getStageColor(stage) {
    const colors = {
        new: 'bg-blue-500/20 text-blue-400 border-blue-500',
        in_progress: 'bg-yellow-500/20 text-yellow-400 border-yellow-500',
        repaired: 'bg-emerald-500/20 text-emerald-400 border-emerald-500',
        scrap: 'bg-red-500/20 text-red-400 border-red-500'
    };
    return colors[stage] || colors.new;
}

export function getStageLabel(stage) {
    const labels = {
        new: 'New',
        in_progress: 'In Progress',
        repaired: 'Repaired',
        scrap: 'Scrap'
    };
    return labels[stage] || stage;
}

export function getPriorityColor(priority) {
    const colors = {
        high: 'text-red-400',
        medium: 'text-yellow-400',
        low: 'text-emerald-400'
    };
    return colors[priority] || colors.medium;
}
