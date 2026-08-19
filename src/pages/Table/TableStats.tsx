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
      bgColor: "bg-blue-50",
      textColor: "text-blue-600",
      borderColor: "border-blue-200",
      ringColor: "ring-blue-500",
    },
    {
      label: "Available",
      value: stats.available,
      icon: CircleCheck,
      color: "bg-green-500",
      bgColor: "bg-green-50",
      textColor: "text-green-600",
      borderColor: "border-green-200",
      ringColor: "ring-green-500",
      percentage:
        stats.total > 0 ? Math.round((stats.available / stats.total) * 100) : 0,
    },
    {
      label: "Occupied",
      value: stats.occupied,
      icon: CircleX,
      color: "bg-red-500",
      bgColor: "bg-red-50",
      textColor: "text-red-600",
      borderColor: "border-red-200",
      ringColor: "ring-red-500",
      percentage:
        stats.total > 0 ? Math.round((stats.occupied / stats.total) * 100) : 0,
    },
    {
      label: "Reserved",
      value: stats.reserved,
      icon: Clock,
      color: "bg-yellow-500",
      bgColor: "bg-yellow-50",
      textColor: "text-yellow-600",
      borderColor: "border-yellow-200",
      ringColor: "ring-yellow-500",
      percentage:
        stats.total > 0 ? Math.round((stats.reserved / stats.total) * 100) : 0,
    },
  ];

  const getStatusColor = (label: string) => {
    switch (label) {
      case "Available":
        return "text-green-600";
      case "Occupied":
        return "text-red-600";
      case "Reserved":
        return "text-yellow-600";
      default:
        return "text-blue-600";
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {statItems.map((item, index) => (
        <div
          key={item.label}
          className={`bg-white rounded-xl shadow-sm border ${item.borderColor} p-5 hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 animate-fadeIn`}
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-gray-500">
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
              <p className="text-3xl font-bold text-gray-900 mt-1 tracking-tight">
                {item.value}
              </p>
              {item.percentage !== undefined && (
                <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${
                      item.label === "Available"
                        ? "bg-green-500"
                        : item.label === "Occupied"
                          ? "bg-red-500"
                          : "bg-yellow-500"
                    }`}
                    style={{
                      width: `${item.percentage}%`,
                      transition: "width 1s ease-in-out",
                    }}
                  />
                </div>
              )}
            </div>
            <div
              className={`${item.bgColor} p-3 rounded-xl flex items-center justify-center ring-2 ring-offset-2 ${item.ringColor} ring-opacity-20`}
            >
              <item.icon className={`${item.textColor}`} size={24} />
            </div>
          </div>

          {/* Mini trend indicator (optional) */}
          {item.label !== "Total Tables" && (
            <div className="mt-3 flex items-center gap-1">
              <span
                className={`text-xs ${item.value > 0 ? "text-green-600" : "text-gray-400"}`}
              >
                {item.value > 0 ? (
                  <span className="flex items-center gap-1">
                    <TrendingUp size={12} />
                    Active
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <TrendingDown size={12} />
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
