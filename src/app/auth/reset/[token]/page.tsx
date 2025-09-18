import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import ResetClient from "./reset-client"

interface PageProps { params: Promise<{ token: string }> }

export default async function ResetPage({ params }: PageProps) {
  const session = await getServerSession(authOptions)
  if (session) redirect("/")
  const { token } = await params
  return <ResetClient token={token} />
}

