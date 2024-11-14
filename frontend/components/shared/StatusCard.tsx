import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface StatusCardProps {
    number: string;
    title: string;
    stats: { label: string; value: string }[];
    buttonText: string;
    href: string;
    workflowStatus: number;
    currentStatus?: number;
}

const StatusCard = ({ number, title, stats, buttonText, href, workflowStatus, currentStatus }: StatusCardProps) => {
    const isActive = currentStatus === workflowStatus;
    const isAccessible = currentStatus !== undefined && currentStatus >= workflowStatus;
    const isPast = currentStatus !== undefined && currentStatus > workflowStatus;

    return (
        <Card 
            className={`w-full ${
                isActive 
                    ? "gradient-border" 
                    : isAccessible 
                        ? "border border-gray-200 dark:border-gray-800" 
                        : "opacity-50 border border-gray-200 dark:border-gray-800"
            }`}
        >
            <CardHeader>
                <CardTitle className="flex gap-2">
                    <span className={isActive ? "text-blue-500" : "text-gray-500"}>{number}</span>
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    {stats.map((stat, index) => (
                        <div key={index} className="flex justify-between text-sm">
                            <span className="text-muted-foreground">{stat.label}:</span>
                            <span className="font-medium">{stat.value}</span>
                        </div>
                    ))}
                </div>
                <div className="mt-4">
                    {(isActive || isPast) ? (
                        <Link 
                            href={href} 
                            className="block w-full transition-all duration-300 hover:ring-2 hover:ring-white/60 hover:ring-offset-2 hover:ring-offset-background rounded-md"
                        >
                            <Button 
                                className={`w-full ${
                                    isActive 
                                        ? "bg-slate-300 text-black/100 font-medium shadow-lg shadow-slate-600/80 border-none hover:bg-white-600" 
                                        : ""
                                }`}
                                variant={isActive ? "default" : "outline"}
                            >
                                {buttonText}
                            </Button>
                        </Link>
                    ) : (
                        <Button 
                            className="w-full opacity-50 cursor-not-allowed"
                            variant="outline"
                            disabled
                        >
                            {buttonText}
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default StatusCard; 