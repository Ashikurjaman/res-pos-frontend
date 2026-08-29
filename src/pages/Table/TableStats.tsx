import {
  LayoutGrid,
  CircleCheck,
  CircleX,
  Clock,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

interface TableStatsProps {
  stats: {
    total: number;
    available: number;
    occupied: number;
    reserved: number;
  };
}

export default function TableStats({ stats }: TableStatsProps) {
  const statItems = [
    {
      label: "Total Tables",
      value: stats.total,
      icon: LayoutGrid,
      color: "bg-blue-500",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
      textColor: "text-blue-600 dark:text-blue-400",
      borderColor: "border-blue-200 dark:border-blue-800",
      ringColor: "ring-blue-500 dark:ring-blue-400",
      progressColor: "bg-blue-500 dark:bg-blue-400",
    },
    {
      label: "Available",
      value: stats.available,
      icon: CircleCheck,
      color: "bg-green-500",
      bgColor: "bg-green-50 dark:bg-green-900/20",
      textColor: "text-green-600 dark:text-green-400",
      borderColor: "border-green-200 dark:border-green-800",
      ringColor: "ring-green-500 dark:ring-green-400",
      progressColor: "bg-green-500 dark:bg-green-400",
      percentage:
        stats.total > 0 ? Math.round((stats.available / stats.total) * 100) : 0,
    },
    {
      label: "Occupied",
      value: stats.occupied,
      icon: CircleX,
      color: "bg-red-500",
      bgColor: "bg-red-50 dark:bg-red-900/20",
      textColor: "text-red-600 dark:text-red-400",
      borderColor: "border-red-200 dark:border-red-800",
      ringColor: "ring-red-500 dark:ring-red-400",
      progressColor: "bg-red-500 dark:bg-red-400",
      percentage:
        stats.total > 0 ? Math.round((stats.occupied / stats.total) * 100) : 0,
    },
    {
      label: "Reserved",
      value: stats.reserved,
      icon: Clock,
      color: "bg-yellow-500",
      bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
      textColor: "text-yellow-600 dark:text-yellow-400",
      borderColor: "border-yellow-200 dark:border-yellow-800",
      ringColor: "ring-yellow-500 dark:ring-yellow-400",
      progressColor: "bg-yellow-500 dark:bg-yellow-400",
      percentage:
        stats.total > 0 ? Math.round((stats.reserved / stats.total) * 100) : 0,
    },
  ];

  const getStatusColor = (label: string) => {
    switch (label) {
      case "Available":
        return "text-green-600 dark:text-green-400";
      case "Occupied":
        return "text-red-600 dark:text-red-400";
      case "Reserved":
        return "text-yellow-600 dark:text-yellow-400";
      default:
        return "text-blue-600 dark:text-blue-400";
    }
  };

  const getProgressColor = (label: string) => {
    switch (label) {
      case "Available":
        return "bg-green-500 dark:bg-green-400";
      case "Occupied":
        return "bg-red-500 dark:bg-red-400";
      case "Reserved":
        return "bg-yellow-500 dark:bg-yellow-400";
      default:
        return "bg-blue-500 dark:bg-blue-400";
    }
  };

  const getStatusIcon = (label: string) => {
    switch (label) {
      case "Available":
        return (
          <CircleCheck
            size={14}
            className="text-green-500 dark:text-green-400"
          />
        );
      case "Occupied":
        return <CircleX size={14} className="text-red-500 dark:text-red-400" />;
      case "Reserved":
        return (
          <Clock size={14} className="text-yellow-500 dark:text-yellow-400" />
        );
      default:
        return null;
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {statItems.map((item, index) => (
        <div
          key={item.label}
          className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border ${item.borderColor} p-5 hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg`}
          style={{ animationDelay: `${index * 100}ms` }}
          role="stat"
          aria-label={`${item.label}: ${item.value}`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                  {item.label}
                </p>
                {item.percentage !== undefined && (
                  <span
                    className={`text-xs font-semibold ${getStatusColor(item.label)}`}
                  >
                    {item.percentage}%
                  </span>
                )}
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1 tracking-tight">
                {item.value}
              </p>
              {item.percentage !== undefined && (
                <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${getProgressColor(item.label)}`}
                    style={{
                      width: `${item.percentage}%`,
                      transition: "width 1s ease-in-out",
                    }}
                    role="progressbar"
                    aria-label={`${item.label} percentage: ${item.percentage}%`}
                    aria-valuenow={item.percentage}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  />
                </div>
              )}
            </div>
            <div
              className={`${item.bgColor} p-3 rounded-xl flex items-center justify-center ring-2 ring-offset-2 ${item.ringColor} ring-opacity-20 dark:ring-opacity-30 flex-shrink-0 ml-3`}
            >
              <item.icon
                className={`${item.textColor}`}
                size={24}
                aria-hidden="true"
              />
            </div>
          </div>

          {/* Mini trend indicator */}
          {item.label !== "Total Tables" && (
            <div className="mt-3 flex items-center gap-1">
              <span
                className={`text-xs ${item.value > 0 ? "text-green-600 dark:text-green-400" : "text-gray-400 dark:text-gray-500"}`}
              >
                {item.value > 0 ? (
                  <span className="flex items-center gap-1">
                    <TrendingUp size={12} aria-hidden="true" />
                    {getStatusIcon(item.label)}
                    {item.value} Active
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <TrendingDown size={12} aria-hidden="true" />
                    None
                  </span>
                )}
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
