export type MetricTemplate = {
    name: string;
    unit: string;
    phases: {
        name: string;
        threshold: number;
        intensity: number;
    }[];
};

export const METRIC_TEMPLATES: Record<string, MetricTemplate> = {
    reading: {
        name: "Reading",
        unit: "Pages",
        phases: [
            { name: "Quick Read", threshold: 2, intensity: 1 },
            { name: "Chapter", threshold: 5, intensity: 2 },
            { name: "Deep Dive", threshold: 20, intensity: 3 },
            { name: "Odyssey", threshold: 50, intensity: 4 },
        ]
    },
    work: {
        name: "Deep Work",
        unit: "Minutes",
        phases: [
            { name: "Warmup", threshold: 15, intensity: 1 },
            { name: "Flow State", threshold: 45, intensity: 2 },
            { name: "Deep Focus", threshold: 90, intensity: 3 },
            { name: "Monk Mode", threshold: 180, intensity: 4 },
        ]
    },
    fitness: {
        name: "Fitness",
        unit: "Reps",
        phases: [
            { name: "Movement", threshold: 10, intensity: 1 },
            { name: "Circuit", threshold: 30, intensity: 2 },
            { name: "Burn", threshold: 60, intensity: 3 },
            { name: "Limit Break", threshold: 100, intensity: 4 },
        ]
    },
    writing: {
        name: "Writing",
        unit: "Words",
        phases: [
            { name: "Note", threshold: 100, intensity: 1 },
            { name: "Draft", threshold: 500, intensity: 2 },
            { name: "Essay", threshold: 1000, intensity: 3 },
            { name: "Manuscript", threshold: 2000, intensity: 4 },
        ]
    }
};
