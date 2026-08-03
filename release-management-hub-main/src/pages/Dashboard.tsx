import { ArrowRight, BriefcaseBusiness, CalendarCheck, CheckCircle2, Clock3, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const metrics = [
  { label: 'Open positions', value: '24', helper: '6 closing this month', icon: BriefcaseBusiness, tone: 'text-blue-600 bg-blue-50' },
  { label: 'Active candidates', value: '186', helper: '18 added this week', icon: Users, tone: 'text-purple-600 bg-purple-50' },
  { label: 'Reviews in progress', value: '68%', helper: '42 of 62 completed', icon: CalendarCheck, tone: 'text-emerald-600 bg-emerald-50' },
  { label: 'Tasks due', value: '7', helper: '2 need attention today', icon: Clock3, tone: 'text-amber-600 bg-amber-50' },
];

const Dashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-6 lg:px-6">
      <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-blue-600">Wednesday, July 22</p>
          <h1 className="mt-1 text-2xl font-semibold text-gray-900">Good afternoon, Ananya</h1>
          <p className="mt-1 text-sm text-gray-600">Here&apos;s what&apos;s happening across your organization.</p>
        </div>
        <Button onClick={() => navigate('/performance-reviews')} className="self-start sm:self-auto">
          Open performance reviews
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(({ label, value, helper, icon: Icon, tone }) => (
          <Card key={label} className="shadow-sm">
            <CardContent className="flex items-start justify-between p-5">
              <div>
                <p className="text-sm text-gray-500">{label}</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900">{value}</p>
                <p className="mt-1 text-xs text-gray-500">{helper}</p>
              </div>
              <div className={`rounded-lg p-2.5 ${tone}`}><Icon className="h-5 w-5" /></div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-[1.6fr_1fr]">
        <Card className="shadow-sm">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base">Performance review cycle</CardTitle>
              <p className="mt-1 text-sm text-gray-500">Mid-year review · July 1–31</p>
            </div>
            <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">On track</Badge>
          </CardHeader>
          <CardContent>
            <div className="mb-2 flex justify-between text-sm">
              <span className="font-medium text-gray-700">42 of 62 reviews complete</span>
              <span className="text-gray-500">68%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-gray-100">
              <div className="h-full w-[68%] rounded-full bg-gradient-to-r from-blue-500 to-purple-500" />
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {[
                ['Self reviews', '58 / 62'],
                ['Manager reviews', '42 / 62'],
                ['Calibrations', '12 / 18'],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border bg-gray-50/60 p-3">
                  <p className="text-xs text-gray-500">{label}</p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">{value}</p>
                </div>
              ))}
            </div>
            <Button variant="link" className="mt-3 h-auto p-0 text-blue-600" onClick={() => navigate('/performance-reviews')}>
              View performance reviews <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader><CardTitle className="text-base">Today&apos;s priorities</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {[
              ['Approve 3 offer letters', 'Recruiting'],
              ['Review payroll variance', 'Payroll'],
              ['Complete manager calibration', 'Performance'],
              ['Publish onboarding checklist', 'Employee Experience'],
            ].map(([title, category], index) => (
              <div key={title} className="flex items-start gap-3">
                <CheckCircle2 className={`mt-0.5 h-4 w-4 ${index === 0 ? 'text-blue-600' : 'text-gray-300'}`} />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800">{title}</p>
                  <p className="text-xs text-gray-500">{category}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
