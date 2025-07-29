import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users } from "lucide-react"

export default function CustomersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
        <p className="text-gray-600">Manage customer accounts</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-purple-100">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <CardTitle>Customer Management</CardTitle>
              <CardDescription>
                This feature is coming soon. You&apos;ll be able to view and manage customer accounts here.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            Features will include:
          </p>
          <ul className="list-disc list-inside mt-2 space-y-1 text-gray-600">
            <li>View customer profiles</li>
            <li>Order history for each customer</li>
            <li>Customer communication tools</li>
            <li>Account status management</li>
            <li>Customer analytics and insights</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
