import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ShoppingCart } from "lucide-react"

export default function OrdersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
        <p className="text-gray-600">Manage customer orders</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-blue-100">
              <ShoppingCart className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <CardTitle>Order Management</CardTitle>
              <CardDescription>
                This feature is coming soon. You&apos;ll be able to view and manage customer orders here.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            Features will include:
          </p>
          <ul className="list-disc list-inside mt-2 space-y-1 text-gray-600">
            <li>View all customer orders</li>
            <li>Update order status</li>
            <li>Process refunds</li>
            <li>Generate shipping labels</li>
            <li>Order analytics and reporting</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
