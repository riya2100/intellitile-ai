import { useGetDashboardStats, useGetPopularRooms, useGetDesignTrends } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { Box, Sparkles, Image as ImageIcon, MessageSquare, TrendingUp, Layers } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: roomsData, isLoading: roomsLoading } = useGetPopularRooms();
  const { data: trendsData, isLoading: trendsLoading } = useGetDesignTrends();

  // Color palette for charts matching theme
  const chartColor = "hsl(var(--primary))";
  const areaColor = "hsl(var(--chart-2))";

  return (
    <div className="container mx-auto px-4 py-8 bg-muted/10 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-bold">Analytics & Insights</h1>
        <p className="text-muted-foreground">Platform usage metrics and AI-driven design trends.</p>
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title="Total Tiles" 
          value={stats?.totalTiles} 
          icon={Box} 
          isLoading={statsLoading} 
          description="In catalog"
        />
        <StatCard 
          title="AI Recommendations" 
          value={stats?.totalRecommendations} 
          icon={Sparkles} 
          isLoading={statsLoading} 
          description="Generated for users"
        />
        <StatCard 
          title="Room Visualizations" 
          value={stats?.totalVisualizations} 
          icon={ImageIcon} 
          isLoading={statsLoading} 
          description="Renders created"
        />
        <StatCard 
          title="Design Chats" 
          value={stats?.totalConversations} 
          icon={MessageSquare} 
          isLoading={statsLoading} 
          description="Active sessions"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column: Charts */}
        <div className="lg:col-span-2 space-y-8">
          {/* Popular Rooms Chart */}
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="font-serif">Popular Room Configurations</CardTitle>
              <CardDescription>Most frequently visualized and searched room types</CardDescription>
            </CardHeader>
            <CardContent>
              {roomsLoading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : (
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={roomsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="room" 
                        axisLine={false} 
                        tickLine={false} 
                        tickFormatter={(val) => val.replace('_', ' ')}
                        style={{ fontSize: '12px', textTransform: 'capitalize' }}
                      />
                      <YAxis axisLine={false} tickLine={false} style={{ fontSize: '12px' }} />
                      <Tooltip 
                        cursor={{ fill: 'hsl(var(--muted))' }}
                        contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                        formatter={(value) => [`${value} searches`, 'Volume']}
                        labelFormatter={(label) => label.replace('_', ' ').toUpperCase()}
                      />
                      <Bar 
                        dataKey="count" 
                        fill={chartColor} 
                        radius={[4, 4, 0, 0]} 
                        barSize={40}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Trend Momentum (Mocked Line Chart) */}
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="font-serif">Platform Activity Trend</CardTitle>
              <CardDescription>AI queries and visualizer usage over the last 7 days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={mockActivityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorActivity" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={areaColor} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={areaColor} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} style={{ fontSize: '12px' }} />
                    <YAxis axisLine={false} tickLine={false} style={{ fontSize: '12px' }} />
                    <Tooltip contentStyle={{ borderRadius: '8px' }} />
                    <Area type="monotone" dataKey="requests" stroke={areaColor} strokeWidth={3} fillOpacity={1} fill="url(#colorActivity)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Emerging Trends */}
        <div className="lg:col-span-1">
          <Card className="border-border/50 shadow-sm h-full">
            <CardHeader>
              <CardTitle className="font-serif flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" /> Emerging Design Trends
              </CardTitle>
              <CardDescription>Based on AI semantic analysis of user queries</CardDescription>
            </CardHeader>
            <CardContent>
              {trendsLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-6">
                  {trendsData?.map((trend, i) => (
                    <div key={i} className="group border-b last:border-0 pb-5 last:pb-0 border-border/50">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors capitalize">{trend.trend}</h4>
                        <Badge variant="secondary" className="bg-primary/10 text-primary">Score: {trend.score}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                        {trend.description}
                      </p>
                      {trend.exampleTileIds && (
                        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                          <Layers className="h-3 w-3" /> Related Tiles: {trend.exampleTileIds.join(", ")}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, isLoading, description }: any) {
  return (
    <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow bg-card">
      <CardContent className="p-6">
        <div className="flex items-center justify-between space-x-4">
          <div className="flex items-center justify-center p-3 bg-primary/10 rounded-xl">
            <Icon className="h-6 w-6 text-primary" />
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
            {isLoading ? (
              <Skeleton className="h-8 w-20 ml-auto" />
            ) : (
              <h2 className="text-3xl font-bold tracking-tight text-foreground">{value?.toLocaleString() || "0"}</h2>
            )}
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-border/50">
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}

const mockActivityData = [
  { day: 'Mon', requests: 120 },
  { day: 'Tue', requests: 210 },
  { day: 'Wed', requests: 180 },
  { day: 'Thu', requests: 290 },
  { day: 'Fri', requests: 340 },
  { day: 'Sat', requests: 410 },
  { day: 'Sun', requests: 380 },
];