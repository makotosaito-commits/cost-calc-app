

function cn(...classes: (string | undefined | null | false)[]) {
    return classes.filter(Boolean).join(' ');
}

interface SegmentedControlProps {
    options: string[];
    value: string;
    onChange: (value: string) => void;
    className?: string;
}

export const SegmentedControl = ({ options, value, onChange, className }: SegmentedControlProps) => {
    return (
        <div className={cn("inline-flex h-10 items-center justify-center rounded-xl bg-secondary p-1 text-muted-foreground", className)}>
            {options.map((option) => (
                <button
                    key={option}
                    onClick={() => onChange(option)}
                    type="button"
                    className={cn(
                        "inline-flex flex-1 items-center justify-center whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50",
                        value === option
                            ? "bg-background text-foreground border border-border"
                            : "hover:bg-muted/60 hover:text-foreground"
                    )}
                >
                    {option}
                </button>
            ))}
        </div>
    );
};
